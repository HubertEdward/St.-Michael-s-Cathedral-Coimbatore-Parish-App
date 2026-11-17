-- The parish app's data: one database for every parish, each row tagged with its parish.
--
-- Who may do what:
--   anyone          reads the timetable, announcements, events, groups and their office-bearers, rosters
--   signed in       (an anonymous session is enough) sends intentions, certificate requests and monthly
--                   offerings, and sees their own
--   parishioners    (approved members of approved families) see their family, their Anbiyam's and groups'
--                   messages; office-bearers send to their group and answer requests to join
--   office staff    run the parish office app
--   parish priest   also removes families from the parish and manages the office team
--
-- People sign in with their phone number and a PIN they choose; no SMS is sent. The PIN is the password of
-- an email-style login made from the number (see private.my_phone_key). The parish office's approval of each
-- family and member is what confirms who someone is.
--
-- Errors raised for the apps to translate are plain codes, e.g. 'notInParish'.

create extension if not exists pgcrypto with schema extensions;

create schema private;
grant usage on schema private to anon, authenticated, service_role;

-- Parishes ---------------------------------------------------------------------------------------------

create table public.parishes (
  id text primary key,
  name text not null,
  time_zone text not null default 'Asia/Kolkata',
  family_code_prefix text not null,
  intention_cutoff_minutes integer not null default 60 check (intention_cutoff_minutes between 0 and 10080),
  created_at timestamptz not null default now()
);

-- Groups (councils, Anbiyams, ministries, associations, faith formation) come early: families point at Anbiyams.

create table public.groups (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  kind text not null check (kind in ('council', 'anbiyam', 'liturgical', 'association', 'formation')),
  name jsonb not null,
  description jsonb not null default '{"en": ""}',
  area jsonb,
  meets jsonb,
  term_from date,
  term_to date,
  created_at timestamptz not null default now()
);
create index on public.groups (parish_id);

-- Timetable and news -------------------------------------------------------------------------------------

create table public.services (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  kind text not null check (kind in ('mass', 'confession', 'adoration', 'novena')),
  day smallint not null check (day between 0 and 6),
  time text not null check (time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  language text check (language in ('ta', 'en', 'ml')),
  place jsonb,
  note jsonb
);
create index on public.services (parish_id);

create table public.announcements (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  title jsonb not null,
  body jsonb not null,
  published_at timestamptz not null default now(),
  pinned boolean not null default false
);
create index on public.announcements (parish_id);

create table public.events (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  title jsonb not null,
  description jsonb not null,
  starts_at timestamptz not null,
  place jsonb
);
create index on public.events (parish_id);

-- Requests ------------------------------------------------------------------------------------------------

create table public.intentions (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  requester_id uuid default auth.uid() references auth.users on delete set null,
  type text not null check (type in ('thanksgiving', 'departed', 'healing', 'birthday', 'anniversary', 'special')),
  names text not null check (length(names) between 1 and 300),
  mass_date date not null,
  -- The Mass as the timetable had it; kept even if the timetable later changes.
  service_id text not null,
  requester_name text not null check (length(requester_name) between 1 and 100),
  phone text not null check (length(phone) <= 20),
  note text check (length(note) <= 500),
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'declined', 'completed')),
  created_at timestamptz not null default now()
);
create index on public.intentions (parish_id, created_at desc);
create index on public.intentions (requester_id);

create table public.certificate_requests (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  requester_id uuid default auth.uid() references auth.users on delete set null,
  kind text not null check (kind in ('baptism', 'first-communion', 'confirmation', 'marriage')),
  person_name text not null check (length(person_name) between 1 and 100),
  sacrament_date date,
  father_name text check (length(father_name) <= 500),
  mother_name text check (length(mother_name) <= 500),
  purpose text not null check (length(purpose) between 1 and 200),
  requester_name text not null check (length(requester_name) between 1 and 100),
  phone text not null check (length(phone) <= 20),
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'declined', 'completed')),
  office_note text check (length(office_note) <= 500),
  created_at timestamptz not null default now()
);
create index on public.certificate_requests (parish_id, created_at desc);
create index on public.certificate_requests (requester_id);

create table public.subscriptions (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  requester_id uuid default auth.uid() references auth.users on delete set null,
  name text not null check (length(name) between 1 and 100),
  phone text not null check (length(phone) <= 20),
  amount integer not null check (amount between 50 and 100000),
  purpose text not null check (purpose in ('parish', 'restoration', 'charity')),
  debit_day smallint not null check (debit_day between 1 and 28),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  starts_on date not null,
  created_at timestamptz not null default now()
);
create index on public.subscriptions (parish_id, created_at desc);
create index on public.subscriptions (requester_id);

create table public.roster_entries (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  ministry_id text not null references public.groups on delete cascade,
  date date not null,
  service_id text not null,
  member_name text not null check (length(member_name) between 1 and 100)
);
create index on public.roster_entries (parish_id, date);

-- Families ------------------------------------------------------------------------------------------------

create table public.families (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  code text not null,
  address text not null check (length(address) between 1 and 300),
  anbiyam_id text references public.groups,
  preferred_anbiyam_id text references public.groups on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'removed')),
  removal_reason text check (removal_reason in ('movedAway', 'otherParish', 'other')),
  removal_note text check (length(removal_note) <= 500),
  removed_on date,
  created_at timestamptz not null default now(),
  unique (parish_id, code)
);

create table public.family_members (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  family_id text not null references public.families on delete cascade,
  -- The login of a member who asked for themself (registered the family or asked to join it); members added
  -- by others, such as children, have none. App powers (office-bearer posts) follow this, never the phone number.
  user_id uuid references auth.users on delete set null,
  name text not null check (length(name) between 1 and 100),
  relationship text not null check (relationship in ('head', 'spouse', 'son', 'daughter', 'father', 'mother', 'sibling', 'other')),
  phone text check (length(phone) <= 20),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  added_by text,
  birth_date date,
  education text check (education in ('none', 'belowSslc', 'sslc', 'hsc', 'diploma', 'graduate', 'postgraduate', 'doctorate')),
  qualification text check (length(qualification) <= 100),
  occupation text check (occupation in ('studying', 'working', 'lookingForWork', 'homemaker', 'retired', 'other')),
  study_class text check (study_class in ('preschool', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'college')),
  course text check (length(course) <= 100),
  work_sector text check (work_sector in ('government', 'private', 'selfEmployed', 'agriculture', 'dailyWage', 'church', 'other')),
  job text check (length(job) <= 100),
  yearly_income text check (yearly_income in ('upTo1L', '1to3L', '3to6L', '6to10L', '10to20L', 'over20L', 'notSaying')),
  baptism_date date,
  first_communion_date date,
  confirmation_date date,
  marriage_date date,
  created_at timestamptz not null default now()
);
create index on public.family_members (family_id);
create index on public.family_members (user_id);

-- Office-bearers and members of groups -------------------------------------------------------------------

create table public.officers (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  group_id text not null references public.groups on delete cascade,
  role text not null check (role in ('president', 'vicePresident', 'head', 'director', 'coordinator', 'secretary', 'jointSecretary', 'treasurer', 'member')),
  name text not null check (length(name) between 1 and 100),
  phone text check (length(phone) <= 20),
  member_id text references public.family_members on delete cascade,
  seat text check (seat in ('exOfficio', 'anbiyam', 'elected', 'nominated')),
  represents_id text references public.groups on delete set null,
  -- Asked in the app to join; waiting for an office-bearer or the office.
  pending boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.officers (group_id);
create index on public.officers (member_id);

create table public.group_messages (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  group_id text not null references public.groups on delete cascade,
  -- Set for a news article; a plain message has none.
  title text check (length(title) <= 150),
  body text not null check (length(body) between 1 and 4000),
  sender text not null,
  sender_role text not null check (sender_role in ('president', 'vicePresident', 'head', 'director', 'coordinator', 'secretary', 'jointSecretary', 'treasurer', 'member', 'office')),
  sender_id uuid default auth.uid() references auth.users on delete set null,
  sent_at timestamptz not null default now()
);
create index on public.group_messages (group_id, sent_at desc);

-- When each member last opened their messages; newer messages count as unread.
create table public.message_reads (
  member_id text primary key references public.family_members on delete cascade,
  last_read timestamptz not null
);

-- The office team and one-time codes ----------------------------------------------------------------------

create table public.office_users (
  id text primary key default gen_random_uuid()::text,
  parish_id text not null references public.parishes on delete cascade,
  name text not null check (length(name) between 1 and 100),
  phone text not null check (length(phone) <= 20),
  role text not null check (role in ('priest', 'staff')),
  -- Set when they first sign in with the setup code the parish priest gave them.
  user_id uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create unique index office_users_phone on public.office_users (parish_id, (right(regexp_replace(phone, '\D', '', 'g'), 10)));

-- A 6-digit code, valid for a day: from the office to set a forgotten PIN ('reset'), or from the parish priest
-- to a new member of the office team ('office'). Only server functions read it.
create table public.pin_codes (
  parish_id text not null references public.parishes on delete cascade,
  phone_key text not null,
  purpose text not null check (purpose in ('reset', 'office')),
  code text not null,
  expires_at timestamptz not null,
  -- Wrong tries; the code is used up after five, so it cannot be guessed.
  failed_attempts smallint not null default 0,
  primary key (parish_id, phone_key, purpose)
);

-- Helpers for the rules -----------------------------------------------------------------------------------

/** The last ten digits, so "+91 98430 20001" and "9843020001" match. */
create function private.phone_key(p text) returns text
language sql immutable set search_path = '' as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10)
$$;

/** The signed-in person's number: logins are made as <ten digits>@phone.parish-app.in. Null for anonymous sessions. */
create function private.my_phone_key() returns text
language sql stable set search_path = '' as $$
  select case when auth.jwt() ->> 'email' like '%@phone.parish-app.in' then split_part(auth.jwt() ->> 'email', '@', 1) end
$$;

/** "+91 98430 20001" from the signed-in person's number. */
create function private.my_phone() returns text
language sql stable set search_path = '' as $$
  select case when private.my_phone_key() is not null
    then '+91 ' || substr(private.my_phone_key(), 1, 5) || ' ' || substr(private.my_phone_key(), 6, 5) end
$$;

create function private.office_role(p_parish text) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.office_users where parish_id = p_parish and user_id = auth.uid() and auth.uid() is not null
$$;

create function private.is_office(p_parish text) returns boolean
language sql stable set search_path = '' as $$
  select private.office_role(p_parish) is not null
$$;

create function private.require_office(p_parish text) returns void
language plpgsql stable set search_path = '' as $$
begin
  if not private.is_office(p_parish) then raise exception 'notOffice'; end if;
end $$;

create function private.require_priest(p_parish text) returns void
language plpgsql stable set search_path = '' as $$
begin
  if private.office_role(p_parish) is distinct from 'priest' then raise exception 'notPriest'; end if;
end $$;

/** The signed-in person's own membership of a family in the parish (not a declined one), newest first. */
create function private.my_member(p_parish text) returns public.family_members
language sql stable security definer set search_path = '' as $$
  select * from public.family_members
  where parish_id = p_parish and user_id = auth.uid() and auth.uid() is not null and status <> 'declined'
  order by created_at desc limit 1
$$;

/** The signed-in person's membership, if they are an approved member of a family that belongs to the parish. */
create function private.my_parishioner(p_parish text) returns public.family_members
language sql stable security definer set search_path = '' as $$
  select m.* from public.family_members m join public.families f on f.id = m.family_id
  where m.parish_id = p_parish and m.user_id = auth.uid() and auth.uid() is not null
    and m.status = 'approved' and f.status = 'approved'
  limit 1
$$;

/** The members who receive a group's messages: an Anbiyam's families, or a group's listed people. */
create function private.recipients(p_group text) returns setof text
language sql stable security definer set search_path = '' as $$
  select m.id from public.groups g
    join public.families f on f.anbiyam_id = g.id and f.status = 'approved'
    join public.family_members m on m.family_id = f.id and m.status = 'approved'
  where g.id = p_group and g.kind = 'anbiyam'
  union
  select o.member_id from public.groups g join public.officers o on o.group_id = g.id
  where g.id = p_group and g.kind <> 'anbiyam' and o.member_id is not null and not o.pending
$$;

/** The post (not plain membership) the signed-in parishioner holds in a group, if any. */
create function private.my_post(p_group text) returns public.officers
language sql stable security definer set search_path = '' as $$
  select o.* from public.officers o join public.groups g on g.id = o.group_id
  where o.group_id = p_group and o.role <> 'member' and not o.pending
    and o.member_id = (private.my_parishioner(g.parish_id)).id
  limit 1
$$;

/** A group row with its office-bearers and members, as the apps show it. */
create function private.group_json(g public.groups) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(g) || jsonb_build_object('officers', coalesce(
    (select jsonb_agg(to_jsonb(o) order by o.created_at) from public.officers o where o.group_id = g.id), '[]'::jsonb))
$$;

-- An Anbiyam with families cannot be deleted; they must be moved first.
create function private.keep_anbiyam_with_families() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.families where anbiyam_id = old.id) then raise exception 'anbiyamHasFamilies'; end if;
  return old;
end $$;
create trigger keep_anbiyam_with_families before delete on public.groups
  for each row execute function private.keep_anbiyam_with_families();

-- Row-level security ---------------------------------------------------------------------------------------

alter table public.parishes enable row level security;
alter table public.groups enable row level security;
alter table public.services enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.intentions enable row level security;
alter table public.certificate_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.roster_entries enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.officers enable row level security;
alter table public.group_messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.office_users enable row level security;
alter table public.pin_codes enable row level security;

-- Public reading.
create policy "Anyone reads parishes" on public.parishes for select using (true);
create policy "Office changes its parish's settings" on public.parishes for update using (private.is_office(id)) with check (private.is_office(id));
create policy "Anyone reads groups" on public.groups for select using (true);
create policy "Anyone reads the timetable" on public.services for select using (true);
create policy "Anyone reads announcements" on public.announcements for select using (true);
create policy "Anyone reads events" on public.events for select using (true);
create policy "Anyone reads rosters" on public.roster_entries for select using (true);
create policy "Anyone reads office-bearers" on public.officers for select using (not pending or private.is_office(parish_id));

-- The office edits these directly.
create policy "Office edits groups" on public.groups for all using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Office edits the timetable" on public.services for all using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Office edits announcements" on public.announcements for all using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Office edits events" on public.events for all using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Office edits rosters" on public.roster_entries for all using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Office removes office-bearers" on public.officers for delete using (private.is_office(parish_id));

-- Requests: the person who sent them, and the office.
create policy "Own or office reads intentions" on public.intentions for select using (requester_id = auth.uid() or private.is_office(parish_id));
create policy "Office answers intentions" on public.intentions for update using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Own or office reads certificate requests" on public.certificate_requests for select using (requester_id = auth.uid() or private.is_office(parish_id));
create policy "Signed in sends certificate requests" on public.certificate_requests for insert
  with check (auth.uid() is not null and requester_id = auth.uid() and status = 'submitted' and office_note is null);
create policy "Office answers certificate requests" on public.certificate_requests for update using (private.is_office(parish_id)) with check (private.is_office(parish_id));
create policy "Own or office reads subscriptions" on public.subscriptions for select using (requester_id = auth.uid() or private.is_office(parish_id));
create policy "Signed in starts subscriptions" on public.subscriptions for insert
  with check (auth.uid() is not null and requester_id = auth.uid() and status = 'active');
create policy "Office changes subscriptions" on public.subscriptions for update using (private.is_office(parish_id)) with check (private.is_office(parish_id));

-- The register: the office reads it all and approves; parishioners use the functions below.
create policy "Office reads families" on public.families for select using (private.is_office(parish_id));
create policy "Office reads family members" on public.family_members for select using (private.is_office(parish_id));
create policy "Office approves family members" on public.family_members for update using (private.is_office(parish_id)) with check (private.is_office(parish_id));

-- Messages: the office reads and sends as the office; parishioners use the functions below.
create policy "Office reads group messages" on public.group_messages for select using (private.is_office(parish_id));
create policy "Office sends group messages" on public.group_messages for insert
  with check (private.is_office(parish_id) and sender_role = 'office');
create policy "Office deletes group messages" on public.group_messages for delete using (private.is_office(parish_id));

create policy "Office reads the office team" on public.office_users for select using (private.is_office(parish_id));
-- message_reads and pin_codes: no policies; only the functions below touch them.

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.parishes, public.groups, public.services, public.announcements, public.events,
  public.roster_entries, public.officers to anon;
grant all on all tables in schema public to service_role;

-- Functions for parishioners -------------------------------------------------------------------------------

/**
 * The signed-in person's family and their own membership, or null. Someone still waiting to join an
 * approved family sees only its name and their own request, not its members or address.
 */
create function public.get_my_family(p_parish text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  me public.family_members := private.my_member(p_parish);
  fam public.families;
  head_name text;
  anbiyam public.groups;
begin
  if me.id is null then return null; end if;
  select * into fam from public.families where id = me.family_id;
  select name into head_name from public.family_members where family_id = fam.id and relationship = 'head' limit 1;
  if fam.status = 'approved' and me.status <> 'approved' then
    return jsonb_build_object(
      'family', to_jsonb(fam) || jsonb_build_object('name', coalesce(head_name, ''), 'address', '', 'anbiyam_id', null, 'members', jsonb_build_array(to_jsonb(me))),
      'me', to_jsonb(me), 'anbiyam', null);
  end if;
  select * into anbiyam from public.groups where id = fam.anbiyam_id;
  return jsonb_build_object(
    'family', to_jsonb(fam) || jsonb_build_object('name', coalesce(head_name, ''), 'members', coalesce(
      (select jsonb_agg(to_jsonb(m) order by m.created_at) from public.family_members m where m.family_id = fam.id and m.status <> 'declined'), '[]'::jsonb)),
    'me', to_jsonb(me),
    'anbiyam', case when anbiyam.id is null then null else private.group_json(anbiyam) end);
end $$;

/** Fills a member row from the app's form (already tidied by the app); the server sets who, where and status. */
create function private.member_from(p_input jsonb, p_parish text, p_family text, p_status text, p_added_by text, p_user uuid, p_phone text)
returns public.family_members
language plpgsql set search_path = '' as $$
declare
  m public.family_members := jsonb_populate_record(null::public.family_members, p_input);
begin
  m.id := gen_random_uuid()::text;
  m.parish_id := p_parish;
  m.family_id := p_family;
  m.user_id := p_user;
  m.phone := p_phone;
  m.status := p_status;
  m.added_by := p_added_by;
  m.created_at := now();
  return m;
end $$;

create function private.require_no_family(p_parish text) returns void
language plpgsql stable set search_path = '' as $$
begin
  if private.my_phone_key() is null then raise exception 'notSignedIn'; end if;
  if (private.my_member(p_parish)).id is not null then raise exception 'alreadyInFamily'; end if;
end $$;

/** Registers a new family, with the signed-in person as its head and the members they list; the office approves it. */
create function public.register_family(p_parish text, p_head jsonb, p_address text, p_preferred_anbiyam text, p_members jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  fam public.families;
  head public.family_members;
  next_number integer;
  item jsonb;
  added public.family_members;
begin
  perform private.require_no_family(p_parish);
  select greatest(100, coalesce(max(nullif(substring(code from '-(\d+)$'), '')::integer), 0)) + 1 into next_number
    from public.families where parish_id = p_parish;
  insert into public.families (parish_id, code, address, preferred_anbiyam_id, status)
    values (p_parish, (select family_code_prefix from public.parishes where id = p_parish) || '-' || lpad(next_number::text, 4, '0'),
            p_address, nullif(p_preferred_anbiyam, ''), 'pending')
    returning * into fam;
  head := private.member_from(p_head, p_parish, fam.id, 'pending', null, auth.uid(), private.my_phone());
  head.relationship := 'head';
  insert into public.family_members select head.*;
  for item in select * from jsonb_array_elements(coalesce(p_members, '[]'::jsonb)) loop
    added := private.member_from(item, p_parish, fam.id, 'pending', head.name, null, null);
    if added.relationship = 'head' then added.relationship := 'other'; end if;
    insert into public.family_members select added.*;
  end loop;
  return to_jsonb(fam);
end $$;

/** Asks to join a registered family by its code; the office approves it. */
create function public.request_to_join_family(p_parish text, p_code text, p_member jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  fam public.families;
  request public.family_members;
begin
  perform private.require_no_family(p_parish);
  select * into fam from public.families where parish_id = p_parish and upper(code) = upper(trim(p_code)) and status = 'approved';
  if fam.id is null then raise exception 'familyNotFound'; end if;
  request := private.member_from(p_member, p_parish, fam.id, 'pending', null, auth.uid(), private.my_phone());
  insert into public.family_members select request.*;
  return to_jsonb(request);
end $$;

/** Approved members look after their family's entries; so does the head of a family still waiting to be approved. */
create function private.keeps_family(me public.family_members) returns boolean
language sql immutable set search_path = '' as $$
  select me.status = 'approved' or me.relationship = 'head'
$$;

/** A member adds people to the family, such as children or elders without their own phone; the office approves them. */
create function public.add_family_members(p_parish text, p_members jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.family_members := private.my_member(p_parish);
  item jsonb;
  added public.family_members;
  result jsonb := '[]'::jsonb;
begin
  if me.id is null or not private.keeps_family(me) then raise exception 'notSignedIn'; end if;
  if jsonb_array_length(p_members) > 20 then raise exception 'tooMany'; end if;
  for item in select * from jsonb_array_elements(p_members) loop
    added := private.member_from(item, p_parish, me.family_id, 'pending', me.name, null, null);
    if added.relationship = 'head' then added.relationship := 'other'; end if;
    insert into public.family_members select added.*;
    result := result || to_jsonb(added);
  end loop;
  return result;
end $$;

/**
 * A member of the family corrects or completes someone's entry. The head stays the head, nobody else can be
 * made head, and what was approved stays approved.
 */
create function public.update_family_member(p_id text, p_member jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  target public.family_members;
  me public.family_members;
  edited public.family_members;
begin
  select * into target from public.family_members where id = p_id;
  me := private.my_member(target.parish_id);
  if target.id is null or me.id is null or target.family_id <> me.family_id or (target.id <> me.id and not private.keeps_family(me)) then
    raise exception 'notSignedIn';
  end if;
  edited := jsonb_populate_record(null::public.family_members, p_member);
  update public.family_members set
    name = edited.name,
    relationship = case when target.relationship = 'head' or edited.relationship = 'head' then target.relationship else edited.relationship end,
    birth_date = edited.birth_date, education = edited.education, qualification = edited.qualification,
    occupation = edited.occupation, study_class = edited.study_class, course = edited.course,
    work_sector = edited.work_sector, job = edited.job, yearly_income = edited.yearly_income,
    baptism_date = edited.baptism_date, first_communion_date = edited.first_communion_date,
    confirmation_date = edited.confirmation_date, marriage_date = edited.marriage_date
  where id = p_id
  returning * into target;
  return to_jsonb(target);
end $$;

/** A member of a family the parish priest removed asks for it to be taken back into the parish. */
create function public.ask_to_rejoin_parish(p_parish text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.family_members := private.my_member(p_parish);
begin
  update public.families set status = 'pending' where id = me.family_id and status = 'removed';
  if not found then raise exception 'notSignedIn'; end if;
end $$;

/** Sends a Mass intention, if that Mass is held on the date and still takes intentions. */
create function public.submit_intention(p_parish text, p_intention jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  i public.intentions := jsonb_populate_record(null::public.intentions, p_intention);
  s public.services;
  p public.parishes;
begin
  if auth.uid() is null then raise exception 'notSignedIn'; end if;
  select * into p from public.parishes where id = p_parish;
  select * into s from public.services where id = i.service_id and parish_id = p_parish;
  if s.id is null or extract(dow from i.mass_date) <> s.day then raise exception 'massNotOnDate'; end if;
  if i.mass_date > (now() at time zone p.time_zone)::date + 90 then raise exception 'massOutOfRange'; end if;
  if ((i.mass_date + s.time::time) at time zone p.time_zone) <= now() + make_interval(mins => p.intention_cutoff_minutes) then
    raise exception 'intentionClosed';
  end if;
  insert into public.intentions (parish_id, requester_id, type, names, mass_date, service_id, requester_name, phone, note)
    values (p_parish, auth.uid(), i.type, i.names, i.mass_date, i.service_id, i.requester_name, i.phone, nullif(i.note, ''))
    returning * into i;
  return to_jsonb(i);
end $$;

/** The person who set up a monthly offering pauses, resumes or cancels it, or changes the amount. */
create function public.change_my_subscription(p_id text, p_status text, p_amount integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.subscriptions set status = coalesce(p_status, status), amount = coalesce(p_amount, amount)
  where id = p_id and requester_id = auth.uid() and auth.uid() is not null;
  if not found then raise exception 'notSignedIn'; end if;
end $$;

/** Messages from every group the signed-in person belongs to, newest first, and how many are new. Null when not in the parish. */
create function public.get_my_messages(p_parish text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  me public.family_members := private.my_parishioner(p_parish);
  read_at timestamptz;
  list jsonb;
begin
  if me.id is null then return null; end if;
  select last_read into read_at from public.message_reads where member_id = me.id;
  select coalesce(jsonb_agg(to_jsonb(gm) order by gm.sent_at desc), '[]'::jsonb) into list
    from public.group_messages gm
    where gm.parish_id = p_parish and me.id in (select private.recipients(gm.group_id));
  return jsonb_build_object(
    'messages', list,
    'unread', (select count(*) from jsonb_array_elements(list) m where read_at is null or (m ->> 'sent_at')::timestamptz > read_at),
    'last_read', read_at);
end $$;

create function public.mark_messages_read(p_parish text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.family_members := private.my_parishioner(p_parish);
begin
  if me.id is null then return; end if;
  insert into public.message_reads (member_id, last_read) values (me.id, now())
    on conflict (member_id) do update set last_read = excluded.last_read;
end $$;

/**
 * What the signed-in person can do in a group: read its messages (members), send and answer requests to
 * join (office-bearers), or ask to join (anyone in the parish, for ministries, associations and formation).
 */
create function public.get_group_access(p_group text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  g public.groups;
  me public.family_members;
  post public.officers;
  member boolean;
begin
  select * into g from public.groups where id = p_group;
  if g.id is null then return null; end if;
  me := private.my_parishioner(g.parish_id);
  if me.id is null then return null; end if;
  member := me.id in (select private.recipients(g.id));
  post := private.my_post(g.id);
  return jsonb_build_object(
    'member', member,
    'post', post.role,
    'pending', exists (select 1 from public.officers where group_id = g.id and member_id = me.id and pending),
    'can_join', not member and g.kind in ('liturgical', 'association', 'formation'),
    'recipients', (select count(*) from private.recipients(g.id)),
    'messages', case when member or post.id is not null then coalesce(
      (select jsonb_agg(to_jsonb(gm) order by gm.sent_at desc) from public.group_messages gm where gm.group_id = g.id), '[]'::jsonb)
      else '[]'::jsonb end,
    'requests', case when post.id is not null then coalesce(
      (select jsonb_agg(to_jsonb(o) order by o.created_at) from public.officers o where o.group_id = g.id and o.pending), '[]'::jsonb)
      else '[]'::jsonb end);
end $$;

/** An office-bearer sends a message, or a news article (with a title), to everyone in their group. */
create function public.send_group_message(p_group text, p_title text, p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  post public.officers := private.my_post(p_group);
  message public.group_messages;
begin
  if post.id is null then raise exception 'notGroupLeader'; end if;
  insert into public.group_messages (parish_id, group_id, title, body, sender, sender_role)
    values (post.parish_id, p_group, nullif(trim(p_title), ''), trim(p_body), post.name, post.role)
    returning * into message;
  return to_jsonb(message);
end $$;

/** Asks to join a ministry, association or faith formation group; its office-bearers approve. */
create function public.ask_to_join_group(p_group text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
  me public.family_members;
begin
  select * into g from public.groups where id = p_group;
  me := private.my_parishioner(g.parish_id);
  if g.id is null or me.id is null then raise exception 'notInParish'; end if;
  if g.kind not in ('liturgical', 'association', 'formation') or exists (select 1 from public.officers where group_id = g.id and member_id = me.id) then
    raise exception 'cannotJoin';
  end if;
  insert into public.officers (parish_id, group_id, role, name, phone, member_id, pending)
    values (g.parish_id, g.id, 'member', me.name, me.phone, me.id, true);
end $$;

/** An office-bearer, or the office, approves or declines a request to join. */
create function public.answer_join_request(p_group text, p_officer text, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
begin
  select * into g from public.groups where id = p_group;
  if g.id is null or ((private.my_post(g.id)).id is null and not private.is_office(g.parish_id)) then raise exception 'notGroupLeader'; end if;
  if p_approve then
    update public.officers set pending = false where id = p_officer and group_id = g.id and pending;
  else
    delete from public.officers where id = p_officer and group_id = g.id and pending;
  end if;
end $$;

-- Functions for the parish office --------------------------------------------------------------------------

/** Every family with its members (not declined ones) and its head's name, newest registration first. */
create function public.list_families(p_parish text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_office(p_parish);
  return coalesce((
    select jsonb_agg(to_jsonb(f) || jsonb_build_object(
      'name', coalesce((select name from public.family_members where family_id = f.id and relationship = 'head' limit 1), ''),
      'members', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at) from public.family_members m where m.family_id = f.id and m.status <> 'declined'), '[]'::jsonb))
      order by f.created_at desc)
    from public.families f where f.parish_id = p_parish), '[]'::jsonb);
end $$;

/** Approving or declining a family does the same for everyone waiting in it. */
create function public.set_family_status(p_family text, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  fam public.families;
begin
  select * into fam from public.families where id = p_family;
  perform private.require_office(fam.parish_id);
  update public.families set status = p_status,
    removal_reason = case when p_status = 'approved' then null else removal_reason end,
    removal_note = case when p_status = 'approved' then null else removal_note end,
    removed_on = case when p_status = 'approved' then null else removed_on end
  where id = p_family;
  update public.family_members set status = p_status where family_id = p_family and status = 'pending';
end $$;

/**
 * Places a family in its Anbiyam, moves it to another, or (with null) takes it out. Its members give up
 * any post they held in the Anbiyam it leaves.
 */
create function public.set_family_anbiyam(p_family text, p_anbiyam text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  fam public.families;
begin
  select * into fam from public.families where id = p_family;
  perform private.require_office(fam.parish_id);
  if fam.anbiyam_id is not distinct from p_anbiyam then return; end if;
  if fam.anbiyam_id is not null then
    delete from public.officers where group_id = fam.anbiyam_id
      and member_id in (select id from public.family_members where family_id = p_family);
  end if;
  update public.families set anbiyam_id = p_anbiyam where id = p_family;
end $$;

/** The parish priest removes a family that has left the parish. It keeps its record and code; its members leave their posts. */
create function public.remove_family(p_family text, p_reason text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  fam public.families;
begin
  select * into fam from public.families where id = p_family;
  perform private.require_priest(fam.parish_id);
  update public.families set status = 'removed', removal_reason = p_reason, removal_note = nullif(trim(p_note), ''),
    removed_on = (now() at time zone (select time_zone from public.parishes where id = fam.parish_id))::date, anbiyam_id = null
  where id = p_family;
  delete from public.officers where member_id in (select id from public.family_members where family_id = p_family);
end $$;

/** Gives someone a post in a group. Every post but "member" has one holder, who is replaced. */
create function public.add_officer(p_group text, p_officer jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
  o public.officers := jsonb_populate_record(null::public.officers, p_officer);
begin
  select * into g from public.groups where id = p_group;
  perform private.require_office(g.parish_id);
  if o.role <> 'member' then delete from public.officers where group_id = g.id and role = o.role; end if;
  insert into public.officers (parish_id, group_id, role, name, phone, member_id, seat, represents_id)
    values (g.parish_id, g.id, o.role, o.name, nullif(o.phone, ''), nullif(o.member_id, ''),
            case when g.kind = 'council' then o.seat end,
            case when g.kind = 'council' and o.seat = 'anbiyam' then nullif(o.represents_id, '') end)
    returning * into o;
  return to_jsonb(o);
end $$;

create function private.new_code(p_parish text, p_phone text, p_purpose text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  code text := lpad((floor(random() * 1000000))::integer::text, 6, '0');
  expires timestamptz := now() + interval '24 hours';
begin
  insert into public.pin_codes (parish_id, phone_key, purpose, code, expires_at)
    values (p_parish, private.phone_key(p_phone), p_purpose, code, expires)
    on conflict (parish_id, phone_key, purpose) do update set code = excluded.code, expires_at = excluded.expires_at, failed_attempts = 0;
  return jsonb_build_object('code', code, 'expires_at', expires);
end $$;

/** For the office: a 6-digit code, valid for a day, that lets this number choose a new PIN. */
create function public.issue_pin_reset(p_parish text, p_phone text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_office(p_parish);
  return private.new_code(p_parish, p_phone, 'reset');
end $$;

/** The office team, and whether each has signed in yet. */
create function public.list_office_users(p_parish text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_office(p_parish);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'phone', phone, 'role', role, 'has_pin', user_id is not null) order by created_at)
    from public.office_users where parish_id = p_parish), '[]'::jsonb);
end $$;

/** Who is signed in to the office app, or null. */
create function public.get_office_account(p_parish text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', id, 'name', name, 'phone', phone, 'role', role)
  from public.office_users where parish_id = p_parish and user_id = auth.uid() and auth.uid() is not null
$$;

/** The parish priest adds someone to the office team, and gets the setup code they sign in with the first time. */
create function public.add_office_user(p_parish text, p_name text, p_phone text, p_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  u public.office_users;
begin
  perform private.require_priest(p_parish);
  if exists (select 1 from public.office_users where parish_id = p_parish and private.phone_key(phone) = private.phone_key(p_phone)) then
    raise exception 'officeUserExists';
  end if;
  insert into public.office_users (parish_id, name, phone, role) values (p_parish, trim(p_name), trim(p_phone), p_role) returning * into u;
  return jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'role', u.role) || private.new_code(p_parish, p_phone, 'office');
end $$;

/** The parish priest gives a member of the team a new setup code, e.g. after they forgot their PIN. */
create function public.issue_office_code(p_office_user text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  u public.office_users;
begin
  select * into u from public.office_users where id = p_office_user;
  perform private.require_priest(u.parish_id);
  return private.new_code(u.parish_id, u.phone, 'office');
end $$;

/** The parish priest takes someone off the office team. */
create function public.remove_office_user(p_office_user text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  u public.office_users;
begin
  select * into u from public.office_users where id = p_office_user;
  perform private.require_priest(u.parish_id);
  if u.user_id = auth.uid() then raise exception 'cannotRemoveSelf'; end if;
  delete from public.office_users where id = p_office_user;
  delete from public.pin_codes where parish_id = u.parish_id and phone_key = private.phone_key(u.phone) and purpose = 'office';
end $$;

-- For the PIN function (service role only) ------------------------------------------------------------------

/**
 * Uses up a code: true when this number had this unexpired code for this purpose. For an office setup code,
 * links the office team member to the login.
 */
create function public.redeem_pin_code(p_parish text, p_phone text, p_code text, p_user uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  c public.pin_codes;
begin
  select * into c from public.pin_codes
    where parish_id = p_parish and phone_key = private.phone_key(p_phone) and code = p_code and expires_at > now()
    order by purpose limit 1;
  if c.code is null then return null; end if;
  delete from public.pin_codes where parish_id = c.parish_id and phone_key = c.phone_key and purpose = c.purpose;
  if c.purpose = 'office' then
    update public.office_users set user_id = p_user where parish_id = p_parish and private.phone_key(phone) = c.phone_key;
  end if;
  return c.purpose;
end $$;

/** Whether this number has this unexpired code, without using it up. A wrong code counts against the number's codes. */
create function public.check_pin_code(p_parish text, p_phone text, p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.pin_codes where expires_at <= now() or failed_attempts >= 5;
  if exists (select 1 from public.pin_codes where parish_id = p_parish and phone_key = private.phone_key(p_phone) and code = p_code) then
    return true;
  end if;
  update public.pin_codes set failed_attempts = failed_attempts + 1 where parish_id = p_parish and phone_key = private.phone_key(p_phone);
  return false;
end $$;

/** The login made for a number, if any. */
create function public.user_id_for_phone(p_phone text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where email = private.phone_key(p_phone) || '@phone.parish-app.in'
$$;

-- Who may call which function --------------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;

grant execute on function
  public.get_my_family(text), public.register_family(text, jsonb, text, text, jsonb), public.request_to_join_family(text, text, jsonb),
  public.add_family_members(text, jsonb), public.update_family_member(text, jsonb), public.ask_to_rejoin_parish(text),
  public.submit_intention(text, jsonb), public.change_my_subscription(text, text, integer),
  public.get_my_messages(text), public.mark_messages_read(text), public.get_group_access(text),
  public.send_group_message(text, text, text), public.ask_to_join_group(text), public.answer_join_request(text, text, boolean),
  public.list_families(text), public.set_family_status(text, text), public.set_family_anbiyam(text, text),
  public.remove_family(text, text, text), public.add_officer(text, jsonb), public.issue_pin_reset(text, text),
  public.list_office_users(text), public.get_office_account(text), public.add_office_user(text, text, text, text),
  public.issue_office_code(text), public.remove_office_user(text)
to authenticated;

grant execute on function public.redeem_pin_code(text, text, text, uuid), public.check_pin_code(text, text, text), public.user_id_for_phone(text)
to service_role;
