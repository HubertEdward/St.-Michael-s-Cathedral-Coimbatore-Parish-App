// The songbook's sections, keyed by their page names on bibleintamil.com/iraialai, in the book's order.
import type { SongOccasion } from '../../packages/core/src/types';

export const occasions = {
  entrance: { en: 'Entrance', key: 'entrance' },
  paslms: { en: 'Psalms', key: 'psalms' },
  response: { en: 'Meditation', key: 'meditation' },
  offertory: { en: 'Offertory', key: 'offertory' },
  communion: { en: 'Communion', key: 'communion' },
  thanks: { en: 'Thanksgiving', key: 'thanksgiving' },
  matha: { en: 'Our Lady', key: 'mary' },
  // The site's heading for this list says Infant Jesus, but it holds songs to many saints.
  saints: { en: 'Saints', key: 'saints' },
  holyspirit: { en: 'Charismatic', key: 'charismatic' },
  adoration: { en: 'Adoration', key: 'adoration' },
  recons: { en: 'Reconciliation', key: 'reconciliation' },
  sheart: { en: 'Sacred Heart', key: 'sacredHeart' },
  bajan: { en: 'Bhajans', key: 'bhajan' },
  children: { en: 'Children', key: 'children' },
  xmas: { en: 'Christmas', key: 'christmas' },
  lent: { en: 'Lent', key: 'lent' },
  fordead: { en: 'For the departed', key: 'departed' },
  mass: { en: 'Mass settings', key: 'massSettings' },
} as const satisfies Record<string, { en: string; key: SongOccasion }>;

export type Occasion = keyof typeof occasions;

/** What fetch-iraialaihal writes and load-songs reads. */
export interface SongFile {
  source: string;
  fetchedOn: string;
  songs: { number: number; title: string; occasions: Occasion[]; stanzas: string[][] }[];
}
