// Checks who may do what in the database, signing in as the sample people. Run against the local backend
// with the samples loaded: npm run backend:samples && npm run backend:test
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { before, describe, test } from 'node:test';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' })) as Record<string, string>;
const parish = 'st-michaels-coimbatore';
const PIN = '246810';
const email = (phone: string) => `${phone}@phone.parish-app.in`;

const client = () => createClient(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function as(phone: string): Promise<SupabaseClient> {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email: email(phone), password: PIN });
  if (error) throw new Error(`${phone}: ${error.message}`);
  return c;
}

/** Deletes a test login, and its family membership or office post, left from an earlier run. */
async function forget(phone: string) {
  const id = (await admin.rpc('user_id_for_phone', { p_phone: phone })).data as string | null;
  await admin.from('family_members').delete().like('phone', `%${phone.slice(-5)}`);
  await admin.from('office_users').delete().like('phone', `%${phone.slice(-5)}`);
  if (id) await admin.auth.admin.deleteUser(id);
}

/** The error a call raised, or undefined. */
const raised = async (call: PromiseLike<{ error: { message: string } | null }>) => (await call).error?.message;

let joseph: SupabaseClient; // head of St. Antony's Anbiyam, coordinator of the prayer group
let xavier: SupabaseClient; // head of another family, in another Anbiyam
let priest: SupabaseClient;
let staff: SupabaseClient;
let anonymous: SupabaseClient;

before(async () => {
  await Promise.all(['9843099001', '9843099003'].map(forget));
  [joseph, xavier, priest, staff] = await Promise.all(['9843020001', '9843020003', '9843030001', '9843030002'].map(as));
  anonymous = client();
  await anonymous.auth.signInAnonymously();
});

describe('reading', () => {
  test('anyone reads the timetable and groups, but not families or requests', async () => {
    const visitor = client();
    assert.ok(((await visitor.from('services').select('id').eq('parish_id', parish)).data ?? []).length > 0);
    assert.ok(((await visitor.from('groups').select('id').eq('parish_id', parish)).data ?? []).length > 0);
    assert.equal(((await visitor.from('families').select('id')).data ?? []).length, 0);
    assert.equal(((await anonymous.from('intentions').select('id')).data ?? []).length, 0);
    assert.equal(((await joseph.from('family_members').select('id')).data ?? []).length, 0);
  });

  test('pending requests to join a group are hidden from the public', async () => {
    const visible = (await client().from('officers').select('id, pending').eq('group_id', 'prayer-group')).data ?? [];
    assert.ok(visible.every((o) => !o.pending));
  });

  test('a parishioner sees their own family, an office user sees all', async () => {
    const mine = (await joseph.rpc('get_my_family', { p_parish: parish })).data;
    assert.equal(mine.family.code, 'SMC-0101');
    assert.ok(mine.family.members.length >= 3);
    assert.equal(mine.anbiyam.id, 'anb-1');
    const all = (await staff.rpc('list_families', { p_parish: parish })).data;
    assert.ok(all.length >= 6);
    assert.equal(await raised(joseph.rpc('list_families', { p_parish: parish })), 'notOffice');
  });

  test('someone waiting to join a family sees only their own request', async () => {
    const c = client();
    await c.auth.signUp({ email: email('9843099001'), password: '583920' });
    await c.rpc('request_to_join_family', { p_parish: parish, p_code: 'smc-0102', p_member: { name: 'Test Joiner', relationship: 'son' } });
    const mine = (await c.rpc('get_my_family', { p_parish: parish })).data;
    assert.equal(mine.family.address, '');
    assert.equal(mine.family.members.length, 1);
    assert.equal(mine.family.name, 'Xavier Raj');
    await forget('9843099001');
  });
});

describe('messages', () => {
  test('a leader sends to their group; a member of another Anbiyam cannot see it', async () => {
    const sent = await joseph.rpc('send_group_message', { p_group: 'anb-1', p_title: 'Test news', p_body: 'Test body' });
    assert.equal(sent.error, null);
    assert.equal(sent.data.sender_role, 'head');
    const josephs = (await joseph.rpc('get_my_messages', { p_parish: parish })).data;
    assert.ok(josephs.messages.some((m: { id: string }) => m.id === sent.data.id));
    const xaviers = (await xavier.rpc('get_my_messages', { p_parish: parish })).data;
    assert.ok(!xaviers.messages.some((m: { id: string }) => m.id === sent.data.id));
    assert.equal(await raised(xavier.rpc('send_group_message', { p_group: 'anb-1', p_title: null, p_body: 'Not mine' })), 'notGroupLeader');
    await admin.from('group_messages').delete().eq('id', sent.data.id);
  });

  test('only the office sends as the office', async () => {
    const row = { parish_id: parish, group_id: 'anb-1', body: 'x', sender: 'Parish office', sender_role: 'office' };
    assert.ok(await raised(joseph.from('group_messages').insert(row)));
    const { data, error } = await staff.from('group_messages').insert(row).select().single();
    assert.equal(error, null);
    await admin.from('group_messages').delete().eq('id', data.id);
  });
});

describe('office powers', () => {
  test('only the parish priest removes a family or changes the office team', async () => {
    assert.equal(await raised(staff.rpc('remove_family', { p_family: 'fam-3', p_reason: 'movedAway', p_note: null })), 'notPriest');
    assert.equal(await raised(staff.rpc('add_office_user', { p_parish: parish, p_name: 'X', p_phone: '9843099002', p_role: 'staff' })), 'notPriest');
    assert.equal(await raised(joseph.rpc('remove_family', { p_family: 'fam-3', p_reason: 'movedAway', p_note: null })), 'notPriest');
  });

  test('parishioners cannot edit the timetable; the office can', async () => {
    const row = { parish_id: parish, kind: 'mass', day: 3, time: '12:00' };
    assert.ok(await raised(joseph.from('services').insert(row)));
    const { data, error } = await staff.from('services').insert(row).select().single();
    assert.equal(error, null);
    await staff.from('services').delete().eq('id', data.id);
  });

  test('a family that leaves an Anbiyam gives up its posts there', async () => {
    await staff.rpc('set_family_anbiyam', { p_family: 'fam-2', p_anbiyam: null });
    const posts = (await admin.from('officers').select('id').eq('group_id', 'anb-2').eq('member_id', 'm-4')).data ?? [];
    assert.equal(posts.length, 0);
    await staff.rpc('set_family_anbiyam', { p_family: 'fam-2', p_anbiyam: 'anb-2' });
    await admin.from('officers').insert({ id: 'o-13', parish_id: parish, group_id: 'anb-2', role: 'head', name: 'Xavier Raj', member_id: 'm-4', phone: '+91 98430 20003' });
  });

  test('an Anbiyam with families cannot be deleted', async () => {
    assert.equal(await raised(staff.from('groups').delete().eq('id', 'anb-1')), 'anbiyamHasFamilies');
  });
});

describe('requests', () => {
  test('an anonymous visitor sends an intention and sees only their own', async () => {
    const sunday = new Date();
    sunday.setUTCDate(sunday.getUTCDate() + ((7 - sunday.getUTCDay()) % 7 || 7));
    const services = (await anonymous.from('services').select('id').eq('parish_id', parish).eq('day', 0).eq('kind', 'mass')).data ?? [];
    const sent = await anonymous.rpc('submit_intention', {
      p_parish: parish,
      p_intention: {
        type: 'thanksgiving',
        names: 'Test family',
        mass_date: sunday.toISOString().slice(0, 10),
        service_id: services[services.length - 1].id,
        requester_name: 'Test',
        phone: '+91 98430 99999',
      },
    });
    assert.equal(sent.error, null);
    const mine = (await anonymous.from('intentions').select('id')).data ?? [];
    assert.deepEqual(mine.map((i) => i.id), [sent.data.id]);
    await admin.from('intentions').delete().eq('id', sent.data.id);
  });

  test('an intention for a Mass not held that day is refused', async () => {
    const services = (await anonymous.from('services').select('id').eq('parish_id', parish).eq('day', 0)).data ?? [];
    const monday = new Date();
    monday.setUTCDate(monday.getUTCDate() + ((8 - monday.getUTCDay()) % 7 || 7));
    const error = await raised(
      anonymous.rpc('submit_intention', {
        p_parish: parish,
        p_intention: { type: 'healing', names: 'X', mass_date: monday.toISOString().slice(0, 10), service_id: services[0].id, requester_name: 'X', phone: '9843099999' },
      }),
    );
    assert.equal(error, 'massNotOnDate');
  });
});

describe('PIN codes', () => {
  test('a reset code sets a new PIN once; wrong guesses use it up', async () => {
    const issued = (await staff.rpc('issue_pin_reset', { p_parish: parish, p_phone: '+91 98430 20004' })).data as { code: string };
    const call = (code: string, pin: string) => client().functions.invoke('pin', { body: { parish, phone: '9843020004', code, pin } });
    assert.ok((await call('000000', '593017')).error);
    assert.equal((await call(issued.code, '593017')).error, null);
    assert.equal((await client().auth.signInWithPassword({ email: email('9843020004'), password: '593017' })).error, null);
    assert.ok((await call(issued.code, '482915')).error, 'a code works only once');
    await admin.auth.admin.updateUserById((await admin.rpc('user_id_for_phone', { p_phone: '9843020004' })).data, { password: PIN });

    const next = (await staff.rpc('issue_pin_reset', { p_parish: parish, p_phone: '9843020004' })).data as { code: string };
    for (let i = 0; i < 5; i++) await call(next.code === '111111' ? '222222' : '111111', '593017');
    assert.ok((await call(next.code, '593017')).error, 'five wrong tries use the code up');
  });

  test('a setup code from the parish priest lets a new team member into the office app', async () => {
    const added = (await priest.rpc('add_office_user', { p_parish: parish, p_name: 'Test Staff', p_phone: '9843099003', p_role: 'staff' })).data;
    const setUp = await client().functions.invoke('pin', { body: { parish, phone: '9843099003', code: added.code, pin: '583920' } });
    assert.equal(setUp.error, null);
    const c = client();
    await c.auth.signInWithPassword({ email: email('9843099003'), password: '583920' });
    assert.equal((await c.rpc('get_office_account', { p_parish: parish })).data.role, 'staff');
    await priest.rpc('remove_office_user', { p_office_user: added.id });
    assert.equal((await c.rpc('get_office_account', { p_parish: parish })).data, null);
    await forget('9843099003');
  });
});
