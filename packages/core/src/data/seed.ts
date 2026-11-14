// Demo data for Phase 1. The timetable comes from the parish profile; the
// announcements, events, requests and roster are samples built around it, with
// dates relative to the first launch so the demo never looks stale.
import { nextDebitOn } from '../giving';
import { parish, parishClock, parishTimeToIso } from '../parish';
import { addDays, formatDayOfYear, nextOccurrence, servicesOn, weekdayOf } from '../schedule';
import type {
  Account,
  Announcement,
  CertificateRequest,
  Family,
  FamilyMember,
  GroupMessage,
  MassIntention,
  Officer,
  ParishEvent,
  ParishGroup,
  PinReset,
  RosterEntry,
  Service,
  Subscription,
  Weekday,
} from '../types';

export interface ParishData {
  services: Service[];
  announcements: Announcement[];
  events: ParishEvent[];
  intentions: MassIntention[];
  certificates: CertificateRequest[];
  roster: RosterEntry[];
  subscriptions: Subscription[];
  families: Family[];
  members: FamilyMember[];
  /** Councils, Anbiyams, ministries and associations, with the people holding posts in them. */
  groups: ParishGroup[];
  messages: GroupMessage[];
  /** When each member last opened their messages, by member id; newer messages count as unread. */
  lastRead: Record<string, string>;
  /** The PINs people chose, by phone number. Preview only: Phase 2 keeps them (hashed) in Supabase Auth. */
  logins: { phone: string; pin: string }[];
  /** Reset codes the parish office has handed out and not yet used. */
  pinResets: PinReset[];
  /** Who is signed in on this phone; null when signed out. */
  account: Account | null;
  /** Ids of the requests and subscriptions made in this parishioner app ("My requests"); Phase 2 replaces this with accounts. */
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
  const liturgical = parish.groups.filter((g) => g.kind === 'liturgical');

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

  const onDuty = ['Arul', 'Benedict', 'Celine', 'David', 'Esther'];
  const roster: RosterEntry[] =
    sundayMasses.length > 0
      ? liturgical.slice(0, onDuty.length).map((ministry, index) => ({
          id: `r-${index + 1}`,
          ministryId: ministry.id,
          date: sunday,
          serviceId: sundayMass(index).id,
          memberName: `Sample: ${onDuty[index]}`,
        }))
      : [];

  // Monthly supporters, so the office has a list and totals to show.
  const supporter = (
    n: number,
    name: string,
    amount: number,
    purpose: Subscription['purpose'],
    debitDay: number,
    monthsAgo: number,
    status: Subscription['status'] = 'active',
  ): Subscription => ({
    id: `sub-${n}`,
    name,
    phone: `+91 98430 1000${n}`,
    amount,
    purpose,
    debitDay,
    status,
    startsOn: nextDebitOn(debitDay, addDays(today, -30 * monthsAgo)),
    createdAt: parishTimeToIso(addDays(today, -30 * monthsAgo - 3), '20:00'),
  });
  const subscriptions: Subscription[] = [
    supporter(1, 'Joseph family', 1000, 'parish', 5, 8),
    supporter(2, 'Mary Arul', 500, 'restoration', 1, 5),
    supporter(3, 'Antony and Rita', 250, 'charity', 10, 3),
    supporter(4, 'Francis Xavier', 2500, 'restoration', 15, 11),
    supporter(5, 'Celine Paul', 250, 'parish', 5, 6, 'paused'),
  ];

  // Registered families in their Anbiyams; one new family asking to join the parish, one approved but
  // not yet placed in an Anbiyam, one removed after moving away; and two requests to join a family.
  const prefix = familyCodePrefix();
  const family = (n: number, name: string, address: string, status: Family['status'], daysAgo: number, extra: Partial<Family> = {}): Family => ({
    id: `fam-${n}`,
    code: `${prefix}-${String(100 + n).padStart(4, '0')}`,
    name,
    address,
    status,
    createdAt: parishTimeToIso(addDays(today, -daysAgo), '11:00'),
    ...extra,
  });
  const families: Family[] = [
    family(1, 'Joseph family', '12 Raja Street, Coimbatore', 'approved', 400, { anbiyamId: 'anb-1' }),
    family(2, 'Xavier family', '4 Oppanakara Street, Coimbatore', 'approved', 300, { anbiyamId: 'anb-2' }),
    family(3, 'Fernandez family', '27 Big Bazaar Street, Coimbatore', 'approved', 200, { anbiyamId: 'anb-3' }),
    family(4, 'Thomas family', '8 Variety Hall Road, Coimbatore', 'pending', 1, { preferredAnbiyamId: 'anb-2' }),
    family(5, 'D’Souza family', '3 Town Hall Road, Coimbatore', 'approved', 6, { preferredAnbiyamId: 'anb-4' }),
    family(6, 'Pereira family', '19 Prakasam Street, Coimbatore', 'removed', 900, {
      removal: { reason: 'movedAway', note: 'Moved to Chennai', on: addDays(today, -30) },
    }),
  ];
  const member = (
    id: string,
    familyId: string,
    name: string,
    relationship: FamilyMember['relationship'],
    extra: Partial<FamilyMember> = {},
  ): FamilyMember => ({
    id,
    familyId,
    name,
    relationship,
    status: 'approved',
    createdAt: parishTimeToIso(addDays(today, -100), '10:00'),
    ...extra,
  });
  const members: FamilyMember[] = [
    member('m-1', 'fam-1', 'Joseph Antony', 'head', { phone: '+91 98430 20001' }),
    member('m-2', 'fam-1', 'Mary Joseph', 'spouse', { phone: '+91 98430 20002' }),
    member('m-3', 'fam-1', 'Arul Joseph', 'son', { birthDate: '2012-05-14' }),
    member('m-4', 'fam-2', 'Xavier Raj', 'head', { phone: '+91 98430 20003' }),
    member('m-5', 'fam-2', 'Grace Xavier', 'spouse'),
    member('m-6', 'fam-3', 'Paul Fernandez', 'head', { phone: '+91 98430 20004' }),
    member('m-7', 'fam-3', 'Celine Fernandez', 'daughter'),
    member('m-8', 'fam-4', 'Thomas Mathew', 'head', {
      phone: '+91 98430 20010',
      status: 'pending',
      createdAt: parishTimeToIso(addDays(today, -1), '11:00'),
    }),
    member('m-9', 'fam-1', 'Benedict Joseph', 'son', {
      phone: '+91 98430 20005',
      status: 'pending',
      createdAt: parishTimeToIso(today, '08:40'),
    }),
    member('m-10', 'fam-2', 'Rita Xavier', 'daughter', {
      birthDate: '2026-08-02',
      status: 'pending',
      addedBy: 'Xavier Raj',
      createdAt: parishTimeToIso(addDays(today, -2), '19:15'),
    }),
    member('m-11', 'fam-5', 'Francis D’Souza', 'head', { phone: '+91 98430 20006' }),
    member('m-12', 'fam-5', 'Lourdes D’Souza', 'spouse'),
    member('m-13', 'fam-6', 'Peter Pereira', 'head', { phone: '+91 98430 20007' }),
  ];

  // Every parish has a pastoral council and a finance council (canons 536 and 537), presided over by
  // the parish priest. The Anbiyams and the posts filled here are samples for the demo.
  const priest = parish.clergy.find((c) => c.role === 'parish-priest')?.name ?? 'Parish priest';
  const officer = (id: string, role: Officer['role'], name: string, extra: Partial<Officer> = {}): Officer => ({ id, role, name, ...extra });
  const person = (memberId: string) => {
    const m = members.find((x) => x.id === memberId)!;
    return { name: m.name, memberId, ...(m.phone ? { phone: m.phone } : {}) };
  };
  const year = Number(today.slice(0, 4));
  const groups: ParishGroup[] = [
    {
      id: 'council-pastoral',
      kind: 'council',
      name: { en: 'Parish Pastoral Council', ta: 'பங்குப் பேரவை' },
      description: {
        en: 'Advises the parish priest on the life and mission of the parish. Each Anbiyam sends a representative; others serve by office, by election or by the parish priest’s nomination.',
        ta: 'பங்கின் வாழ்வு மற்றும் பணி குறித்து பங்குத்தந்தைக்கு ஆலோசனை வழங்குகிறது. ஒவ்வொரு அன்பியமும் ஒரு பிரதிநிதியை அனுப்புகிறது; மற்றவர்கள் பதவி வழியாக, தேர்தல் வழியாக அல்லது பங்குத்தந்தையின் நியமனம் வழியாக உறுப்பினராகிறார்கள்.',
      },
      meets: { en: 'Sample: first Sunday of the month, 10:00, parish hall', ta: 'மாதிரி: மாதத்தின் முதல் ஞாயிறு, காலை 10 மணி, பங்கு அரங்கம்' },
      term: { from: `${year}-01-01`, to: `${year + 2}-12-31` },
      officers: [
        officer('o-1', 'president', priest, { seat: 'exOfficio' }),
        officer('o-2', 'vicePresident', person('m-4').name, { ...person('m-4'), seat: 'elected' }),
        officer('o-3', 'secretary', person('m-2').name, { ...person('m-2'), seat: 'anbiyam', representsId: 'anb-1' }),
        officer('o-4', 'treasurer', person('m-6').name, { ...person('m-6'), seat: 'anbiyam', representsId: 'anb-3' }),
        officer('o-5', 'member', 'Sample: Sister superior, Presentation Convent', { seat: 'exOfficio' }),
        officer('o-6', 'member', 'Sample: President, Catholic youth', { seat: 'nominated' }),
      ],
    },
    {
      id: 'council-finance',
      kind: 'council',
      name: { en: 'Parish Finance Council', ta: 'பங்கு நிதிக் குழு' },
      description: {
        en: 'Helps the parish priest look after the parish’s property, accounts and budget.',
        ta: 'பங்கின் சொத்துகள், கணக்குகள் மற்றும் வரவு செலவுத் திட்டத்தைக் கவனிக்க பங்குத்தந்தைக்கு உதவுகிறது.',
      },
      term: { from: `${year}-01-01`, to: `${year + 2}-12-31` },
      officers: [
        officer('o-7', 'president', priest, { seat: 'exOfficio' }),
        officer('o-8', 'member', person('m-1').name, { ...person('m-1'), seat: 'elected' }),
        officer('o-9', 'member', 'Sample: Chartered accountant', { seat: 'nominated' }),
      ],
    },
    anbiyam('anb-1', { en: 'St. Antony’s Anbiyam', ta: 'புனித அந்தோணியார் அன்பியம்' }, 'Raja Street, Big Bazaar Street', [
      officer('o-10', 'head', person('m-1').name, person('m-1')),
      officer('o-11', 'secretary', person('m-2').name, person('m-2')),
      officer('o-12', 'treasurer', 'Sample: Antony Raj', { phone: '+91 98430 20021' }),
    ]),
    anbiyam('anb-2', { en: 'St. Sebastian’s Anbiyam', ta: 'புனித செபஸ்தியார் அன்பியம்' }, 'Oppanakara Street, Variety Hall Road', [
      officer('o-13', 'head', person('m-4').name, person('m-4')),
    ]),
    anbiyam('anb-3', { en: 'Our Lady of Velankanni Anbiyam', ta: 'வேளாங்கண்ணி மாதா அன்பியம்' }, 'Big Bazaar Street, Kottai Medu', [
      officer('o-14', 'head', person('m-6').name, person('m-6')),
    ]),
    anbiyam('anb-4', { en: 'St. Joseph’s Anbiyam', ta: 'புனித சூசையப்பர் அன்பியம்' }, 'Town Hall, Prakasam Street', []),
    {
      id: 'prayer-group',
      kind: 'association',
      name: { en: 'Sample: Charismatic prayer group', ta: 'மாதிரி: அருங்கொடை செபக் குழு' },
      description: { en: 'Praise, worship and intercession for the parish and its families.', ta: 'பங்குக்காகவும் அதன் குடும்பங்களுக்காகவும் புகழ்ச்சி, ஆராதனை, பரிந்துரை செபம்.' },
      meets: { en: 'Thursdays, 6:30 pm, parish hall', ta: 'வியாழன்தோறும், மாலை 6:30, பங்கு அரங்கம்' },
      officers: [
        officer('o-15', 'coordinator', person('m-1').name, person('m-1')),
        officer('o-16', 'member', person('m-4').name, person('m-4')),
        officer('o-17', 'member', person('m-2').name, person('m-2')),
        officer('o-18', 'member', person('m-6').name, { ...person('m-6'), pending: true }),
      ],
    },
    ...parish.groups.map((g) => ({ ...g, officers: [] })),
  ];

  // Messages from an Anbiyam's office-bearers, a prayer group and the parish office.
  const message = (id: string, groupId: string, sender: string, senderRole: GroupMessage['senderRole'], daysAgo: number, time: string, body: string): GroupMessage => ({
    id,
    groupId,
    sender,
    senderRole,
    body,
    sentAt: parishTimeToIso(addDays(today, -daysAgo), time),
  });
  const messages: GroupMessage[] = [
    message('msg-1', 'anb-1', 'Joseph Antony', 'head', 1, '07:30', 'Sample: our Anbiyam meets this Friday at 7 pm at the home of Mary Joseph, 12 Raja Street. We will pray the Rosary and read Sunday’s Gospel together.'),
    message('msg-2', 'prayer-group', 'Joseph Antony', 'coordinator', 1, '19:10', 'Sample: prayer meeting on Thursday at 6:30 pm in the parish hall. Please bring your Bible.'),
    message('msg-3', 'anb-1', 'Mary Joseph', 'secretary', 4, '20:00', 'Sample: thank you to every family that brought food for the feast. Our Anbiyam gave ₹4,500 to the poor fund.'),
    message('msg-4', 'anb-2', 'Parish office', 'office', 2, '11:00', 'Sample: the parish priest will bless homes in St. Sebastian’s Anbiyam on Saturday from 4 pm.'),
  ];

  // Everyone in the samples with a phone has already chosen the demo PIN.
  const logins = members.filter((m) => m.phone).map((m) => ({ phone: m.phone!, pin: DEMO_PIN }));

  // Copied, because the demo store edits its data in place.
  const services = parish.timetable.map((service) => ({ ...service }));

  return { services, announcements, events, intentions, certificates, roster, subscriptions, families, members, groups, messages, lastRead: {}, logins, pinResets: [], account: null, mine: [] };
}

/** The PIN of every sample family member in the preview (Joseph Antony is +91 98430 20001). */
export const DEMO_PIN = '246810';

/** A sample Anbiyam: the parish office replaces these with the parish's own. */
function anbiyam(id: string, name: ParishGroup['name'], streets: string, officers: Officer[]): ParishGroup {
  return {
    id,
    kind: 'anbiyam',
    name,
    description: { en: 'Sample Anbiyam: families of the neighbourhood meet to pray, read the Word of God and help one another.', ta: 'மாதிரி அன்பியம்: அக்கம்பக்கக் குடும்பங்கள் ஒன்றுகூடி செபிக்கின்றன, இறைவார்த்தையை வாசிக்கின்றன, ஒருவருக்கொருவர் உதவுகின்றன.' },
    area: { en: streets },
    meets: { en: 'Sample: second Friday, 7 pm, in a member family’s home', ta: 'மாதிரி: இரண்டாம் வெள்ளி, இரவு 7 மணி, ஒரு குடும்பத்தின் இல்லத்தில்' },
    officers,
  };
}

/** "SMC" for st-michaels-coimbatore: the start of each family code. */
export const familyCodePrefix = () =>
  parish.id
    .split('-')
    .map((word) => word[0])
    .join('')
    .toUpperCase();
