// Finding songs in the songbook: by Tamil or English-letter search, by first letter, by occasion.
import type { Song, SongOccasion } from './types';

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
export function searchSongs(songs: Song[], query: string): Song[] {
  const q = query.trim();
  if (!q) return songs;
  if (/^\d+$/.test(q)) return songs.filter((s) => String(s.number).startsWith(String(Number(q))));
  const words = q.split(/\s+/).map((word) => ({ word, folded: fold(word) })).filter((w) => w.folded);
  if (words.length === 0) return [];
  const inTitle: Song[] = [];
  const inText: Song[] = [];
  for (const song of songs) {
    const entry = indexed(song);
    if (words.every((w) => entry.title.includes(w.folded) || song.title.includes(w.word))) inTitle.push(song);
    else if (words.every((w) => entry.text.includes(w.folded) || entry.tamil.includes(w.word))) inText.push(song);
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
