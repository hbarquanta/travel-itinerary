-- Atlas schema. Paste this whole file into the Supabase SQL editor and run
-- it once. It's idempotent — safe to re-run after edits (e.g. adding a
-- friend's email to allowed_users below).

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────
do $$ begin
  create type trip_status as enum ('idea', 'planned', 'locked', 'past');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_kind as enum ('trip', 'dates');
exception when duplicate_object then null; end $$;

do $$ begin
  create type travel_mode as enum ('car', 'flight');
exception when duplicate_object then null; end $$;

-- Grew from car(as ground)/flight to car/train/ferry/flight (distinct map
-- animations per mode) — migrated directly against the database at some
-- point and never written back into this file, so it silently drifted out
-- of sync with reality until a stop-data script hit "invalid input value
-- for enum travel_mode: ground" against the live database. Kept here so a
-- fresh install ends up in the same shape, and so this file can't drift
-- again. `rename value` has no `if exists` form, hence the exception
-- guard; `add value if not exists` already is idempotent on its own.
do $$ begin
  alter type travel_mode rename value 'ground' to 'car';
exception when others then null; end $$;
alter type travel_mode add value if not exists 'train';
alter type travel_mode add value if not exists 'ferry';

do $$ begin
  create type trip_category as enum ('Friends', 'Solo', 'Family');
exception when duplicate_object then null; end $$;

-- ── Allowlist seed ───────────────────────────────────────────────────
-- Edit this block to add/remove friends, then re-run the whole file. Emails
-- for non-Fabian characters are fabricated (@atlas.internal) — login is by
-- character + PIN (a Supabase Auth password on that email), not real email.
create table if not exists allowed_users (
  email text primary key,
  display_name text not null,
  color text not null,
  emoji text not null,
  is_admin boolean not null default false,
  -- Excluded from the pre-login picker by default (e.g. the Test account) —
  -- still a real, working login, just not shown to everyone. Revealed only
  -- via the admin-only toggle in Settings (see sync_profile_to_allowed_users
  -- doesn't touch this; it's set directly, not through a profile field).
  hidden boolean not null default false,
  -- Explicit picker ordering. Not derived from is_admin at query time —
  -- that column is deliberately never exposed pre-login (see public_roster
  -- below), and a view's own internal ORDER BY isn't reliably preserved
  -- once queried from outside it, so both the view *and* the client
  -- fetch (fetchRoster in queries.ts) order by this column explicitly.
  sort_order int not null default 1
);

alter table allowed_users add column if not exists hidden boolean not null default false;
alter table allowed_users add column if not exists sort_order int not null default 1;

insert into allowed_users (email, display_name, color, emoji, is_admin, hidden, sort_order) values
  ('fabian.joebstl@gmail.com',   'Fabian',  '#f97316', '🦊', true,  false, 0),
  ('dominik@atlas.internal',     'Dominik', '#8b5cf6', '🐙', false, false, 1),
  ('florian@atlas.internal',     'Florian', '#22d3ee', '🦋', false, false, 2),
  ('mateo@atlas.internal',       'Mateo',   '#a3e635', '🦅', false, false, 3),
  ('michael@atlas.internal',     'Michael', '#f43f5e', '🐝', false, false, 4),
  ('test@atlas.internal',        'Test',    '#94a3b8', '🧪', false, true,  5)
-- display_name/color/emoji are deliberately NOT in this update set — this
-- block re-runs every time schema.sql does (for unrelated migrations, e.g.
-- an RLS or enum fix elsewhere in this file), and it used to stomp anyone's
-- self-service Settings change (a new emoji, a new color) back to these
-- hardcoded defaults on every single re-run. Only admin-controlled fields
-- belong here; user-customizable ones only seed a *new* row.
on conflict (email) do update set
  is_admin = excluded.is_admin,
  hidden = excluded.hidden,
  sort_order = excluded.sort_order;

-- Drop any old placeholder/removed rows left over from earlier seed data —
-- the insert above only updates rows matching one of today's emails, it
-- never removes emails that used to be in this list but no longer are.
delete from allowed_users
where email not in (
  'fabian.joebstl@gmail.com', 'dominik@atlas.internal', 'florian@atlas.internal',
  'mateo@atlas.internal', 'michael@atlas.internal', 'test@atlas.internal'
);

-- Column-limited so is_admin never leaks: this is the only thing readable
-- pre-login (by the character picker), RLS can't restrict columns so a
-- direct select policy on allowed_users would expose is_admin too. `hidden`
-- is fine to expose — it's just a display hint, the frontend filters it,
-- not a security boundary (the account is still PIN-protected either way).
-- Ordered explicitly (not left to physical row order, which drifts every
-- time a row is updated) so the picker's layout is always the same.
create or replace view public_roster as
  select email, display_name, color, emoji, hidden, sort_order from allowed_users
  order by sort_order asc;
grant select on public_roster to anon, authenticated;

-- Not readable by the client (no policies below) — only the security-definer
-- trigger function can see it, so anon/authenticated keys can't enumerate it.
alter table allowed_users enable row level security;

-- ── Profiles (one row per authenticated allowlisted user) ────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  color text not null,
  emoji text not null,
  is_admin boolean not null default false,
  -- Mirrors allowed_users.hidden (admin-controlled, not user-editable) so
  -- the frontend can filter e.g. the Test account out of member-facing
  -- lists (approval rows, participant pickers) without needing a second
  -- round trip to allowed_users, which the client can't read directly.
  hidden boolean not null default false
);

alter table profiles add column if not exists hidden boolean not null default false;

-- Auto-create a profile from the allowlist when an allowlisted email signs
-- in for the first time. Non-allowlisted emails simply get no profile row,
-- which is what locks them out everywhere else (see RLS policies below).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a allowed_users%rowtype;
begin
  select * into a from allowed_users where email = new.email;
  if found then
    insert into profiles (id, email, display_name, color, emoji, is_admin, hidden)
    values (new.id, new.email, a.display_name, a.color, a.emoji, a.is_admin, a.hidden)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: the trigger above only fires on a brand-new auth.users insert.
-- If someone's auth account already existed (e.g. an earlier login attempt
-- before their email was added to allowed_users, or before this schema was
-- applied) they'd have no profile despite being allowlisted now. Re-running
-- this block (safe, idempotent) catches those cases. Only is_admin/hidden
-- (truly admin-controlled) stay in the conflict-update — display_name/
-- color/emoji are self-service via Settings, and overwriting them here on
-- every re-run was clobbering anyone's actual choice back to the
-- allowed_users default.
insert into profiles (id, email, display_name, color, emoji, is_admin, hidden)
select u.id, u.email, a.display_name, a.color, a.emoji, a.is_admin, a.hidden
from auth.users u
join allowed_users a on a.email = u.email
on conflict (id) do update set
  is_admin = excluded.is_admin,
  hidden = excluded.hidden;

-- Every character's emoji must be unique — two people can't be the same
-- animal. Enforced at the DB level so a race between two people picking
-- the same emoji at once is still caught, not just the client-side check.
-- (plain `add constraint` has no `if not exists` form, hence the do-block.
-- A unique constraint's backing index can raise either duplicate_object or
-- duplicate_table on a re-run depending on Postgres version — catch both.)
do $$ begin
  alter table profiles add constraint profiles_emoji_unique unique (emoji);
exception when duplicate_object or duplicate_table then null; end $$;
do $$ begin
  alter table allowed_users add constraint allowed_users_emoji_unique unique (emoji);
exception when duplicate_object or duplicate_table then null; end $$;

-- Same idea, same reasoning, for color — one avatar color per person.
do $$ begin
  alter table profiles add constraint profiles_color_unique unique (color);
exception when duplicate_object or duplicate_table then null; end $$;
do $$ begin
  alter table allowed_users add constraint allowed_users_color_unique unique (color);
exception when duplicate_object or duplicate_table then null; end $$;

-- The reverse direction of the sync above: allowed_users seeds profiles on
-- first login, but a self-service change to your own profile (e.g. picking
-- a new emoji in Settings) only updates `profiles` — the pre-login
-- character-picker roster (public_roster, sourced from allowed_users)
-- would otherwise silently go stale. This mirrors any profile display-field
-- change back down to its allowed_users row by email.
create or replace function sync_profile_to_allowed_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update allowed_users
  set display_name = new.display_name, color = new.color, emoji = new.emoji
  where email = new.email;
  return new;
end;
$$;

drop trigger if exists on_profile_updated on profiles;
create trigger on_profile_updated
  after update of display_name, color, emoji on profiles
  for each row execute function sync_profile_to_allowed_users();

-- ── Trips & stops ──────────────────────────────────────────────────────
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int not null,
  -- Overrides the year chip/grouping label (e.g. '2030+') for open-ended
  -- trips without a fixed year; `year` still holds a real number for
  -- chronological sorting. Null means "just show the year".
  year_group text,
  status trip_status not null default 'idea',
  -- Independent of yearGroup: a fixed, small admin-defined bucket used for
  -- the category filter chips (Solo trips, group trips, family trips, ...).
  category trip_category not null default 'Friends',
  date_start date,
  date_end date,
  dates_confirmed boolean not null default false,
  color text not null,
  description text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table trips add column if not exists year_group text;
alter table trips add column if not exists category trip_category not null default 'Friends';

create table if not exists stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  order_index int not null,
  notes text,
  wiki_url text,
  arrive date,
  depart date,
  travel_mode travel_mode not null default 'car',
  -- Precomputed [lng,lat] path from the *previous* stop to this one, for
  -- ground legs that should follow real roads instead of a straight line
  -- (see src/lib/geo.ts). Null falls back to the straight/great-circle
  -- line — e.g. sea crossings, which have no road route.
  route_geometry jsonb
);

alter table stops add column if not exists route_geometry jsonb;

create index if not exists stops_trip_id_idx on stops (trip_id);

-- ── Ideas (member-suggested pins) ───────────────────────────────────────
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lat double precision not null,
  lng double precision not null,
  year_suggestion int,
  note text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ── Approvals ────────────────────────────────────────────────────────────
create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  kind approval_kind not null,
  created_at timestamptz not null default now(),
  unique (trip_id, user_id, kind)
);

-- ── Participants (who was actually on the trip — distinct from approvals,
-- which track who's signed off on it happening) ────────────────────────
create table if not exists trip_participants (
  trip_id uuid not null references trips (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  primary key (trip_id, profile_id)
);

-- ── Chat (one global channel — every allowlisted member, capped length) ──
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) <= 150 and char_length(trim(body)) > 0),
  created_by uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx on messages (created_at);

-- ── Row Level Security ───────────────────────────────────────────────────
alter table profiles enable row level security;
alter table trips enable row level security;
alter table stops enable row level security;
alter table trip_participants enable row level security;
alter table ideas enable row level security;
alter table messages enable row level security;
alter table approvals enable row level security;

-- Policies on `profiles` can't subquery `profiles` directly — Postgres has
-- to re-run RLS on that inner query too, which re-triggers the same policy
-- forever ("infinite recursion detected in policy for relation profiles").
-- These security-definer helpers run as the (RLS-exempt) function owner, so
-- the inner lookup bypasses RLS instead of recursing into it.
create or replace function is_allowlisted(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = uid);
$$;

create or replace function is_admin_user(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = uid and is_admin);
$$;

-- The caller's own current is_admin value, fetched via the same RLS-bypass
-- trick as the two functions above — used below to stop a self-update from
-- changing its own is_admin, without which `profiles_update_self` only
-- checked *whose* row you were touching, never *which columns*. Any signed-in
-- user could otherwise self-promote with a single REST PATCH call (the
-- anon key and their own session token are both sitting in plain sight in
-- every browser Network tab — no real "hacking" required).
create or replace function current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin from profiles where id = auth.uid();
$$;

-- profiles: any allowlisted user (i.e. anyone who already has a profile row)
-- can read everyone's profile; you can only update your own row, and the
-- update can't change your own is_admin (see current_is_admin above).
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (is_allowlisted(auth.uid()));

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and is_admin = current_is_admin());

-- trips: everyone allowlisted can read; only the admin can write.
drop policy if exists trips_select on trips;
create policy trips_select on trips for select
  using (is_allowlisted(auth.uid()));

drop policy if exists trips_write_admin on trips;
create policy trips_write_admin on trips for all
  using (is_admin_user(auth.uid()))
  with check (is_admin_user(auth.uid()));

-- stops: same shape as trips.
drop policy if exists stops_select on stops;
create policy stops_select on stops for select
  using (is_allowlisted(auth.uid()));

drop policy if exists stops_write_admin on stops;
create policy stops_write_admin on stops for all
  using (is_admin_user(auth.uid()))
  with check (is_admin_user(auth.uid()));

-- ideas: everyone allowlisted can read; members can create/edit/delete
-- their own idea pins (but not each other's).
drop policy if exists ideas_select on ideas;
create policy ideas_select on ideas for select
  using (is_allowlisted(auth.uid()));

drop policy if exists ideas_insert on ideas;
create policy ideas_insert on ideas for insert
  with check (is_allowlisted(auth.uid()) and created_by = auth.uid());

drop policy if exists ideas_modify_own on ideas;
create policy ideas_modify_own on ideas for update
  using (created_by = auth.uid());

-- Own creator can delete their own idea; admin can also clear out anyone's
-- (needed both for outright removal and so promoting someone else's idea to
-- a trip can clean up the source pin afterward — see saveEditSession).
drop policy if exists ideas_delete_own on ideas;
create policy ideas_delete_own on ideas for delete
  using (created_by = auth.uid() or is_admin_user(auth.uid()));

-- approvals: everyone allowlisted can read; a user can only manage their own
-- approval rows (tap your own avatar, not someone else's).
drop policy if exists approvals_select on approvals;
create policy approvals_select on approvals for select
  using (is_allowlisted(auth.uid()));

drop policy if exists approvals_insert on approvals;
create policy approvals_insert on approvals for insert
  with check (user_id = auth.uid());

drop policy if exists approvals_delete_own on approvals;
create policy approvals_delete_own on approvals for delete
  using (user_id = auth.uid());

-- trip_participants: everyone allowlisted can read; only the admin can write
-- (who was actually on a trip is admin-curated, same as trips/stops).
drop policy if exists trip_participants_select on trip_participants;
create policy trip_participants_select on trip_participants for select
  using (is_allowlisted(auth.uid()));

drop policy if exists trip_participants_write_admin on trip_participants;
create policy trip_participants_write_admin on trip_participants for all
  using (is_admin_user(auth.uid()))
  with check (is_admin_user(auth.uid()));

-- messages: everyone allowlisted can read and post; you can only delete
-- your own (typo/retraction), admin can delete anyone's (moderation).
-- No update policy — a sent message is permanent, not editable in place.
drop policy if exists messages_select on messages;
create policy messages_select on messages for select
  using (is_allowlisted(auth.uid()));

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert
  with check (is_allowlisted(auth.uid()) and created_by = auth.uid());

drop policy if exists messages_delete_own on messages;
create policy messages_delete_own on messages for delete
  using (created_by = auth.uid() or is_admin_user(auth.uid()));

-- ── Realtime ─────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table trips;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table stops;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table ideas;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table approvals;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table trip_participants;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null; end $$;
