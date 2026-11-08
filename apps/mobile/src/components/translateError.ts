import type { TFunction } from 'i18next';

const codes = ['required', 'tooLong', 'phone', 'date', 'time', 'massNotOnDate', 'massOutOfRange'] as const;
type Code = (typeof codes)[number];

/** Turns a validation or API error code from @stmichaels/core into a translated sentence. */
export function translateError(t: TFunction, message: string | undefined): string {
  return codes.includes(message as Code) ? t(`validation.${message as Code}`) : t('common.error');
}
