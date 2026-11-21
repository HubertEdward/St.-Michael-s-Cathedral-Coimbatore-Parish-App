// Merging the songbooks: a song that a later book repeats from an earlier one is kept once, as the earlier
// book's entry (இறை அலைகள் comes first), with the occasions from both. Songs within one book are never merged:
// a book can have two songs that begin alike (two versions, two tunes).
import type { SongFile } from './occasions';

type Song = SongFile['songs'][number];

/**
 * What identifies the same song across books: its first line, and how each of its first three stanzas
 * begins, as Tamil letters only, so spacing and punctuation do not matter. Two versions with the same refrain
 * but other verses stay apart: better shown twice than a set of verses lost.
 */
export const sameSongKey = (song: Song) => {
  const tamil = (text: string) => text.replace(/[^஀-௿]/g, '');
  const first = tamil(song.stanzas[0]?.[0] ?? song.title);
  if (!first) return '';
  return [first, ...song.stanzas.slice(1, 3).map((stanza) => tamil(stanza[0] ?? '').slice(0, 14))].join('|');
};

export function mergeBooks(files: SongFile[]) {
  const kept: { book: SongFile['book']; song: Song }[] = [];
  const earlier = new Map<string, Song>();
  let duplicates = 0;
  for (const file of files) {
    const added: [string, Song][] = [];
    for (const song of file.songs) {
      const key = sameSongKey(song);
      const first = key ? earlier.get(key) : undefined;
      if (first) {
        first.occasions = [...new Set([...first.occasions, ...song.occasions.filter((o) => o !== 'other')])];
        duplicates++;
        continue;
      }
      if (key) added.push([key, song]);
      kept.push({ book: file.book, song });
    }
    // Only once the whole book is in, so its own songs are matched against earlier books only.
    for (const [key, song] of added) if (!earlier.has(key)) earlier.set(key, song);
  }
  return { kept, duplicates };
}
