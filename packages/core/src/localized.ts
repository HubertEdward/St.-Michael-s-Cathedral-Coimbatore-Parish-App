export type Language = 'en' | 'ta';

/** Text shown to parishioners. English is required; Tamil falls back to English until supplied. */
export type Localized = { en: string; ta?: string };

export function pick(text: Localized, language: Language): string {
  return (language === 'ta' && text.ta) || text.en;
}
