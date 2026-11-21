// Finding songs in the songbooks: by Tamil or English-letter search, by first letter, by occasion, by book.
import { songBooks, type Song, type SongBook, type SongOccasion } from './types.ts';

const vowels: Record<string, string> = {
  அ: 'a', ஆ: 'aa', இ: 'i', ஈ: 'ee', உ: 'u', ஊ: 'oo', எ: 'e', ஏ: 'e', ஐ: 'ai', ஒ: 'o', ஓ: 'o', ஔ: 'au', ஃ: 'k',
};
const consonants: Record<string, string> = {
  க: 'k', ங: 'ng', ச: 's', ஞ: 'nj', ட: 't', ண: 'n', த: 'th', ந: 'n', ப: 'p', ம: 'm', ய: 'y', ர: 'r', ல: 'l', வ: 'v',
  ழ: 'zh', ள: 'l', ற: 'r', ன: 'n', ஜ: 'j', ஷ: 'sh', ஸ: 's', ஹ: 'h', ஶ: 'sh',
};
const signs: Record<string, string> = {
  'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo', 'ெ': 'e', 'ே': 'e', 'ை': 'ai', 'ொ': 'o', 'ோ': 'o', 'ௌ': 'au',
};
const virama = '்';

/** Tamil in English letters, as people usually type it (ee for ீ, oo for ூ): "ஜீவ தேவன்" → "jeeva thevan". Other text passes through. */
export function romanize(text: string): string {
  let out = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (vowels[c]) out += vowels[c];
    else if (consonants[c]) {
      const next = chars[i + 1];
      if (next === virama) {
        out += consonants[c];
        i++;
      } else if (next && signs[next]) {
        out += consonants[c] + signs[next];
        i++;
      } else out += `${consonants[c]}a`;
    } else out += c;
  }
  return out;
}

/**
 * Spelling folded so that the many ways of writing Tamil in English letters meet: ee/ii → i, oo/uu → u, long vowels short,
 * th/dh/d → t, ch/sh/j → s, zh/ll → l, ey/ay → ei/ai, doubled letters single, and no spaces or punctuation.
 */
export function fold(text: string): string {
  // Words stay apart until the end, so no rule joins the end of one word to the start of the next.
  return romanize(text)
    .toLowerCase()
    .replace(/[^a-z஀-௿]+/g, ' ')
    .replace(/ee|ii/g, 'i')
    .replace(/oo|uu/g, 'u')
    .replace(/zh/g, 'l')
    .replace(/(t|d)h/g, 't')
    .replace(/d/g, 't')
    .replace(/(c|s)h|c|j/g, 's')
    .replace(/(k|g)h|g/g, 'k')
    .replace(/(p|b)h|b|f/g, 'p')
    .replace(/w/g, 'v')
    .replace(/([ae])y/g, '$1i')
    .replace(/nj|ng/g, 'n')
    .replace(/(.)\1+/g, '$1')
    .replace(/ /g, '');
}

/** Each song's text, folded once for searching. */
const searchIndex = new WeakMap<Song, { title: string; text: string; tamil: string }>();
function indexed(song: Song) {
  let entry = searchIndex.get(song);
  if (!entry) {
    const lines = song.stanzas.flat().join(' ');
    entry = { title: fold(song.title), text: fold(lines), tamil: `${song.title} ${lines}` };
    searchIndex.set(song, entry);
  }
  return entry;
}

/**
 * Songs matching a search in Tamil or English letters, or by number: those whose first line has every word
 * come first, then those with every word somewhere in the song, in any order.
 */
export function searchSongs(songs: Song[], query: string, { firstLineOnly = false } = {}): Song[] {
  const q = query.trim();
  if (!q) return songs;
  if (/^\d+$/.test(q)) {
    // The song with that number in each book first, then those whose number starts with it.
    const n = Number(q);
    return [...songs.filter((s) => s.number === n), ...songs.filter((s) => s.number !== n && String(s.number).startsWith(String(n)))];
  }
  const words = q.split(/\s+/).map((word) => ({ word, folded: fold(word) })).filter((w) => w.folded);
  if (words.length === 0) return [];
  const inTitle: Song[] = [];
  const inText: Song[] = [];
  for (const song of songs) {
    const entry = indexed(song);
    if (words.every((w) => entry.title.includes(w.folded) || song.title.includes(w.word))) inTitle.push(song);
    else if (!firstLineOnly && words.every((w) => entry.text.includes(w.folded) || entry.tamil.includes(w.word))) inText.push(song);
  }
  // A first line that starts with the search, then one with it as a phrase, then the rest.
  const phrase = fold(q);
  const rank = (song: Song) => {
    const title = indexed(song).title;
    return title.startsWith(phrase) ? 0 : title.includes(phrase) ? 1 : 2;
  };
  return [...inTitle.sort((a, b) => rank(a) - rank(b)), ...inText];
}

/** Tamil letters in dictionary order, as a songbook index lists them. */
export const tamilLetters = [
  'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ',
  'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன', 'ஜ', 'ஷ', 'ஸ', 'ஹ',
] as const;

/** The Tamil letter a song is listed under: its first vowel, or its first consonant (கா and கி under க). */
export const tamilLetterOf = (song: Song) => [...song.title.trim()][0] ?? '';

/** The English letter a song is listed under, from its first line in English letters. */
export const englishLetterOf = (song: Song) => romanize(song.title.trim()).charAt(0).toUpperCase();

/** Songs grouped under each letter that has any, in order. */
export function byLetter(songs: Song[], letterOf: (song: Song) => string, order?: readonly string[]): { letter: string; songs: Song[] }[] {
  const groups = new Map<string, Song[]>();
  for (const song of songs) {
    const letter = letterOf(song);
    groups.set(letter, [...(groups.get(letter) ?? []), song]);
  }
  const letters = [...groups.keys()].sort((a, b) =>
    order ? (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999) || a.localeCompare(b) : a.localeCompare(b),
  );
  return letters.map((letter) => ({ letter, songs: groups.get(letter)! }));
}

/** How many songs each occasion has. */
export function occasionCounts(songs: Song[]): Map<SongOccasion, number> {
  const counts = new Map<SongOccasion, number>();
  for (const song of songs) for (const o of song.occasions) counts.set(o, (counts.get(o) ?? 0) + 1);
  return counts;
}

/** Vowel signs in dictionary order; a consonant with the pulli (க்) comes before the bare one (க). */
const signOrder = ['்', '', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'];
const letterRank = new Map<string, number>(tamilLetters.map((letter, i) => [letter, i]));

/**
 * A key that sorts Tamil in dictionary order (அ ஆ … க ங ச … ற ன), which Unicode's order does not:
 * letter by letter, each as its consonant or vowel, then its vowel sign.
 */
export function tamilSortKey(text: string): string {
  const chars = [...text.trim()];
  let key = '';
  for (let i = 0; i < chars.length; i++) {
    const rank = letterRank.get(chars[i]);
    if (rank === undefined) {
      if (signOrder.includes(chars[i])) continue;
      // Anything else (a space, a digit, Latin) sorts after Tamil letters, in its own order.
      key += String.fromCharCode(0x2000 + (chars[i].codePointAt(0) ?? 0) % 0xd000);
      continue;
    }
    const sign = signOrder.indexOf(chars[i + 1] ?? '');
    key += String.fromCharCode(0x100 + rank * 16 + (sign === -1 ? 1 : sign));
  }
  return key;
}

export const compareTamil = (a: string, b: string) => {
  const ka = tamilSortKey(a);
  const kb = tamilSortKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
};

/** Ways to narrow the songbook; every filter given must hold. */
export interface SongFilter {
  /** Words in Tamil or English letters, or a song number. */
  query?: string;
  /** Search only the first lines, not the whole songs. */
  firstLineOnly?: boolean;
  /** Songs for any of these occasions. */
  occasions?: readonly SongOccasion[];
  /** Songs whose first line starts with this letter. */
  letter?: { script: 'tamil' | 'english'; letter: string };
  /** Songs from this book only. */
  book?: SongBook;
  /** Only these songs, by id, kept in this order unless sorted (favourites, recently opened). */
  only?: readonly string[];
  /** Book order (இறை அலைகள் first), Tamil alphabetical order, or (when left out) best match first for a search. */
  sort?: 'number' | 'alphabet';
}

/** Book order: the books in turn, each by its numbers. */
const bookOrder = (a: Song, b: Song) => songBooks.indexOf(a.book) - songBooks.indexOf(b.book) || a.number - b.number;

/** The songbook narrowed and ordered by a filter. */
export function filterSongs(songs: Song[], filter: SongFilter): Song[] {
  let list = songs;
  if (filter.only) {
    const byId = new Map(songs.map((s) => [s.id, s]));
    list = filter.only.map((id) => byId.get(id)).filter((s): s is Song => !!s);
  }
  if (filter.book) list = list.filter((s) => s.book === filter.book);
  if (filter.occasions && filter.occasions.length > 0) {
    const wanted = filter.occasions;
    list = list.filter((s) => s.occasions.some((o) => wanted.includes(o)));
  }
  if (filter.letter) {
    const { script, letter } = filter.letter;
    const letterOf = script === 'tamil' ? tamilLetterOf : englishLetterOf;
    list = list.filter((s) => letterOf(s) === letter);
  }
  if (filter.query?.trim()) list = searchSongs(list, filter.query, { firstLineOnly: filter.firstLineOnly });
  if (filter.sort === 'number') return [...list].sort(bookOrder);
  if (filter.sort === 'alphabet') return [...list].sort((a, b) => compareTamil(a.title, b.title) || bookOrder(a, b));
  return list;
}
