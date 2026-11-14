/// <reference path="./parish-profile.d.ts" />
import profile from '@parish/profile';

import { clockIn, zonedToIso, type ParishClock } from './schedule';

/** The parish this build of the app belongs to. */
export const parish = profile;
export const { clergy, history, sacraments } = profile;

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

/** Pictures of the church for headers and the home carousel; the patron stands in when there are none. */
export const churchPhotos = profile.images.church.length > 0 ? profile.images.church : [profile.images.patron];

/** Whether it is evening or night at the church, when the night photo (if any) leads the home screen. */
export const isEvening = (clock: ParishClock): boolean => clock.minutes >= 18 * 60 + 15 || clock.minutes < 5 * 60;
