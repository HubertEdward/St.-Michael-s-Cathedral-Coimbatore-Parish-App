import type { Localized } from './localized';

/** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ServiceKind = 'mass' | 'confession' | 'adoration' | 'novena';
export type ServiceLanguage = 'ta' | 'en' | 'ml';

/** A weekly, recurring service in the parish timetable. */
export interface Service {
  id: string;
  kind: ServiceKind;
  day: Weekday;
  /** 24-hour "HH:mm", local time at the church. */
  time: string;
  language?: ServiceLanguage;
  place?: Localized;
  note?: Localized;
}

export interface Announcement {
  id: string;
  title: Localized;
  body: Localized;
  /** ISO timestamp. */
  publishedAt: string;
  pinned: boolean;
}

export interface ParishEvent {
  id: string;
  title: Localized;
  description: Localized;
  /** ISO timestamp. */
  startsAt: string;
  place?: Localized;
}

export type RequestStatus = 'submitted' | 'approved' | 'declined' | 'completed';

export const intentionTypes = ['thanksgiving', 'departed', 'healing', 'birthday', 'anniversary', 'special'] as const;
export type IntentionType = (typeof intentionTypes)[number];

export interface MassIntention {
  id: string;
  type: IntentionType;
  /** Names to be prayed for, as they should be read out. */
  names: string;
  /** "YYYY-MM-DD" */
  massDate: string;
  serviceId: string;
  requesterName: string;
  phone: string;
  note?: string;
  status: RequestStatus;
  createdAt: string;
}

export const certificateKinds = ['baptism', 'first-communion', 'confirmation', 'marriage'] as const;
export type CertificateKind = (typeof certificateKinds)[number];

export interface CertificateRequest {
  id: string;
  kind: CertificateKind;
  personName: string;
  /** "YYYY-MM-DD", if known. */
  sacramentDate?: string;
  fatherName?: string;
  motherName?: string;
  purpose: string;
  requesterName: string;
  phone: string;
  status: RequestStatus;
  officeNote?: string;
  createdAt: string;
}

/**
 * The parish's groups: its councils, its Anbiyams (Basic Christian Communities, one for each
 * neighbourhood), and its liturgical ministries, associations and faith formation.
 */
export const groupKinds = ['council', 'anbiyam', 'liturgical', 'association', 'formation'] as const;
export type GroupKind = (typeof groupKinds)[number];

/** Posts a person can hold in a group. Each kind of group offers some of them: see groupRoles. */
export const officerRoles = [
  'president',
  'vicePresident',
  'head',
  'director',
  'coordinator',
  'secretary',
  'jointSecretary',
  'treasurer',
  'member',
] as const;
export type OfficerRole = (typeof officerRoles)[number];

/**
 * The posts each kind of group has. An Anbiyam has a head, a secretary and a treasurer. A council
 * is presided over by the parish priest, with lay office-bearers and members. Ministries and
 * associations have a director (usually a priest or sister) and lay office-bearers.
 */
export const groupRoles: Record<GroupKind, readonly OfficerRole[]> = {
  council: ['president', 'vicePresident', 'secretary', 'jointSecretary', 'treasurer', 'member'],
  anbiyam: ['head', 'secretary', 'treasurer'],
  liturgical: ['director', 'coordinator', 'secretary', 'member'],
  association: ['director', 'president', 'secretary', 'treasurer', 'member'],
  formation: ['director', 'coordinator', 'member'],
};

/** How someone has a seat on a council: by office, as an Anbiyam's representative, elected, or nominated by the parish priest. */
export const councilSeats = ['exOfficio', 'anbiyam', 'elected', 'nominated'] as const;
export type CouncilSeat = (typeof councilSeats)[number];

/** A person holding a post in a group; linked to their family membership when they are a registered parishioner. */
export interface Officer {
  id: string;
  role: OfficerRole;
  name: string;
  phone?: string;
  memberId?: string;
  /** Councils only: how they have their seat, and for an Anbiyam's representative, which Anbiyam. */
  seat?: CouncilSeat;
  representsId?: string;
  /** Asked in the app to join the group; waiting for one of its office-bearers to approve. */
  pending?: true;
}

/** Groups a parishioner can ask to join. Anbiyam membership follows the family; councils are appointed. */
export const joinableKinds: readonly GroupKind[] = ['liturgical', 'association', 'formation'];

/** A message an Anbiyam's or a group's office-bearers, or the parish office, send to its members. */
export interface GroupMessage {
  id: string;
  groupId: string;
  body: string;
  sender: string;
  /** The sender's post in the group, or 'office' for the parish office. */
  senderRole: OfficerRole | 'office';
  sentAt: string;
}

export interface ParishGroup {
  id: string;
  kind: GroupKind;
  name: Localized;
  description: Localized;
  /** Anbiyams: the streets or area they cover. */
  area?: Localized;
  /** When and where it meets, e.g. "First Sunday, after the 8:00 Mass". */
  meets?: Localized;
  /** Councils: the current term, "YYYY-MM-DD". */
  term?: { from: string; to: string };
  officers: Officer[];
}

/** A group as a parish profile lists it, before anyone holds a post. */
export type ParishGroupSeed = Omit<ParishGroup, 'officers'>;

/** One person on duty for one service on one date. */
export interface RosterEntry {
  id: string;
  /** A liturgical group. */
  ministryId: string;
  /** "YYYY-MM-DD" */
  date: string;
  serviceId: string;
  memberName: string;
}

/** What a monthly subscription supports. */
export const givingPurposes = ['parish', 'restoration', 'charity'] as const;
export type GivingPurpose = (typeof givingPurposes)[number];

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/** A parishioner's monthly offering by UPI AutoPay. */
export interface Subscription {
  id: string;
  name: string;
  phone: string;
  /** Whole rupees per month. */
  amount: number;
  purpose: GivingPurpose;
  /** Day of the month the mandate is debited, 1–28. */
  debitDay: number;
  status: SubscriptionStatus;
  /** "YYYY-MM-DD" of the first debit. */
  startsOn: string;
  createdAt: string;
}

/** How a member is related to the head of the family. */
export const relationships = ['head', 'spouse', 'son', 'daughter', 'father', 'mother', 'sibling', 'other'] as const;
export type Relationship = (typeof relationships)[number];

/** A family's registration, or a person's membership of a family, as the parish office decided it. */
export type MembershipStatus = 'pending' | 'approved' | 'declined';

/** A family's place in the parish: asked to join, a member, turned down, or removed by the parish priest. */
export type FamilyStatus = MembershipStatus | 'removed';

/** Why the parish priest removed a family from the parish. */
export const removalReasons = ['movedAway', 'otherParish', 'other'] as const;
export type RemovalReason = (typeof removalReasons)[number];

/** A household registered with the parish. Its code lets relatives ask to join it. */
export interface Family {
  id: string;
  /** Short code shown to the family, e.g. "SMC-0101", that others use to ask to join. */
  code: string;
  name: string;
  address: string;
  /** The Anbiyam the parish office placed the family in; until then the family waits to be onboarded. */
  anbiyamId?: string;
  /** The Anbiyam the family thought it belonged to when asking to join the parish. */
  preferredAnbiyamId?: string;
  status: FamilyStatus;
  /** Set when the parish priest removes the family; kept if they later ask to join again. */
  removal?: { reason: RemovalReason; note?: string; on: string };
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  relationship: Relationship;
  /** Members with a phone can sign in; children and elders may have none. */
  phone?: string;
  /** "YYYY-MM-DD", if given. */
  birthDate?: string;
  status: MembershipStatus;
  /** Name of the family member who added this person, when they did not ask themselves. */
  addedBy?: string;
  createdAt: string;
}

export interface FamilyWithMembers extends Family {
  members: FamilyMember[];
}

/**
 * The person signed in on this phone. People sign in with their mobile number and a 6-digit PIN they
 * choose; no SMS is sent, because the parish office's approval of each family and member is what
 * confirms who someone is. Phase 2 keeps the PIN in Supabase Auth.
 */
export interface Account {
  phone: string;
}

/** A one-time code the parish office gives someone who forgot their PIN, valid for a day. */
export interface PinReset {
  phone: string;
  code: string;
  expiresAt: string;
}
