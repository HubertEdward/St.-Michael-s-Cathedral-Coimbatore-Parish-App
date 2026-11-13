// Form and input rules shared by both apps (and, in Phase 2, by the backend).
// Messages are codes (see ValidationCode); each app translates them.
import { z } from 'zod';

import { pinSchema, sixDigits } from './pin';
import { certificateKinds, givingPurposes, intentionTypes, relationships } from './types';

export type ValidationCode =
  | 'required'
  | 'tooLong'
  | 'phone'
  | 'date'
  | 'time'
  | 'amountMin'
  | 'amountMax'
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
export const dateSchema = z.string().min(1, 'required').regex(/^\d{4}-\d{2}-\d{2}$/, 'date');
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
  sacramentDate: dateSchema.optional().or(z.literal('')),
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

export const familyInputSchema = z.object({
  familyName: required(100),
  headName: required(100),
  address: required(300),
  anbiyam: optionalText,
});
export type FamilyInput = z.infer<typeof familyInputSchema>;

const birthDateSchema = dateSchema.optional().or(z.literal(''));

export const joinFamilySchema = z.object({
  code: z.string().trim().min(1, 'required').max(20, 'tooLong'),
  name: required(100),
  relationship: z.enum(relationships),
  birthDate: birthDateSchema,
});
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>;

export const memberInputSchema = z.object({
  name: required(100),
  relationship: z.enum(relationships),
  birthDate: birthDateSchema,
});
export type MemberInput = z.infer<typeof memberInputSchema>;
