// Pure date logic for the timetable. Everything is computed on Coimbatore time
// (IST, UTC+05:30, no daylight saving) so a visitor abroad still sees the
// cathedral's local "next Mass". Only type imports, so it runs under `node --test`.
import type { Language } from './localized';
import type { Service, ServiceKind, Weekday } from './types';

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

export interface ParishClock {
  /** "YYYY-MM-DD" in Coimbatore. */
  date: string;
  weekday: Weekday;
  /** Minutes since midnight in Coimbatore. */
  minutes: number;
}

export function parishClock(now: Date): ParishClock {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    date: ist.toISOString().slice(0, 10),
    weekday: ist.getUTCDay() as Weekday,
    minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  };
}

/** Date and 24-hour time in Coimbatore for an ISO timestamp. */
export function parishDateTime(iso: string): { date: string; time: string } {
  const { date, minutes } = parishClock(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date, time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}` };
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): Weekday {
  return new Date(`${date}T00:00:00Z`).getUTCDay() as Weekday;
}

export function servicesOn(services: Service[], day: Weekday, kind?: ServiceKind): Service[] {
  return services
    .filter((s) => s.day === day && (!kind || s.kind === kind))
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
}

export interface UpcomingService {
  service: Service;
  /** "YYYY-MM-DD" in Coimbatore. */
  date: string;
}

/** The next services of a kind that have not started yet, looking `days` ahead (default a week). */
export function upcomingServices(
  services: Service[],
  now: Date,
  { kind = 'mass', limit = 3, days = 7 }: { kind?: ServiceKind; limit?: number; days?: number } = {},
): UpcomingService[] {
  const clock = parishClock(now);
  const upcoming: UpcomingService[] = [];
  for (let offset = 0; offset <= days && upcoming.length < limit; offset++) {
    const date = addDays(clock.date, offset);
    for (const service of servicesOn(services, weekdayOf(date), kind)) {
      if (offset === 0 && toMinutes(service.time) <= clock.minutes) continue;
      upcoming.push({ service, date });
      if (upcoming.length === limit) break;
    }
  }
  return upcoming;
}

/** Whole days from today (Coimbatore) until the next occurrence of a month/day; 0 on the day itself. */
export function daysUntil(month: number, day: number, now: Date): number {
  const today = parishClock(now).date;
  const year = Number(today.slice(0, 4));
  const on = (y: number) => `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const target = on(year) >= today ? on(year) : on(year + 1);
  return Math.round((Date.parse(target) - Date.parse(today)) / DAY_MS);
}

/** "6:30 AM" in English; "காலை 6:30" style in Tamil. */
export function formatTime(time: string, language: Language): string {
  const [hours, minutes] = time.split(':').map(Number);
  const clock = `${hours % 12 || 12}:${String(minutes).padStart(2, '0')}`;
  if (language === 'ta') {
    const part = hours < 12 ? 'காலை' : hours < 16 ? 'மதியம்' : hours < 19 ? 'மாலை' : 'இரவு';
    return `${part} ${clock}`;
  }
  return `${clock} ${hours < 12 ? 'AM' : 'PM'}`;
}

const weekdayNames: Record<Language, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
};

export function weekdayName(day: Weekday, language: Language): string {
  return weekdayNames[language][day];
}

const monthNames: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ta: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'],
};

/** Short month name for "YYYY-MM-DD". */
export function monthName(date: string, language: Language): string {
  return monthNames[language][Number(date.slice(5, 7)) - 1];
}

/** "Sun, 9 Nov" from "YYYY-MM-DD". */
export function formatDate(date: string, language: Language): string {
  const day = weekdayName(weekdayOf(date), language);
  const month = monthName(date, language);
  return `${language === 'en' ? day.slice(0, 3) : day}, ${Number(date.slice(8, 10))} ${month}`;
}
