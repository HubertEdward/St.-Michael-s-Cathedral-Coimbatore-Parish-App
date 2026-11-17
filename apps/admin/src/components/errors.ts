const messages: Record<string, string> = {
  required: 'This field is required.',
  tooLong: 'This is too long.',
  phone: 'Enter a valid phone number.',
  date: 'Use the format YYYY-MM-DD.',
  time: 'Use 24-hour time, e.g. 06:30.',
  massNotOnDate: 'That Mass is not held on the chosen date.',
  massOutOfRange: 'Choose a Mass within the next 90 days.',
  intentionClosed: 'Intentions for that Mass have closed. Choose a later Mass.',
  minutes: 'Enter whole minutes, from 0 up to 10080 (one week).',
  anbiyamHasFamilies: 'Families still belong to this Anbiyam. Move them to another Anbiyam first.',
  pinFormat: 'The PIN is 6 digits.',
  pinTooSimple: 'Choose a PIN that is harder to guess, not 123456 or 111111.',
  pinMismatch: 'The two PINs are not the same.',
  noAccount: 'This number is not on the office team. Ask the parish priest to add it.',
  notOffice: 'Only the office team can do this. Sign in again.',
  resetCodeInvalid: 'That setup code is not right, was already used, or has expired. Ask the parish priest for a new one.',
  wrongPin: 'That number and PIN do not match. Try again, or use a setup code from the parish priest.',
  accountExists: 'A PIN was already chosen for this number. Sign in with it.',
  notPriest: 'Only the parish priest can do this.',
  officeUserExists: 'This number is already on the office team.',
  cannotRemoveSelf: 'You cannot take yourself off the office team.',
};

/** English text for validation and API error codes from @parish/core. */
export const errorText = (code: string | undefined) => (code && messages[code]) || 'Something went wrong. Please try again.';
