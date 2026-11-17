// Form and input rules shared by both apps (and, in Phase 2, by the backend).
// Messages are codes (see ValidationCode); each app translates them.
import { z } from 'zod';

import { pinSchema, sixDigits } from './pin';
import {
  certificateKinds,
  councilSeats,
  educationLevels,
  givingPurposes,
  groupKinds,
  incomeBands,
  intentionTypes,
  occupations,
  officeRoles,
  officerRoles,
  relationships,
  removalReasons,
  studyClasses,
  workSectors,
} from './types';

export type ValidationCode =
  | 'required'
  | 'tooLong'
  | 'phone'
  | 'date'
  | 'futureDate'
  | 'time'
  | 'amountMin'
  | 'amountMax'
  | 'tooMany'
  | 'minutes'
  | 'pinFormat'
  | 'pinTooSimple'
  | 'pinMismatch'
  | 'resetCodeFormat';

const required = (max = 200) => z.string().trim().min(1, 'required').max(max, 'tooLong');
const optionalText = z.string().trim().max(500, 'tooLong').optional();

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 -]{7,15}$/, 'phone');
/** "YYYY-MM-DD" naming a day that exists, from 1900 on. */
const isRealDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};
export const dateSchema = z
  .string()
  .min(1, 'required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date')
  .refine(isRealDate, 'date');
/** Not after today anywhere in the world, so it holds whatever the phone's time zone. */
const notFuture = (value: string) => value <= new Date(Date.now() + 14 * 3600_000).toISOString().slice(0, 10);
/** A day already passed, such as a birth or a sacrament; it may be left empty. */
const pastDate = dateSchema.refine(notFuture, 'futureDate').optional().or(z.literal(''));
export const timeSchema = z.string().min(1, 'required').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time');

export const localizedSchema = z.object({ en: required(2000), ta: z.string().trim().max(2000, 'tooLong').optional() });

export const intentionInputSchema = z.object({
  type: z.enum(intentionTypes),
  names: required(300),
  massDate: dateSchema,
  serviceId: required(),
  requesterName: required(100),
  phone: phoneSchema,
  note: optionalText,
});
export type IntentionInput = z.infer<typeof intentionInputSchema>;

export const certificateInputSchema = z.object({
  kind: z.enum(certificateKinds),
  personName: required(100),
  sacramentDate: pastDate,
  fatherName: optionalText,
  motherName: optionalText,
  purpose: required(200),
  requesterName: required(100),
  phone: phoneSchema,
});
export type CertificateInput = z.infer<typeof certificateInputSchema>;

export const announcementInputSchema = z.object({
  title: localizedSchema,
  body: localizedSchema,
  pinned: z.boolean(),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export const eventInputSchema = z.object({
  title: localizedSchema,
  description: localizedSchema,
  date: dateSchema,
  time: timeSchema,
  place: optionalText,
});
export type EventInput = z.infer<typeof eventInputSchema>;

export const serviceInputSchema = z.object({
  kind: z.enum(['mass', 'confession', 'adoration', 'novena']),
  day: z.number().int().min(0).max(6),
  time: timeSchema,
  language: z.enum(['ta', 'en', 'ml']).optional(),
  place: optionalText,
  note: optionalText,
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const rosterInputSchema = z.object({
  ministryId: required(),
  date: dateSchema,
  serviceId: required(),
  memberName: required(100),
});
export type RosterInput = z.infer<typeof rosterInputSchema>;

export const subscriptionAmountSchema = z.number().int().min(50, 'amountMin').max(100000, 'amountMax');

export const subscriptionInputSchema = z.object({
  amount: subscriptionAmountSchema,
  purpose: z.enum(givingPurposes),
  debitDay: z.number().int().min(1).max(28),
  name: required(100),
  phone: phoneSchema,
});
export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;

export const signInSchema = z.object({ phone: phoneSchema, pin: z.string().regex(sixDigits, 'pinFormat') });
export type SignInInput = z.infer<typeof signInSchema>;

const confirmed = <T extends { pin: string; confirm: string }>(input: T) => input.pin === input.confirm;

export const createAccountSchema = z
  .object({ phone: phoneSchema, pin: pinSchema, confirm: z.string() })
  .refine(confirmed, { message: 'pinMismatch', path: ['confirm'] });
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const resetPinSchema = z
  .object({ phone: phoneSchema, code: z.string().regex(sixDigits, 'resetCodeFormat'), pin: pinSchema, confirm: z.string() })
  .refine(confirmed, { message: 'pinMismatch', path: ['confirm'] });
export type ResetPinInput = z.infer<typeof resetPinSchema>;

const shortText = z.string().trim().max(100, 'tooLong').optional();

/** What the family register asks about each person (see MemberDetails); all of it may be left out. */
export const memberDetailsSchema = z.object({
  birthDate: pastDate,
  education: z.enum(educationLevels).optional(),
  qualification: shortText,
  occupation: z.enum(occupations).optional(),
  studyClass: z.enum(studyClasses).optional(),
  course: shortText,
  workSector: z.enum(workSectors).optional(),
  job: shortText,
  yearlyIncome: z.enum(incomeBands).optional(),
  sacraments: z.object({ baptism: pastDate, 'first-communion': pastDate, confirmation: pastDate, marriage: pastDate }),
});
export type MemberDetailsInput = z.infer<typeof memberDetailsSchema>;


export const joinFamilySchema = memberDetailsSchema.extend({
  code: z.string().trim().min(1, 'required').max(20, 'tooLong'),
  name: required(100),
  relationship: z.enum(relationships),
});
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>;

/** A family member as added, or corrected, by their family. */
export const memberInputSchema = memberDetailsSchema.extend({
  name: required(100),
  relationship: z.enum(relationships),
});
export type MemberInput = z.infer<typeof memberInputSchema>;

/** Family members added together; a family registers or adds up to 20 people at a time. */
export const membersInputSchema = z.array(memberInputSchema).max(20, 'tooMany');

/** A new family, known by its head's name, with the head's own details and the rest of the family. */
export const familyInputSchema = memberDetailsSchema.extend({
  headName: required(100),
  address: required(300),
  preferredAnbiyamId: z.string().optional(),
  members: membersInputSchema,
});
export type FamilyInput = z.infer<typeof familyInputSchema>;

/** The parish office's settings. Intentions can close up to a week before the Mass. */
export const settingsInputSchema = z.object({
  // Typed in a text box, or stored as a number.
  intentionCutoffMinutes: z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z
      .string()
      .trim()
      .regex(/^\d{1,5}$/, 'minutes')
      .transform(Number)
      .refine((minutes) => minutes <= 7 * 24 * 60, 'minutes'),
  ),
});
export type SettingsInput = z.input<typeof settingsInputSchema>;

export const removalInputSchema = z.object({ reason: z.enum(removalReasons), note: optionalText });
export type RemovalInput = z.infer<typeof removalInputSchema>;

const optionalDate = dateSchema.optional().or(z.literal(''));

/** A group as the office edits it; each text has an English and an optional Tamil field. */
export const groupInputSchema = z.object({
  kind: z.enum(groupKinds),
  name: required(100),
  nameTa: optionalText,
  description: optionalText,
  descriptionTa: optionalText,
  area: optionalText,
  areaTa: optionalText,
  meets: optionalText,
  meetsTa: optionalText,
  termFrom: optionalDate,
  termTo: optionalDate,
});
export type GroupInput = z.infer<typeof groupInputSchema>;

export const officerInputSchema = z.object({
  role: z.enum(officerRoles),
  name: required(100),
  phone: phoneSchema.optional().or(z.literal('')),
  memberId: z.string().optional(),
  seat: z.enum(councilSeats).optional(),
  representsId: z.string().optional(),
});
export type OfficerInput = z.infer<typeof officerInputSchema>;

/** What a group's office-bearers, or the parish office, send to the group: a message, or a news article when it has a title. */
export const groupPostSchema = z.object({
  title: z
    .string()
    .trim()
    .max(150, 'tooLong')
    .optional()
    .transform((title) => title || undefined),
  body: z.string().trim().min(1, 'required').max(4000, 'tooLong'),
});
export type GroupPostInput = z.input<typeof groupPostSchema>;

/** Someone the parish priest adds to the office team. They choose their own PIN when they first sign in. */
export const officeUserInputSchema = z.object({ name: required(100), phone: phoneSchema, role: z.enum(officeRoles) });
export type OfficeUserInput = z.infer<typeof officeUserInputSchema>;
