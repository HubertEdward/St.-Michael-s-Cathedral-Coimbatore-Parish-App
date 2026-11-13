// The only functions screens use to read and change parish data.
// Thrown Error messages are codes the apps translate: 'massNotOnDate', 'massOutOfRange'.
import { nextDebitOn } from '../giving';
import { parishClock, parishTimeToIso } from '../parish';
import { addDays, weekdayOf } from '../schedule';
import type {
  Account,
  Announcement,
  CertificateRequest,
  Family,
  FamilyMember,
  FamilyWithMembers,
  MassIntention,
  MembershipStatus,
  ParishEvent,
  RequestStatus,
  RosterEntry,
  Service,
  Subscription,
  SubscriptionStatus,
} from '../types';
import {
  announcementInputSchema,
  certificateInputSchema,
  eventInputSchema,
  familyInputSchema,
  joinFamilySchema,
  memberInputSchema,
  signInSchema,
  intentionInputSchema,
  rosterInputSchema,
  serviceInputSchema,
  subscriptionAmountSchema,
  subscriptionInputSchema,
  type AnnouncementInput,
  type CertificateInput,
  type EventInput,
  type FamilyInput,
  type JoinFamilyInput,
  type MemberInput,
  type IntentionInput,
  type RosterInput,
  type ServiceInput,
  type SubscriptionInput,
} from '../validation';
import { familyCodePrefix, type ParishData } from './seed';
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

// Monthly subscriptions (no money moves in the demo)

export const listSubscriptions = () => read((d) => [...d.subscriptions].sort(newestFirst));

/** Subscriptions set up in this parishioner app, newest first. */
export const listMySubscriptions = () =>
  read((d) => d.subscriptions.filter((s) => d.mine.includes(s.id)).sort(newestFirst));

export const startSubscription = (input: SubscriptionInput) =>
  write((d) => {
    const parsed = subscriptionInputSchema.parse(input);
    const subscription: Subscription = {
      id: newId(),
      ...parsed,
      status: 'active',
      startsOn: nextDebitOn(parsed.debitDay, parishClock().date),
      createdAt: new Date().toISOString(),
    };
    d.subscriptions.push(subscription);
    d.mine.push(subscription.id);
    return subscription;
  });

export const setSubscriptionStatus = (id: string, status: SubscriptionStatus) =>
  write((d) => {
    const subscription = d.subscriptions.find((s) => s.id === id);
    if (subscription) subscription.status = status;
  });

export const changeSubscriptionAmount = (id: string, amount: number) =>
  write((d) => {
    const subscription = d.subscriptions.find((s) => s.id === id);
    if (subscription) subscription.amount = subscriptionAmountSchema.parse(amount);
  });

// Families and members. Thrown codes: 'notSignedIn', 'alreadyInFamily', 'familyNotFound'.

/** The last ten digits, so "+91 98430 20001" and "9843020001" match. */
const phoneKey = (phone: string) => phone.replace(/\D/g, '').slice(-10);

function myMembership(d: ParishData): FamilyMember | undefined {
  const account = d.account;
  if (!account) return undefined;
  return d.members.find((m) => m.phone && phoneKey(m.phone) === phoneKey(account.phone) && m.status !== 'declined');
}

function withMembers(d: ParishData, family: Family): FamilyWithMembers {
  return { ...family, members: d.members.filter((m) => m.familyId === family.id && m.status !== 'declined') };
}

export const getAccount = () => read((d): Account | null => d.account);

/** Signs in on this phone. In the preview the one-time code is checked by the screen, not here. */
export const signIn = (phone: string) =>
  write((d) => {
    d.account = { phone: signInSchema.parse({ phone }).phone };
    return d.account;
  });

export const signOut = () =>
  write((d) => {
    d.account = null;
  });

/**
 * The signed-in person's family and their own membership, or null if they have none yet.
 * Someone still waiting to join an existing family sees only the family's name and their own request,
 * not its members or address, until the parish office approves them.
 */
export const getMyFamily = () =>
  read((d) => {
    const me = myMembership(d);
    const family = me && d.families.find((f) => f.id === me.familyId);
    if (!me || !family) return null;
    const waitingToJoin = family.status === 'approved' && me.status !== 'approved';
    return { family: waitingToJoin ? { ...family, address: '', members: [me] } : withMembers(d, family), me };
  });

function signedInWithoutFamily(d: ParishData): Account {
  if (!d.account) throw new Error('notSignedIn');
  if (myMembership(d)) throw new Error('alreadyInFamily');
  return d.account;
}

/** Registers a new family with the signed-in person as its head; the parish office approves it. */
export const registerFamily = (input: FamilyInput) =>
  write((d) => {
    const account = signedInWithoutFamily(d);
    const parsed = familyInputSchema.parse(input);
    const next = Math.max(100, ...d.families.map((f) => Number(f.code.split('-')[1]) || 0)) + 1;
    const now = new Date().toISOString();
    const family: Family = {
      id: newId(),
      code: `${familyCodePrefix()}-${String(next).padStart(4, '0')}`,
      name: parsed.familyName,
      address: parsed.address,
      anbiyam: parsed.anbiyam || undefined,
      status: 'pending',
      createdAt: now,
    };
    d.families.push(family);
    d.members.push({
      id: newId(),
      familyId: family.id,
      name: parsed.headName,
      relationship: 'head',
      phone: account.phone,
      status: 'pending',
      createdAt: now,
    });
    return family;
  });

/** Asks to join a registered family by its code; the parish office approves it. */
export const requestToJoinFamily = (input: JoinFamilyInput) =>
  write((d) => {
    const account = signedInWithoutFamily(d);
    const parsed = joinFamilySchema.parse(input);
    const family = d.families.find((f) => f.code.toUpperCase() === parsed.code.toUpperCase() && f.status === 'approved');
    if (!family) throw new Error('familyNotFound');
    const request: FamilyMember = {
      id: newId(),
      familyId: family.id,
      name: parsed.name,
      relationship: parsed.relationship,
      phone: account.phone,
      birthDate: parsed.birthDate || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    d.members.push(request);
    return request;
  });

/** A member adds someone without their own phone, such as a child; the parish office approves it. */
export const addFamilyMember = (input: MemberInput) =>
  write((d) => {
    const me = myMembership(d);
    if (!me) throw new Error('notSignedIn');
    const parsed = memberInputSchema.parse(input);
    const added: FamilyMember = {
      id: newId(),
      familyId: me.familyId,
      name: parsed.name,
      relationship: parsed.relationship,
      birthDate: parsed.birthDate || undefined,
      status: 'pending',
      addedBy: me.name,
      createdAt: new Date().toISOString(),
    };
    d.members.push(added);
    return added;
  });

/** Every family with its members, newest registration first. */
export const listFamilies = () => read((d) => [...d.families].sort(newestFirst).map((f) => withMembers(d, f)));

/** Approving a family approves its head too; declining it declines everyone still waiting in it. */
export const setFamilyStatus = (id: string, status: MembershipStatus) =>
  write((d) => {
    const family = d.families.find((f) => f.id === id);
    if (!family) return;
    family.status = status;
    for (const m of d.members) {
      if (m.familyId !== id || m.status !== 'pending') continue;
      if (status === 'declined' || m.relationship === 'head') m.status = status;
    }
  });

export const setMemberStatus = (id: string, status: MembershipStatus) =>
  write((d) => {
    const m = d.members.find((x) => x.id === id);
    if (m) m.status = status;
  });
