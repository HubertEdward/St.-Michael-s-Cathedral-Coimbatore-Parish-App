// Pure date logic for the timetable. Everything is computed in the church's own
// time zone, so a visitor abroad still sees the parish's local "next Mass".
// Only type imports, so it runs under `node --test`; parish.ts binds it to the
// parish's time zone.
import type { Language } from './localized';
import type { Service, ServiceKind, Weekday } from './types';

const DAY_MS = 86_400_000;

export interface ParishClock {
  /** "YYYY-MM-DD" at the church. */
  date: string;
  weekday: Weekday;
  /** Minutes since midnight at the church. */
  minutes: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock date and time in an IANA time zone. */
export function clockIn(timeZone: string, now: Date): ParishClock {
  const parts: Record<string, string> = {};
  for (const part of formatterFor(timeZone).formatToParts(now)) parts[part.type] = part.value;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, weekday: weekdayOf(date), minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

/** The instant a wall-clock "YYYY-MM-DD" date and "HH:mm" time occur in an IANA time zone, as ISO. */
export function zonedToIso(timeZone: string, date: string, time: string): string {
  const wall = Date.parse(`${date}T${time}:00Z`);
  const offset = (instant: number) => {
    const clock = clockIn(timeZone, new Date(instant));
    return Date.parse(`${clock.date}T00:00:00Z`) + clock.minutes * 60_000 - Math.floor(instant / 60_000) * 60_000;
  };
  // A second pass corrects the guess when the offset changes near a daylight-saving switch.
  const guess = wall - offset(wall);
  return new Date(wall - offset(guess)).toISOString();
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
  /** "YYYY-MM-DD" at the church. */
  date: string;
}

/** The next services of a kind that have not started yet, looking `days` ahead (default a week). */
export function upcomingServices(
  services: Service[],
  clock: ParishClock,
  { kind = 'mass', limit = 3, days = 7 }: { kind?: ServiceKind; limit?: number; days?: number } = {},
): UpcomingService[] {
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

/** "YYYY-MM-DD" of the next occurrence of a month/day on or after `today`. */
export function nextOccurrence(month: number, day: number, today: string): string {
  const year = Number(today.slice(0, 4));
  const on = (y: number) => `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return on(year) >= today ? on(year) : on(year + 1);
}

/** Whole days from `today` ("YYYY-MM-DD") until the next occurrence of a month/day; 0 on the day itself. */
export function daysUntil(month: number, day: number, today: string): number {
  return Math.round((Date.parse(nextOccurrence(month, day, today)) - Date.parse(today)) / DAY_MS);
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

const longMonthNames: Record<Language, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ta: ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'],
};

/** A yearly date such as a feast: "29 September" in English, "செப்டம்பர் 29" in Tamil. */
export function formatDayOfYear(month: number, day: number, language: Language): string {
  const name = longMonthNames[language][month - 1];
  return language === 'en' ? `${day} ${name}` : `${name} ${day}`;
}

/** "Sun, 9 Nov" from "YYYY-MM-DD". */
export function formatDate(date: string, language: Language): string {
  const day = weekdayName(weekdayOf(date), language);
  const month = monthName(date, language);
  return `${language === 'en' ? day.slice(0, 3) : day}, ${Number(date.slice(8, 10))} ${month}`;
}
