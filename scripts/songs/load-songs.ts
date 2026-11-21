// Loads the songbook written by npm run songs:fetch into a Supabase database, replacing what is there.
//
//   npm run backend:songs                                              the local backend
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run backend:songs   another one
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { occasions, type SongFile } from './occasions';

const file = join(__dirname, '..', '..', '..', '..', 'Songs', 'iraialaihal.json');

function localBackend(): { url: string; key: string } {
  const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' })) as Record<string, string>;
  return { url: status.API_URL, key: status.SERVICE_ROLE_KEY };
}

async function main() {
  const book = JSON.parse(readFileSync(file, 'utf8')) as SongFile;
  const { url, key } = process.env.SUPABASE_URL
    ? { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '' }
    : localBackend();
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const rows = book.songs.map((s) => ({
    number: s.number,
    title: s.title,
    occasions: s.occasions.map((o) => occasions[o].key),
    stanzas: s.stanzas,
    updated_at: new Date().toISOString(),
  }));
  const removed = await db.from('songs').delete().gte('number', 0);
  if (removed.error) throw new Error(removed.error.message);
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from('songs').insert(rows.slice(i, i + 200));
    if (error) throw new Error(`songs ${i}: ${error.message}`);
  }
  console.log(`Loaded ${rows.length} songs (${book.source}, fetched ${book.fetchedOn}) into ${url}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
