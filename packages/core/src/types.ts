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

export type MinistryKind = 'liturgical' | 'association' | 'formation' | 'anbiyam';

export interface Ministry {
  id: string;
  kind: MinistryKind;
  name: Localized;
  description: Localized;
}

/** One person on duty for one service on one date. */
export interface RosterEntry {
  id: string;
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

/** A household registered with the parish. Its code lets relatives ask to join it. */
export interface Family {
  id: string;
  /** Short code shown to the family, e.g. "SMC-0101", that others use to ask to join. */
  code: string;
  name: string;
  address: string;
  anbiyam?: string;
  status: MembershipStatus;
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
