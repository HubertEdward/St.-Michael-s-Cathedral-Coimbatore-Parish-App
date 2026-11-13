import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isTooSimple, pinSchema } from './pin.ts';

const problem = (pin: string) => pinSchema.safeParse(pin).error?.issues[0]?.message;

test('accepts six digits that are not a simple pattern', () => {
  for (const pin of ['246810', '482916', '102938']) assert.equal(problem(pin), undefined, pin);
});

test('needs exactly six digits', () => {
  for (const pin of ['', '12345', '1234567', '12a456', ' 24681']) assert.equal(problem(pin), 'pinFormat', pin);
});

test('refuses repeated digits and runs up or down', () => {
  for (const pin of ['000000', '999999', '123456', '345678', '987654', '654321']) {
    assert.ok(isTooSimple(pin), pin);
    assert.equal(problem(pin), 'pinTooSimple', pin);
  }
  assert.ok(!isTooSimple('135791'));
});
