import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatRupees, monthlyTotal, nextDebitOn, pastDebits } from './giving.ts';
import type { Subscription } from './types.ts';

const subscription = (overrides: Partial<Subscription>): Subscription => ({
  id: 's',
  name: 'Test',
  phone: '+91 98430 00000',
  amount: 500,
  purpose: 'parish',
  debitDay: 5,
  status: 'active',
  startsOn: '2026-09-05',
  createdAt: '2026-09-01T00:00:00Z',
  ...overrides,
});

test('next debit is this month when the day has not passed, else next month', () => {
  assert.equal(nextDebitOn(10, '2026-11-09'), '2026-11-10');
  assert.equal(nextDebitOn(5, '2026-11-05'), '2026-11-05');
  assert.equal(nextDebitOn(1, '2026-11-09'), '2026-12-01');
  assert.equal(nextDebitOn(15, '2026-12-20'), '2027-01-15');
});

test('past debits run monthly from the start, newest first', () => {
  assert.deepEqual(pastDebits(subscription({}), '2026-11-09'), ['2026-11-05', '2026-10-05', '2026-09-05']);
  assert.deepEqual(pastDebits(subscription({ startsOn: '2026-12-05' }), '2026-11-09'), []);
});

test('monthly total counts only active subscriptions', () => {
  assert.equal(monthlyTotal([subscription({ amount: 500 }), subscription({ amount: 250, status: 'paused' })]), 500);
});

test('rupees use Indian grouping and no paise', () => {
  assert.equal(formatRupees(250000, 'en'), '₹2,50,000');
});
