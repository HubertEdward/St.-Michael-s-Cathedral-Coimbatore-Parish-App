// Downloads the two songbooks on bibleintamil.com and writes each as one JSON file beside the repo:
//  - "இறை அலைகள்", compiled by Fr. S. Agilan SDB, who allowed the parish to use its songs (email, 17 November 2026);
//  - the site's own collection of songs ("பாடல்கள்"), added at the user's request (21 November 2026).
// The lyrics belong to their composers.
//
//   npm run songs:fetch       writes ../../Songs/iraialaihal.json and ../../Songs/thirattu.json, never committed
//
// The repo is public, so the lyrics stay out of it. Pages are kept under ../../Songs/<book>-pages: each is
// fetched once, slowly. npm run songs:bundle then packs both books into the parishioner app.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SongBook, SongOccasion } from '../../packages/core/src/types';
import { books, type SongFile } from './occasions';

const out = join(__dirname, '..', '..', '..', '..', 'Songs');
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A page of a book, from the cache or the site (then cached); null if the site has no such page. */
async function page(book: SongBook, name: string): Promise<string | null> {
  const folder = join(out, `${book}-pages`);
  mkdirSync(folder, { recursive: true });
  const cached = join(folder, name);
  if (existsSync(cached)) {
    const text = readFileSync(cached, 'utf8');
    return text === '' ? null : text;
  }
  await pause(500);
  const response = await fetch(`https://www.bibleintamil.com/${books[book].path}/${name}`, {
    headers: { 'User-Agent': 'St Michaels parish app songbook (one-time copy)' },
  });
  if (response.status === 404) {
    writeFileSync(cached, '');
    return null;
  }
  if (!response.ok) throw new Error(`${book}/${name}: ${response.status}`);
  const text = await response.text();
  writeFileSync(cached, text);
  return text;
}

const entities = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));

const clean = (html: string) =>
  entities(html.replace(/<[^>]+>/g, ''))
    .replace(/[ \t ]+/g, ' ')
    // The old font put ஐ where ஜ belongs (ராஐனே, நிஐம், ஐீவன்): inside a word, or before a vowel sign, only ஜ makes sense.
    .replace(/([க-ஹா-்])ஐ/g, '$1ஜ')
    .replace(/ஐ(?=[ா-்])/g, 'ஜ')
    .trim();

/**
 * Text the site mangled when converting from an old Tamil font: Latin letters with accents, English words
 * typed in that font (they come out as nonsense such as "ழயயீயீல"), or a vowel sign with no letter before it.
 */
const garbled = (text: string) => /[À-ɏ]|யீயீ|லுநய|[ா-ௌ][ா-்]|(^|\s)[ா-்]/.test(text);

/** Song numbers listed in a section (a script that writes the section's menu). */
const listed = (script: string) => [...script.matchAll(/HREF="s(\d+)\.htm"/gi)].map(([, number]) => number);

/** The title and the stanzas (each a list of lines) of a song page. */
function songPage(html: string, number: string): { title: string; stanzas: string[][] } {
  const title = clean(html.match(/<p\s+class="songtitle">([\s\S]*?)<\/p>/i)?.[1] ?? '');
  const body = html.match(/class="datatext">([\s\S]*?)<\/td>/i)?.[1] ?? '';
  const stanzas = body
    .split(/<\/?p[^>]*>/i)
    .map((block) =>
      block
        .split(/<br\s*\/?>/i)
        .map(clean)
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0);
  // The first line repeats the song's number, as in the printed book (once without the dot).
  if (stanzas[0]) stanzas[0][0] = stanzas[0][0].replace(new RegExp(`^0*${Number(number)}\\.?\\s+`), '');
  // A few page titles were mangled by the font conversion; the first line was not.
  const firstLine = stanzas[0]?.[0] ?? '';
  return { title: !title || garbled(title) ? firstLine : title, stanzas };
}

async function fetchBook(book: SongBook): Promise<SongFile> {
  const { sections, pages, title } = books[book];
  // Which occasions each song number is listed under.
  const occasionsOf = new Map<string, SongOccasion[]>();
  for (const [section, occasion] of Object.entries(sections)) {
    const script = await page(book, `menu-${section}.js`);
    const numbers = script ? listed(script) : [];
    for (const number of numbers) occasionsOf.set(number, [...new Set([...(occasionsOf.get(number) ?? []), occasion])]);
    console.log(`${book} ${section}: ${numbers.length}`);
  }
  const numbers = new Set(occasionsOf.keys());
  if (pages) for (let n = pages.from; n <= pages.to; n++) numbers.add(String(n).padStart(4, '0'));

  const songs: SongFile['songs'] = [];
  let missing = 0;
  for (const number of [...numbers].sort()) {
    const html = await page(book, `s${number}.htm`);
    const song = html ? songPage(html, number) : undefined;
    if (!song || song.stanzas.length === 0) {
      missing++;
      continue;
    }
    songs.push({ number: Number(number), title: song.title, occasions: occasionsOf.get(number) ?? ['other'], stanzas: song.stanzas });
  }
  console.log(`${book}: ${songs.length} songs${missing ? ` (${missing} numbers have no page or no words)` : ''}`);
  return { book, source: `${title} (bibleintamil.com/${books[book].path})`, fetchedOn: new Date().toISOString().slice(0, 10), songs };
}

async function main() {
  const toCheck: string[] = [];
  for (const book of Object.keys(books) as SongBook[]) {
    const file = await fetchBook(book);
    writeFileSync(join(out, `${book}.json`), JSON.stringify(file, null, 1));
    for (const s of file.songs.filter((s) => s.stanzas.flat().some(garbled))) {
      toCheck.push(`- ${books[book].title} ${s.number}. ${s.title}: ${s.stanzas.flat().filter(garbled).join(' / ')}`);
    }
  }
  writeFileSync(
    join(out, 'songs-to-check.md'),
    [
      '# Songs to check against the printed books',
      '',
      'The site’s text of these songs has lines mangled by an old Tamil font conversion (often an English phrase).',
      'Correct them before the songbook goes live.',
      '',
      ...toCheck,
      '',
    ].join('\n'),
  );
  console.log(`${toCheck.length} songs listed in songs-to-check.md for proofreading.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
