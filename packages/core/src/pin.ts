// Rules for sign-in PINs and the parish office's reset codes. Self-contained so `node --test` can load it.
import { z } from 'zod';

export const sixDigits = /^\d{6}$/;

/** True for PINs anyone would try first: one digit repeated (000000) or a run up or down (123456, 987654). */
export function isTooSimple(pin: string): boolean {
  const steps = new Set([...pin].slice(1).map((digit, i) => Number(digit) - Number(pin[i])));
  return steps.size === 1 && [0, 1, -1].includes([...steps][0]!);
}

/** A PIN someone is choosing: six digits, and not too simple. */
export const pinSchema = z.string().regex(sixDigits, 'pinFormat').refine((pin) => !isTooSimple(pin), 'pinTooSimple');
