// Monthly giving: amounts and debit dates. Pure functions, shared by both apps.
import type { Language } from './localized';
import type { Subscription } from './types';

/** Suggested monthly amounts, in rupees. */
export const suggestedAmounts = [100, 250, 500, 1000, 2500] as const;

/** Debit days offered when setting up a mandate. */
export const debitDays = [1, 5, 10, 15] as const;

/** "₹1,000" — Indian digit grouping, no paise. */
export function formatRupees(amount: number, language: Language): string {
  return new Intl.NumberFormat(language === 'ta' ? 'ta-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const onDay = (month: string, day: number) => `${month}-${String(day).padStart(2, '0')}`;
/** "YYYY-MM" after "YYYY-MM". */
const nextMonth = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
};

/** The first "YYYY-MM-DD" on or after `today` that falls on `debitDay`. */
export function nextDebitOn(debitDay: number, today: string): string {
  const thisMonth = onDay(today.slice(0, 7), debitDay);
  return thisMonth >= today ? thisMonth : onDay(nextMonth(today.slice(0, 7)), debitDay);
}

/** Debits made so far, newest first: every debit day from the start up to `today`. */
export function pastDebits(subscription: Subscription, today: string): string[] {
  const dates: string[] = [];
  for (let date = subscription.startsOn; date <= today; date = onDay(nextMonth(date.slice(0, 7)), subscription.debitDay)) {
    dates.push(date);
  }
  return dates.reverse();
}

/** Rupees a month from active subscriptions. */
export const monthlyTotal = (subscriptions: Subscription[]) =>
  subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
