// The only functions screens use to read and change parish data.
// Thrown Error messages are codes the apps translate: 'massNotOnDate', 'massOutOfRange'.
import { parishClock, parishTimeToIso } from '../parish';
import { addDays, weekdayOf } from '../schedule';
import type {
  Announcement,
  CertificateRequest,
  MassIntention,
  ParishEvent,
  RequestStatus,
  RosterEntry,
  Service,
} from '../types';
import {
  announcementInputSchema,
  certificateInputSchema,
  eventInputSchema,
  intentionInputSchema,
  rosterInputSchema,
  serviceInputSchema,
  type AnnouncementInput,
  type CertificateInput,
  type EventInput,
  type IntentionInput,
  type RosterInput,
  type ServiceInput,
} from '../validation';
import { newId, read, write } from './store';

const byTime = (a: Service, b: Service) => a.day - b.day || a.time.localeCompare(b.time);
const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

function upsert<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((existing) => existing.id === item.id);
  if (index === -1) list.push(item);
  else list[index] = item;
}

function remove<T extends { id: string }>(list: T[], id: string) {
  const index = list.findIndex((item) => item.id === id);
  if (index !== -1) list.splice(index, 1);
}

// Timetable

export const listServices = () => read((d) => [...d.services].sort(byTime));

export const saveService = (input: ServiceInput, id?: string) =>
  write((d) => {
    const parsed = serviceInputSchema.parse(input);
    const service: Service = {
      id: id ?? newId(),
      kind: parsed.kind,
      day: parsed.day as Service['day'],
      time: parsed.time,
      language: parsed.language,
      place: parsed.place ? { en: parsed.place } : undefined,
      note: parsed.note ? { en: parsed.note } : undefined,
    };
    upsert(d.services, service);
    return service;
  });

export const deleteService = (id: string) => write((d) => remove(d.services, id));

// Announcements

export const listAnnouncements = () =>
  read((d) =>
    [...d.announcements].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt),
    ),
  );

export const getAnnouncement = (id: string) => read((d) => d.announcements.find((a) => a.id === id) ?? null);

export const saveAnnouncement = (input: AnnouncementInput, id?: string) =>
  write((d) => {
    const parsed = announcementInputSchema.parse(input);
    const existing = d.announcements.find((a) => a.id === id);
    const announcement: Announcement = {
      id: id ?? newId(),
      ...parsed,
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    };
    upsert(d.announcements, announcement);
    return announcement;
  });

export const deleteAnnouncement = (id: string) => write((d) => remove(d.announcements, id));

// Events

export const listEvents = () => read((d) => [...d.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));

export const getEvent = (id: string) => read((d) => d.events.find((e) => e.id === id) ?? null);

export const saveEvent = (input: EventInput, id?: string) =>
  write((d) => {
    const parsed = eventInputSchema.parse(input);
    const event: ParishEvent = {
      id: id ?? newId(),
      title: parsed.title,
      description: parsed.description,
      startsAt: parishTimeToIso(parsed.date, parsed.time),
      place: parsed.place ? { en: parsed.place } : undefined,
    };
    upsert(d.events, event);
    return event;
  });

export const deleteEvent = (id: string) => write((d) => remove(d.events, id));

// Mass intentions

export const listIntentions = () => read((d) => [...d.intentions].sort(newestFirst));

export const submitIntention = (input: IntentionInput) =>
  write((d) => {
    const parsed = intentionInputSchema.parse(input);
    const service = d.services.find((s) => s.id === parsed.serviceId);
    if (!service || weekdayOf(parsed.massDate) !== service.day) {
      throw new Error('massNotOnDate');
    }
    const today = parishClock().date;
    if (parsed.massDate < today || parsed.massDate > addDays(today, 90)) {
      throw new Error('massOutOfRange');
    }
    const intention: MassIntention = {
      id: newId(),
      ...parsed,
      note: parsed.note || undefined,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    d.intentions.push(intention);
    d.mine.push(intention.id);
    return intention;
  });

/** Intentions requested in this parishioner app. */
export const listMyIntentions = () =>
  read((d) => d.intentions.filter((i) => d.mine.includes(i.id)).sort(newestFirst));

export const setIntentionStatus = (id: string, status: RequestStatus) =>
  write((d) => {
    const intention = d.intentions.find((i) => i.id === id);
    if (intention) intention.status = status;
  });

// Certificate requests

export const listCertificateRequests = () => read((d) => [...d.certificates].sort(newestFirst));

export const submitCertificateRequest = (input: CertificateInput) =>
  write((d) => {
    const parsed = certificateInputSchema.parse(input);
    const request: CertificateRequest = {
      id: newId(),
      ...parsed,
      sacramentDate: parsed.sacramentDate || undefined,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    d.certificates.push(request);
    d.mine.push(request.id);
    return request;
  });

/** Certificate requests made in this parishioner app. */
export const listMyCertificateRequests = () =>
  read((d) => d.certificates.filter((c) => d.mine.includes(c.id)).sort(newestFirst));

export const updateCertificateRequest = (id: string, status: RequestStatus, officeNote?: string) =>
  write((d) => {
    const request = d.certificates.find((c) => c.id === id);
    if (request) Object.assign(request, { status, officeNote: officeNote || undefined });
  });

// Ministry rosters

export const listRoster = () =>
  read((d) => [...d.roster].sort((a, b) => a.date.localeCompare(b.date) || a.serviceId.localeCompare(b.serviceId)));

export const saveRosterEntry = (input: RosterInput) =>
  write((d) => {
    const entry: RosterEntry = { id: newId(), ...rosterInputSchema.parse(input) };
    d.roster.push(entry);
    return entry;
  });

export const deleteRosterEntry = (id: string) => write((d) => remove(d.roster, id));
