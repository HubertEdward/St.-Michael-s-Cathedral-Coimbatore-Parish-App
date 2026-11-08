import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Service } from './types.ts';
import { daysUntil, formatDate, formatTime, parishClock, upcomingServices } from './schedule.ts';

const mass = (id: string, day: Service['day'], time: string): Service => ({ id, kind: 'mass', day, time });
const services: Service[] = [
  mass('sun-0630', 0, '06:30'),
  mass('sun-1730', 0, '17:30'),
  mass('mon-0615', 1, '06:15'),
  { id: 'conf', kind: 'confession', day: 6, time: '17:00' },
];

test('parishClock uses Coimbatore time, not the device time zone', () => {
  // 20:00 UTC on Saturday is 01:30 on Sunday in Coimbatore.
  const clock = parishClock(new Date('2026-11-07T20:00:00Z'));
  assert.deepEqual(clock, { date: '2026-11-08', weekday: 0, minutes: 90 });
});

test('upcomingServices skips Masses that already started today', () => {
  // Sunday 08:00 IST
  const next = upcomingServices(services, new Date('2026-11-08T02:30:00Z'), { limit: 2 });
  assert.deepEqual(next.map((u) => [u.service.id, u.date]), [
    ['sun-1730', '2026-11-08'],
    ['mon-0615', '2026-11-09'],
  ]);
});

test('upcomingServices wraps into next week and filters by kind', () => {
  // Monday 07:00 IST: next Masses are next Sunday
  const next = upcomingServices(services, new Date('2026-11-09T01:30:00Z'), { limit: 3 });
  assert.deepEqual(next.map((u) => u.date), ['2026-11-15', '2026-11-15', '2026-11-16']);
  const confession = upcomingServices(services, new Date('2026-11-09T01:30:00Z'), { kind: 'confession' });
  assert.deepEqual(confession.map((u) => u.service.id), ['conf']);
});

test('daysUntil counts to this year or rolls to next year', () => {
  assert.equal(daysUntil(9, 29, new Date('2026-09-29T00:00:00Z')), 0);
  assert.equal(daysUntil(9, 29, new Date('2026-09-20T00:00:00Z')), 9);
  assert.equal(daysUntil(9, 29, new Date('2026-11-08T00:00:00Z')), 325);
});

test('formatTime and formatDate in both languages', () => {
  assert.equal(formatTime('05:15', 'en'), '5:15 AM');
  assert.equal(formatTime('17:30', 'en'), '5:30 PM');
  assert.equal(formatTime('12:00', 'en'), '12:00 PM');
  assert.equal(formatTime('18:30', 'ta'), 'மாலை 6:30');
  assert.equal(formatDate('2026-11-08', 'en'), 'Sun, 8 Nov');
});
