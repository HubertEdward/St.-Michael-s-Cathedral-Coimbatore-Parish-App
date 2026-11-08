import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Service } from './types.ts';
import { clockIn, daysUntil, formatDate, formatDayOfYear, formatTime, upcomingServices, zonedToIso } from './schedule.ts';

const zone = 'Asia/Kolkata';
const at = (iso: string) => clockIn(zone, new Date(iso));

const mass = (id: string, day: Service['day'], time: string): Service => ({ id, kind: 'mass', day, time });
const services: Service[] = [
  mass('sun-0630', 0, '06:30'),
  mass('sun-1730', 0, '17:30'),
  mass('mon-0615', 1, '06:15'),
  { id: 'conf', kind: 'confession', day: 6, time: '17:00' },
];

test('clockIn uses the church time zone, not the device time zone', () => {
  // 20:00 UTC on Saturday is 01:30 on Sunday in India.
  assert.deepEqual(at('2026-11-07T20:00:00Z'), { date: '2026-11-08', weekday: 0, minutes: 90 });
  // Midnight is minute 0, not 24:00.
  assert.deepEqual(at('2026-11-07T18:30:00Z'), { date: '2026-11-08', weekday: 0, minutes: 0 });
});

test('zonedToIso turns church wall-clock time into an instant', () => {
  assert.equal(zonedToIso(zone, '2026-11-08', '06:30'), '2026-11-08T01:00:00.000Z');
  // Across a daylight-saving change: London is UTC+1 in July and UTC+0 in December.
  assert.equal(zonedToIso('Europe/London', '2026-07-01', '09:00'), '2026-07-01T08:00:00.000Z');
  assert.equal(zonedToIso('Europe/London', '2026-12-01', '09:00'), '2026-12-01T09:00:00.000Z');
});

test('upcomingServices skips Masses that already started today', () => {
  // Sunday 08:00 IST
  const next = upcomingServices(services, at('2026-11-08T02:30:00Z'), { limit: 2 });
  assert.deepEqual(next.map((u) => [u.service.id, u.date]), [
    ['sun-1730', '2026-11-08'],
    ['mon-0615', '2026-11-09'],
  ]);
});

test('upcomingServices wraps into next week and filters by kind', () => {
  // Monday 07:00 IST: next Masses are next Sunday
  const next = upcomingServices(services, at('2026-11-09T01:30:00Z'), { limit: 3 });
  assert.deepEqual(next.map((u) => u.date), ['2026-11-15', '2026-11-15', '2026-11-16']);
  const confession = upcomingServices(services, at('2026-11-09T01:30:00Z'), { kind: 'confession' });
  assert.deepEqual(confession.map((u) => u.service.id), ['conf']);
});

test('daysUntil counts to this year or rolls to next year', () => {
  assert.equal(daysUntil(9, 29, '2026-09-29'), 0);
  assert.equal(daysUntil(9, 29, '2026-09-20'), 9);
  assert.equal(daysUntil(9, 29, '2026-11-08'), 325);
});

test('formatTime, formatDate and formatDayOfYear in both languages', () => {
  assert.equal(formatTime('05:15', 'en'), '5:15 AM');
  assert.equal(formatTime('17:30', 'en'), '5:30 PM');
  assert.equal(formatTime('12:00', 'en'), '12:00 PM');
  assert.equal(formatTime('18:30', 'ta'), 'மாலை 6:30');
  assert.equal(formatDate('2026-11-08', 'en'), 'Sun, 8 Nov');
  assert.equal(formatDayOfYear(9, 29, 'en'), '29 September');
  assert.equal(formatDayOfYear(9, 29, 'ta'), 'செப்டம்பர் 29');
});
