/// <reference path="./parish-profile.d.ts" />
import profile from '@parish/profile';

import { clockIn, zonedToIso, type ParishClock } from './schedule';

/** The parish this build of the app belongs to. */
export const parish = profile;
export const { clergy, history, ministries, sacraments } = profile;

/** The current date and time at the church, wherever the phone is. */
export const parishClock = (now: Date = new Date()): ParishClock => clockIn(parish.timeZone, now);

/** Date and 24-hour time at the church for an ISO timestamp. */
export function parishDateTime(iso: string): { date: string; time: string } {
  const { date, minutes } = parishClock(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date, time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}` };
}

/** ISO timestamp for a "YYYY-MM-DD" date and "HH:mm" time at the church. */
export const parishTimeToIso = (date: string, time: string): string => zonedToIso(parish.timeZone, date, time);
