-- The songbook now has two books (இறை அலைகள், and bibleintamil.com's song collection), numbered separately,
-- and more occasions. The table only ever held loaded copies of the books, so it is rebuilt; load it again
-- with npm run backend:songs.

drop table public.songs;

create table public.songs (
  book text not null check (book in ('iraialaihal', 'thirattu')),
  -- As numbered in its book.
  number integer not null,
  title text not null,
  occasions text[] not null check (occasions <@ array['entrance', 'psalms', 'meditation', 'offertory', 'communion', 'thanksgiving',
    'mary', 'saints', 'charismatic', 'adoration', 'reconciliation', 'sacredHeart', 'bhajan', 'children', 'christmas', 'lent',
    'departed', 'massSettings', 'holySpirit', 'marriage', 'priesthood', 'mercy', 'traditional', 'other']),
  -- Each verse or refrain as a list of lines: [["line", …], …]
  stanzas jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (book, number)
);

alter table public.songs enable row level security;
create policy "Anyone reads the songbook" on public.songs for select using (true);
grant select on public.songs to anon, authenticated;
grant all on public.songs to service_role;
