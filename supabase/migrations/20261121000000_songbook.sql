-- The songbook (இறை அலைகள்), shared by every parish. Anyone reads it; it is loaded from the server side
-- (npm run backend:songs), not edited in the apps. The phones keep a copy, so the songs work in church
-- without a signal.

create table public.songs (
  -- As numbered in the printed book.
  number integer primary key,
  title text not null,
  occasions text[] not null check (occasions <@ array['entrance', 'psalms', 'meditation', 'offertory', 'communion', 'thanksgiving',
    'mary', 'saints', 'charismatic', 'adoration', 'reconciliation', 'sacredHeart', 'bhajan', 'children', 'christmas', 'lent',
    'departed', 'massSettings']),
  -- Each verse or refrain as a list of lines: [["line", …], …]
  stanzas jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.songs enable row level security;
create policy "Anyone reads the songbook" on public.songs for select using (true);
grant select on public.songs to anon, authenticated;
grant all on public.songs to service_role;
