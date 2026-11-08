// Demo data for Phase 1. Dates are relative to the first launch so the demo
// never looks stale. Timetable values come from the parish website and are
// real (TO CONFIRM); announcements, events and requests are samples.
import { parish } from '../content/parish';
import { addDays, parishClock, weekdayOf } from '../schedule';
import type {
  Announcement,
  CertificateRequest,
  MassIntention,
  ParishEvent,
  RosterEntry,
  Service,
  Weekday,
} from '../types';

export interface ParishData {
  services: Service[];
  announcements: Announcement[];
  events: ParishEvent[];
  intentions: MassIntention[];
  certificates: CertificateRequest[];
  roster: RosterEntry[];
}

const weekdays: Weekday[] = [1, 2, 3, 4, 5, 6];

function timetable(): Service[] {
  const mass = (day: Weekday, time: string, extra: Partial<Service> = {}): Service => ({
    id: `mass-${day}-${time.replace(':', '')}`,
    kind: 'mass',
    day,
    time,
    ...extra,
  });
  return [
    mass(0, '05:15'),
    mass(0, '06:30'),
    mass(0, '08:00'),
    mass(0, '17:30'),
    ...weekdays.map((day) => mass(day, '06:15')),
    mass(1, '18:30', { place: { en: 'Cemetery', ta: 'கல்லறைத் தோட்டம்' } }),
    ...weekdays.filter((day) => day !== 1).map((day) => mass(day, '18:30')),
  ];
}

function nextWeekday(from: string, day: Weekday): string {
  const offset = (day - weekdayOf(from) + 7) % 7 || 7;
  return addDays(from, offset);
}

function feastDate(today: string): string {
  const year = Number(today.slice(0, 4));
  const thisYear = `${year}-09-29`;
  return thisYear >= today ? thisYear : `${year + 1}-09-29`;
}

const at = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).toISOString();

export function createSeed(now: Date, { sampleRequests }: { sampleRequests: boolean }): ParishData {
  const today = parishClock(now).date;
  const sunday = nextWeekday(today, 0);
  const saturday = nextWeekday(today, 6);

  const announcements: Announcement[] = [
    {
      id: 'welcome',
      title: { en: 'Welcome to the parish app (preview)', ta: 'பங்கு செயலிக்கு வரவேற்கிறோம் (முன்னோட்டம்)' },
      body: {
        en: 'This is an early preview. Mass timings come from the parish website and are being confirmed by the parish office. Announcements, events and requests shown here are samples.',
        ta: 'இது ஒரு முன்னோட்டப் பதிப்பு. திருப்பலி நேரங்கள் பங்கு அலுவலகத்தால் உறுதி செய்யப்பட்டு வருகின்றன. இங்குள்ள அறிவிப்புகள் மாதிரிகள் மட்டுமே.',
      },
      publishedAt: at(today, '07:00'),
      pinned: true,
    },
    {
      id: 'feast',
      title: parish.feast.name,
      body: { en: 'Our patronal feast is celebrated on 29 September. The novena and festival programme will be announced here.' },
      publishedAt: at(addDays(today, -2), '09:00'),
      pinned: false,
    },
    {
      id: 'intentions',
      title: { en: 'Sample: request Mass intentions from your phone', ta: 'மாதிரி: திருப்பலி கருத்துகளைச் செயலியில் கோரலாம்' },
      body: { en: 'Open More → Request a Mass intention, choose the Mass and enter the names. In this preview the request stays on your phone.' },
      publishedAt: at(addDays(today, -5), '18:00'),
      pinned: false,
    },
  ];

  const events: ParishEvent[] = [
    {
      id: 'youth-meet',
      title: { en: 'Sample: Youth fellowship evening', ta: 'மாதிரி: இளைஞர் சந்திப்பு' },
      description: { en: 'Prayer, a short talk and fellowship for young people of the parish.' },
      startsAt: at(saturday, '18:00'),
      place: { en: 'Parish hall' },
    },
    {
      id: 'catechism',
      title: { en: 'Sample: Catechism classes', ta: 'மாதிரி: மறைக்கல்வி வகுப்புகள்' },
      description: { en: 'Sunday catechism for children after the morning Mass.' },
      startsAt: at(sunday, '09:15'),
      place: { en: 'Cathedral school' },
    },
    {
      id: 'feast',
      title: parish.feast.name,
      description: { en: 'Patronal feast of the cathedral and the diocese.' },
      startsAt: at(feastDate(today), '17:30'),
      place: { en: "St. Michael's Cathedral" },
    },
  ];

  const intentions: MassIntention[] = sampleRequests
    ? [
        { id: 'int-1', type: 'thanksgiving', names: 'Joseph family', massDate: sunday, serviceId: 'mass-0-0630', requesterName: 'Mary Joseph', phone: '+91 98430 00001', status: 'submitted', createdAt: at(today, '08:10') },
        { id: 'int-2', type: 'departed', names: 'Late Antony Raj', massDate: sunday, serviceId: 'mass-0-0800', requesterName: 'Paul Antony', phone: '+91 98430 00002', status: 'approved', createdAt: at(addDays(today, -1), '19:20') },
        { id: 'int-3', type: 'healing', names: 'Rita', massDate: sunday, serviceId: 'mass-0-0630', requesterName: 'Susan', phone: '+91 98430 00003', note: 'Undergoing surgery', status: 'submitted', createdAt: at(addDays(today, -1), '10:05') },
      ]
    : [];

  const certificates: CertificateRequest[] = sampleRequests
    ? [
        { id: 'cert-1', kind: 'baptism', personName: 'Annie Thomas', sacramentDate: '1998-06-14', fatherName: 'Thomas', motherName: 'Lilly', purpose: 'Marriage', requesterName: 'Annie Thomas', phone: '+91 98430 00004', status: 'submitted', createdAt: at(today, '09:30') },
        { id: 'cert-2', kind: 'marriage', personName: 'Xavier and Grace', purpose: 'Passport', requesterName: 'Xavier', phone: '+91 98430 00005', status: 'approved', officeNote: 'Ready for collection on Friday', createdAt: at(addDays(today, -3), '11:00') },
      ]
    : [];

  const roster: RosterEntry[] = [
    { id: 'r-1', ministryId: 'ushers', date: sunday, serviceId: 'mass-0-0630', memberName: 'Sample: Arul' },
    { id: 'r-2', ministryId: 'ushers', date: sunday, serviceId: 'mass-0-0800', memberName: 'Sample: Benedict' },
    { id: 'r-3', ministryId: 'lectors', date: sunday, serviceId: 'mass-0-0630', memberName: 'Sample: Celine' },
    { id: 'r-4', ministryId: 'altar-servers', date: sunday, serviceId: 'mass-0-0800', memberName: 'Sample: David' },
    { id: 'r-5', ministryId: 'choir', date: sunday, serviceId: 'mass-0-1730', memberName: 'Sample: Youth choir' },
  ];

  return { services: timetable(), announcements, events, intentions, certificates, roster };
}
