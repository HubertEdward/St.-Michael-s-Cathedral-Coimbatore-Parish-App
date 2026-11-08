// Demo data for Phase 1. The timetable comes from the parish profile; the
// announcements, events, requests and roster are samples built around it, with
// dates relative to the first launch so the demo never looks stale.
import { parish, parishClock, parishTimeToIso } from '../parish';
import { addDays, formatDayOfYear, nextOccurrence, servicesOn, weekdayOf } from '../schedule';
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
  /** Ids of the requests made in this parishioner app ("My requests"); Phase 2 replaces this with accounts. */
  mine: string[];
}

function nextWeekday(from: string, day: Weekday): string {
  const offset = (day - weekdayOf(from) + 7) % 7 || 7;
  return addDays(from, offset);
}

export function createSeed(now: Date): ParishData {
  const today = parishClock(now).date;
  const sunday = nextWeekday(today, 0);
  const saturday = nextWeekday(today, 6);
  const { feast } = parish;

  // Samples point at the parish's own Sunday Masses and liturgical ministries.
  const sundayMasses = servicesOn(parish.timetable, 0, 'mass');
  const sundayMass = (index: number) => sundayMasses[index % sundayMasses.length];
  const liturgical = parish.ministries.filter((m) => m.kind === 'liturgical');

  const announcements: Announcement[] = [
    {
      id: 'welcome',
      title: { en: 'Welcome to the parish app (preview)', ta: 'பங்கு செயலிக்கு வரவேற்கிறோம் (முன்னோட்டம்)' },
      body: {
        en: 'This is an early preview. Mass timings are being confirmed by the parish office. Announcements, events and requests shown here are samples.',
        ta: 'இது ஒரு முன்னோட்டப் பதிப்பு. திருப்பலி நேரங்கள் பங்கு அலுவலகத்தால் உறுதி செய்யப்பட்டு வருகின்றன. இங்குள்ள அறிவிப்புகள் மாதிரிகள் மட்டுமே.',
      },
      publishedAt: parishTimeToIso(today, '07:00'),
      pinned: true,
    },
    {
      id: 'feast',
      title: feast.name,
      body: {
        en: `Our patronal feast is celebrated on ${formatDayOfYear(feast.month, feast.day, 'en')}. The novena and festival programme will be announced here.`,
      },
      publishedAt: parishTimeToIso(addDays(today, -2), '09:00'),
      pinned: false,
    },
    {
      id: 'intentions',
      title: { en: 'Sample: request Mass intentions from your phone', ta: 'மாதிரி: திருப்பலி கருத்துகளைச் செயலியில் கோரலாம்' },
      body: { en: 'Open More → Request a Mass intention, choose the Mass and enter the names. The parish office confirms it, and you can follow it in My requests.' },
      publishedAt: parishTimeToIso(addDays(today, -5), '18:00'),
      pinned: false,
    },
  ];

  const events: ParishEvent[] = [
    {
      id: 'youth-meet',
      title: { en: 'Sample: Youth fellowship evening', ta: 'மாதிரி: இளைஞர் சந்திப்பு' },
      description: { en: 'Prayer, a short talk and fellowship for young people of the parish.' },
      startsAt: parishTimeToIso(saturday, '18:00'),
      place: { en: 'Parish hall' },
    },
    {
      id: 'catechism',
      title: { en: 'Sample: Catechism classes', ta: 'மாதிரி: மறைக்கல்வி வகுப்புகள்' },
      description: { en: 'Sunday catechism for children after the morning Mass.' },
      startsAt: parishTimeToIso(sunday, '09:15'),
      place: { en: 'Parish school' },
    },
    {
      id: 'feast',
      title: feast.name,
      description: { en: 'Patronal feast of the parish.' },
      startsAt: parishTimeToIso(nextOccurrence(feast.month, feast.day, today), '17:30'),
      place: parish.name,
    },
  ];

  // Requests from other parishioners, so the office has a queue to work on.
  const intentions: MassIntention[] = sundayMasses.length > 0
    ? [
        { id: 'int-1', type: 'thanksgiving', names: 'Joseph family', massDate: sunday, serviceId: sundayMass(0).id, requesterName: 'Mary Joseph', phone: '+91 98430 00001', status: 'submitted', createdAt: parishTimeToIso(today, '08:10') },
        { id: 'int-2', type: 'departed', names: 'Late Antony Raj', massDate: sunday, serviceId: sundayMass(1).id, requesterName: 'Paul Antony', phone: '+91 98430 00002', status: 'approved', createdAt: parishTimeToIso(addDays(today, -1), '19:20') },
        { id: 'int-3', type: 'healing', names: 'Rita', massDate: sunday, serviceId: sundayMass(0).id, requesterName: 'Susan', phone: '+91 98430 00003', note: 'Undergoing surgery', status: 'submitted', createdAt: parishTimeToIso(addDays(today, -1), '10:05') },
      ]
    : [];

  const certificates: CertificateRequest[] = [
    { id: 'cert-1', kind: 'baptism', personName: 'Annie Thomas', sacramentDate: '1998-06-14', fatherName: 'Thomas', motherName: 'Lilly', purpose: 'Marriage', requesterName: 'Annie Thomas', phone: '+91 98430 00004', status: 'submitted', createdAt: parishTimeToIso(today, '09:30') },
    { id: 'cert-2', kind: 'marriage', personName: 'Xavier and Grace', purpose: 'Passport', requesterName: 'Xavier', phone: '+91 98430 00005', status: 'approved', officeNote: 'Ready for collection on Friday', createdAt: parishTimeToIso(addDays(today, -3), '11:00') },
  ];

  const members = ['Arul', 'Benedict', 'Celine', 'David', 'Esther'];
  const roster: RosterEntry[] =
    sundayMasses.length > 0
      ? liturgical.slice(0, members.length).map((ministry, index) => ({
          id: `r-${index + 1}`,
          ministryId: ministry.id,
          date: sunday,
          serviceId: sundayMass(index).id,
          memberName: `Sample: ${members[index]}`,
        }))
      : [];

  // Copied, because the demo store edits its data in place.
  const services = parish.timetable.map((service) => ({ ...service }));

  return { services, announcements, events, intentions, certificates, roster, mine: [] };
}
