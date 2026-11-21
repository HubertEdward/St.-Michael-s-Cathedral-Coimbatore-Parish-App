// Downloads the "இறை அலைகள்" songbook texts from bibleintamil.com and writes them as one JSON file.
// Fr. S. Agilan SDB, who compiled the songbook and holds its copyright, allowed the parish to use the songs
// (email, 17 November 2026); the lyrics belong to their composers.
//
//   npm run songs:fetch            writes ../../Songs/iraialaihal.json (beside the repo, never committed)
//
// The repo is public, so the lyrics stay out of it: the pages are kept under ../../Songs/iraialaihal-pages,
// fetched once, slowly, and the parsed songs go to the database with npm run backend:songs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { occasions, type Occasion, type SongFile } from './occasions';

const site = 'https://bibleintamil.com/iraialai';
const out = join(__dirname, '..', '..', '..', '..', 'Songs');
const pages = join(out, 'iraialaihal-pages');
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A page, from the cache or the site (then cached). */
async function page(name: string): Promise<string> {
  const cached = join(pages, name);
  if (existsSync(cached)) return readFileSync(cached, 'utf8');
  await pause(500);
  const response = await fetch(`${site}/${name}`, { headers: { 'User-Agent': 'St Michaels parish app songbook (one-time copy)' } });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
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

/** Song numbers and first lines from an occasion's list (a script that writes the menu). */
function songList(script: string): { number: string; firstLine: string }[] {
  return [...script.matchAll(/HREF="s(\d+)\.htm"[^>]*>([^<]+)</gi)].map(([, number, label]) => ({
    number,
    firstLine: clean(label).replace(/^\d+\.\s*/, ''),
  }));
}

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
  // A few page titles were mangled when the site converted from an old Tamil font; the first line was not.
  const firstLine = stanzas[0]?.[0] ?? '';
  return { title: !title || garbled(title) ? firstLine : title, stanzas };
}

/**
 * Text the site mangled when converting from an old Tamil font: Latin letters with accents, English words
 * typed in that font (they come out as nonsense such as "ழயயீயீல"), ஐ where ஜ was meant (நிஐம்), or a vowel
 * sign with no letter before it.
 */
const garbled = (text: string) =>
  /[À-ɏ]|யீயீ|லுநய|[க-ஹா-்]ஐ|[ா-ௌ][ா-்]|(^|\s)[ா-்]/.test(text);

async function main() {
  mkdirSync(pages, { recursive: true });
  const songs = new Map<string, SongFile['songs'][number]>();
  for (const occasion of Object.keys(occasions) as Occasion[]) {
    const list = songList(await page(`menu-${occasion}.js`));
    for (const { number, firstLine } of list) {
      const existing = songs.get(number);
      if (existing) {
        existing.occasions.push(occasion);
        continue;
      }
      const { title, stanzas } = songPage(await page(`s${number}.htm`), number);
      songs.set(number, { number: Number(number), title: title || firstLine, occasions: [occasion], stanzas });
    }
    console.log(`${occasions[occasion].en}: ${list.length}`);
  }
  const empty = [...songs.values()].filter((s) => s.stanzas.length === 0);
  const toCheck = [...songs.values()].filter((s) => s.stanzas.flat().some(garbled));
  writeFileSync(
    join(out, 'songs-to-check.md'),
    [
      '# Songs to check against the printed book',
      '',
      'The site’s text of these songs has lines mangled by an old Tamil font conversion (often an English phrase).',
      'Correct them from the printed இறை அலைகள் before the songbook goes live.',
      '',
      ...toCheck.map((s) => `- ${s.number}. ${s.title}: ${s.stanzas.flat().filter(garbled).join(' / ')}`),
      '',
    ].join('\n'),
  );
  console.log(`${toCheck.length} songs listed in songs-to-check.md for proofreading.`);
  const file: SongFile = {
    source: 'இறை அலைகள் – வழிபாட்டுப் பாடல்கள் (bibleintamil.com/iraialai)',
    fetchedOn: new Date().toISOString().slice(0, 10),
    songs: [...songs.values()].sort((a, b) => a.number - b.number),
  };
  writeFileSync(join(out, 'iraialaihal.json'), JSON.stringify(file, null, 1));
  console.log(`${file.songs.length} songs written to ${join(out, 'iraialaihal.json')}${empty.length ? `; ${empty.length} without lyrics: ${empty.map((s) => s.number).join(', ')}` : ''}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
