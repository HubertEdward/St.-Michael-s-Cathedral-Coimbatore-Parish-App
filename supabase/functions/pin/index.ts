// Sets a PIN with a one-time code from the parish office: a forgotten PIN ("reset"), or the first sign-in of
// someone the parish priest added to the office team ("office"). Changing a login's password needs the
// service role, so this runs on the server and never in the apps.
//
// POST { parish, phone, code, pin } → { ok: true } | { error: 'resetCodeInvalid' }
// The app then signs in with the phone number and the new PIN.
//
// It calls Supabase's own REST endpoints with fetch and imports nothing, so it starts the same everywhere.

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const asService = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const reply = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Must match private.my_phone_key in the database and loginEmail in packages/core. */
const loginEmail = (phone: string) => `${phone.replace(/\D/g, '').slice(-10)}@phone.parish-app.in`;
const sixDigits = /^\d{6}$/;

async function rpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: asService, body: JSON.stringify(args) });
  if (!response.ok) throw new Error(`${fn}: ${response.status}`);
  return response.json();
}

async function auth(method: string, path: string, body: object): Promise<Record<string, unknown>> {
  const response = await fetch(`${url}/auth/v1/admin/${path}`, { method, headers: asService, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`auth ${path}: ${response.status}`);
  return response.json();
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { parish, phone, code, pin } = await request.json().catch(() => ({}));
  const invalid = () => reply({ error: 'resetCodeInvalid' }, 400);
  if (typeof parish !== 'string' || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) return invalid();
  if (!sixDigits.test(String(code)) || !sixDigits.test(String(pin))) return invalid();

  try {
    if ((await rpc('check_pin_code', { p_parish: parish, p_phone: phone, p_code: code })) !== true) return invalid();
    let userId = (await rpc('user_id_for_phone', { p_phone: phone })) as string | null;
    if (userId) await auth('PUT', `users/${userId}`, { password: pin });
    else userId = (await auth('POST', 'users', { email: loginEmail(phone), password: pin, email_confirm: true })).id as string;
    const purpose = await rpc('redeem_pin_code', { p_parish: parish, p_phone: phone, p_code: code, p_user: userId });
    return purpose ? reply({ ok: true }) : invalid();
  } catch (error) {
    console.error(error);
    return reply({ error: 'resetFailed' }, 500);
  }
});
