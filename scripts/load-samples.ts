// Fills a Supabase database with the parish and the preview's sample families, groups, requests and
// messages, with every sample login on the preview PIN. Replaces whatever the parish had.
//
//   npm run backend:samples                      the local backend (npm run backend:start)
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run backend:samples     another one
//
// Never run it against the live parish database: it deletes the parish's data first.
import { execSync } from 'node:child_process';

import { createClient } from '@supabase/supabase-js';

import { parish } from '../packages/core/src/parish';
import { createSeed, DEMO_PIN, familyCodePrefix, OFFICE_DEMO_PHONES } from '../packages/core/src/data/seed';
import { memberRow, toRow } from '../packages/core/src/data/rows';
import { loginEmail } from '../packages/core/src/data/login';

function localBackend(): { url: string; key: string } {
  const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' })) as Record<string, string>;
  return { url: status.API_URL, key: status.SERVICE_ROLE_KEY };
}

const { url, key } = process.env.SUPABASE_URL
  ? { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '' }
  : localBackend();
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function check<T>(step: string, result: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await result;
  if (error) throw new Error(`${step}: ${error.message}`);
  return data;
}

/** A login with the preview PIN for each number, made fresh; returns their ids by number. */
async function makeLogins(phones: string[]): Promise<Map<string, string>> {
  const emails = new Set(phones.map(loginEmail));
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const user of data.users) if (user.email && emails.has(user.email)) await db.auth.admin.deleteUser(user.id);
  const ids = new Map<string, string>();
  for (const phone of phones) {
    const { data: made, error } = await db.auth.admin.createUser({ email: loginEmail(phone), password: DEMO_PIN, email_confirm: true });
    if (error || !made.user) throw new Error(`login for ${phone}: ${error?.message}`);
    ids.set(phone, made.user.id);
  }
  return ids;
}

async function main() {
  const d = createSeed(new Date());
  const p = parish.id;
  const withParish = <T extends object>(items: T[]) => items.map((item) => ({ ...toRow(item), parish_id: p }));

  await check('clear parish', db.from('parishes').delete().eq('id', p));
  await check('parish', db.from('parishes').insert({ id: p, name: parish.name.en, time_zone: parish.timeZone, family_code_prefix: familyCodePrefix() }));
  await check('timetable', db.from('services').insert(withParish(d.services)));
  await check('announcements', db.from('announcements').insert(withParish(d.announcements)));
  await check('events', db.from('events').insert(withParish(d.events)));

  await check(
    'groups',
    db.from('groups').insert(
      d.groups.map(({ officers: _officers, term, ...g }) => ({ ...toRow(g), parish_id: p, term_from: term?.from ?? null, term_to: term?.to ?? null })),
    ),
  );
  await check(
    'families',
    db.from('families').insert(
      d.families.map(({ removal, ...f }) => ({
        ...toRow(f),
        parish_id: p,
        removal_reason: removal?.reason ?? null,
        removal_note: removal?.note ?? null,
        removed_on: removal?.on ?? null,
      })),
    ),
  );

  // Everyone in the samples with a phone signs in with the preview PIN; their membership is linked to that login.
  const phones = d.members.filter((m) => m.phone).map((m) => m.phone!);
  const logins = await makeLogins([...phones, OFFICE_DEMO_PHONES.priest, OFFICE_DEMO_PHONES.staff]);
  await check(
    'family members',
    db.from('family_members').insert(d.members.map((m) => ({ ...memberRow(m), parish_id: p, user_id: m.phone ? logins.get(m.phone) : null }))),
  );
  await check(
    'office-bearers',
    db.from('officers').insert(
      d.groups.flatMap((g, groupIndex) =>
        g.officers.map((o, index) => ({
          ...toRow({ seat: undefined, representsId: undefined, memberId: undefined, phone: undefined, ...o }),
          pending: o.pending ?? false,
          parish_id: p,
          group_id: g.id,
          // Keeps the samples' order: officers list in the order they were added.
          created_at: new Date(Date.UTC(2026, 0, 1, 0, groupIndex, index)).toISOString(),
        })),
      ),
    ),
  );
  await check('messages', db.from('group_messages').insert(withParish(d.messages)));
  await check('intentions', db.from('intentions').insert(withParish(d.intentions)));
  await check('certificate requests', db.from('certificate_requests').insert(withParish(d.certificates)));
  await check('monthly offerings', db.from('subscriptions').insert(withParish(d.subscriptions)));
  await check('rosters', db.from('roster_entries').insert(withParish(d.roster)));
  await check(
    'office team',
    db.from('office_users').insert(d.officeUsers.map((u) => ({ id: u.id, parish_id: p, name: u.name, phone: u.phone, role: u.role, user_id: logins.get(u.phone) }))),
  );

  console.log(`Loaded the samples for ${parish.name.en} into ${url}.`);
  console.log(`Office: ${OFFICE_DEMO_PHONES.priest} (parish priest) or ${OFFICE_DEMO_PHONES.staff} (staff). Phone app: +91 98430 20001. PIN ${DEMO_PIN}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
