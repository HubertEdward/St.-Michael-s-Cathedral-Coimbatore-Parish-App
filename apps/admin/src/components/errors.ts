const messages: Record<string, string> = {
  required: 'This field is required.',
  tooLong: 'This is too long.',
  phone: 'Enter a valid phone number.',
  date: 'Use the format YYYY-MM-DD.',
  time: 'Use 24-hour time, e.g. 06:30.',
  massNotOnDate: 'That Mass is not held on the chosen date.',
  massOutOfRange: 'Choose a Mass within the next 90 days.',
};

/** English text for validation and API error codes from @parish/core. */
export const errorText = (code: string | undefined) => (code && messages[code]) || 'Something went wrong. Please try again.';
