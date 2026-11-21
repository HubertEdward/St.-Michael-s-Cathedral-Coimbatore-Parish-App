// Loads both songbooks, merged as in the app (a song in both books kept once), into a Supabase database,
// replacing what is there. For the central database, once the songbook moves there.
//
//   npm run backend:songs                                              the local backend
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run backend:songs   another one
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { songBooks } from '../../packages/core/src/types';
import { mergeBooks } from './merge';
import type { SongFile } from './occasions';

const songsFolder = join(__dirname, '..', '..', '..', '..', 'Songs');

function localBackend(): { url: string; key: string } {
  const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' })) as Record<string, string>;
  return { url: status.API_URL, key: status.SERVICE_ROLE_KEY };
}

async function main() {
  const files = songBooks.map((book) => JSON.parse(readFileSync(join(songsFolder, `${book}.json`), 'utf8')) as SongFile);
  const { kept } = mergeBooks(files);
  const { url, key } = process.env.SUPABASE_URL
    ? { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '' }
    : localBackend();
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const now = new Date().toISOString();
  const rows = kept.map(({ book, song }) => ({ book, number: song.number, title: song.title, occasions: song.occasions, stanzas: song.stanzas, updated_at: now }));
  const removed = await db.from('songs').delete().gte('number', 0);
  if (removed.error) throw new Error(removed.error.message);
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from('songs').insert(rows.slice(i, i + 200));
    if (error) throw new Error(`songs ${i}: ${error.message}`);
  }
  console.log(`Loaded ${rows.length} songs into ${url}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
