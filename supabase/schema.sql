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
  create type travel_mode as enum ('ground', 'flight');
exception when duplicate_object then null; end $$;

-- ── Allowlist seed ───────────────────────────────────────────────────
-- Edit this block to add/remove friends, then re-run the whole file.
create table if not exists allowed_users (
  email text primary key,
  display_name text not null,
  color text not null,
  emoji text not null,
  is_admin boolean not null default false
);

insert into allowed_users (email, display_name, color, emoji, is_admin) values
  ('fabian.joebstl@gmail.com', 'Fabian', '#f97316', '🦊', true),
  ('alex@example.com',  'Alex',  '#8b5cf6', '🐙', false),
  ('mara@example.com',  'Mara',  '#22d3ee', '🦋', false),
  ('jonas@example.com', 'Jonas', '#a3e635', '🦅', false),
  ('elli@example.com',  'Elli',  '#f43f5e', '🐝', false)
on conflict (email) do update set
  display_name = excluded.display_name,
  color = excluded.color,
  emoji = excluded.emoji,
  is_admin = excluded.is_admin;

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
  is_admin boolean not null default false
);

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
    insert into profiles (id, email, display_name, color, emoji, is_admin)
    values (new.id, new.email, a.display_name, a.color, a.emoji, a.is_admin)
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
-- this block (safe, idempotent) catches those cases and keeps existing
-- profiles' display info in sync with allowed_users too.
insert into profiles (id, email, display_name, color, emoji, is_admin)
select u.id, u.email, a.display_name, a.color, a.emoji, a.is_admin
from auth.users u
join allowed_users a on a.email = u.email
on conflict (id) do update set
  display_name = excluded.display_name,
  color = excluded.color,
  emoji = excluded.emoji,
  is_admin = excluded.is_admin;

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
  date_start date,
  date_end date,
  dates_confirmed boolean not null default false,
  color text not null,
  description text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table trips add column if not exists year_group text;

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
  travel_mode travel_mode not null default 'ground'
);

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

-- ── Row Level Security ───────────────────────────────────────────────────
alter table profiles enable row level security;
alter table trips enable row level security;
alter table stops enable row level security;
alter table ideas enable row level security;
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

-- profiles: any allowlisted user (i.e. anyone who already has a profile row)
-- can read everyone's profile; you can only update your own row.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (is_allowlisted(auth.uid()));

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid());

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

drop policy if exists ideas_delete_own on ideas;
create policy ideas_delete_own on ideas for delete
  using (created_by = auth.uid());

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

-- ── Realtime ─────────────────────────────────────────────────────────────
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
