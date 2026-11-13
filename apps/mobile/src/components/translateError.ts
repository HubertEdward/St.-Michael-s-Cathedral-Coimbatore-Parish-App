import type { TFunction } from 'i18next';

const codes = ['required', 'tooLong', 'phone', 'date', 'time', 'amountMin', 'amountMax', 'massNotOnDate', 'massOutOfRange', 'familyNotFound', 'alreadyInFamily', 'notSignedIn', 'pinFormat', 'pinTooSimple', 'pinMismatch', 'resetCodeFormat', 'noAccount', 'accountExists', 'wrongPin', 'resetCodeInvalid'] as const;
type Code = (typeof codes)[number];

/** Turns a validation or API error code from @parish/core into a translated sentence. */
export function translateError(t: TFunction, message: string | undefined): string {
  return codes.includes(message as Code) ? t(`validation.${message as Code}`) : t('common.error');
}
