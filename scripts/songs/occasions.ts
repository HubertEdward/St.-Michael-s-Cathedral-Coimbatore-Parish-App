// The two songbooks on bibleintamil.com: their sections (keyed by page names on the site, in the site's order)
// and which of the app's occasions each one is.
import type { SongBook, SongOccasion } from '../../packages/core/src/types';

interface Book {
  /** The book's folder on the site. */
  path: string;
  title: string;
  /** Section page name → the app's occasion. */
  sections: Record<string, SongOccasion>;
  /**
   * Song pages to read beyond those listed in the sections, if any: some songs are in no section's list
   * (the site's "பல்வகை", miscellaneous, list is missing), and are marked as "other".
   */
  pages?: { from: number; to: number };
}

export const books: Record<SongBook, Book> = {
  iraialaihal: {
    path: 'iraialai',
    title: 'இறை அலைகள் – வழிபாட்டுப் பாடல்கள்',
    sections: {
      entrance: 'entrance',
      paslms: 'psalms',
      response: 'meditation',
      offertory: 'offertory',
      communion: 'communion',
      thanks: 'thanksgiving',
      matha: 'mary',
      // The site's heading for this list says Infant Jesus, but it holds songs to many saints.
      saints: 'saints',
      holyspirit: 'charismatic',
      adoration: 'adoration',
      recons: 'reconciliation',
      sheart: 'sacredHeart',
      bajan: 'bhajan',
      children: 'children',
      xmas: 'christmas',
      lent: 'lent',
      fordead: 'departed',
      mass: 'massSettings',
    },
  },
  thirattu: {
    path: 'songstext',
    title: 'பாடல்கள் (bibleintamil.com)',
    sections: {
      mass: 'massSettings',
      entrance: 'entrance',
      response: 'meditation',
      offertory: 'offertory',
      communion: 'communion',
      thanks: 'thanksgiving',
      adoration: 'adoration',
      bajan: 'bhajan',
      matha: 'mary',
      saints: 'saints',
      holyspirit: 'holySpirit',
      marriage: 'marriage',
      priesthood: 'priesthood',
      fordead: 'departed',
      mercy: 'mercy',
      pentecost: 'charismatic',
      traditional: 'traditional',
      lent: 'lent',
      xmas: 'christmas',
    },
    pages: { from: 1, to: 1237 },
  },
};

/** What fetch-songs writes for each book (../../Songs/<book>.json) and bundle-songs and load-songs read. */
export interface SongFile {
  book: SongBook;
  source: string;
  fetchedOn: string;
  songs: { number: number; title: string; occasions: SongOccasion[]; stanzas: string[][] }[];
}
