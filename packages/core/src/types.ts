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
