-- Seeds the group's real trip planning into Supabase. Run this ONCE, after
-- schema.sql, in the SQL editor — it is NOT idempotent (re-running it
-- creates duplicate trips). Requires that Fabian has already signed in at
-- least once (so his profiles row exists) since every trip's created_by
-- references his profile by email.

do $$
#variable_conflict use_variable
declare
  admin_id uuid;
  trip_id uuid;
begin
  select id into admin_id from profiles where email = 'fabian.joebstl@gmail.com';
  if admin_id is null then
    raise exception 'No profile found for fabian.joebstl@gmail.com — sign in once first, then re-run this seed.';
  end if;

  -- ── 2026: Western Poland ──────────────────────────────────────────
  insert into trips (title, year, status, color, description, created_by)
  values ('Western Poland', 2026, 'planned', '#fbbf24',
    'Graz through Vienna up to Wrocław, Poznań and Łódź.', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index) values
    (trip_id, 'Graz', 47.0707, 15.4395, 0),
    (trip_id, 'Vienna', 48.2082, 16.3738, 1),
    (trip_id, 'Wrocław', 51.1079, 17.0385, 2),
    (trip_id, 'Poznań', 52.4064, 16.9252, 3),
    (trip_id, 'Łódź', 51.7592, 19.456, 4);

  -- ── 2027: Turkey & the Caucasus ────────────────────────────────────
  insert into trips (title, year, status, color, description, created_by)
  values ('Turkey & the Caucasus', 2027, 'planned', '#f472b6',
    'Fly to Istanbul, train via Ankara, the Doğu Express east to Kars, on through Batumi and Tbilisi to Yerevan, flying home to Vienna.',
    admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode, wiki_url) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.', 'ground', null),
    (trip_id, 'Istanbul', 41.0082, 28.9784, 1, 'Fly in from Vienna.', 'flight', null),
    (trip_id, 'Ankara', 39.9334, 32.8597, 2, 'Train from Istanbul.', 'ground', null),
    (trip_id, 'Kars', 40.6013, 43.0975, 3, 'Doğu Express.', 'ground', 'https://en.wikipedia.org/wiki/Do%C4%9Fu_Express'),
    (trip_id, 'Batumi', 41.6168, 41.6367, 4, null, 'ground', null),
    (trip_id, 'Tbilisi', 41.7151, 44.8271, 5, null, 'ground', null),
    (trip_id, 'Yerevan', 40.1792, 44.4991, 6, null, 'ground', null),
    (trip_id, 'Vienna', 48.2082, 16.3738, 7, 'Fly home from Yerevan.', 'flight', null);

  -- ── 2028: Caspian Crossing to Uzbekistan ───────────────────────────
  insert into trips (title, year, status, color, description, created_by)
  values ('Caspian Crossing to Uzbekistan', 2028, 'idea', '#2dd4bf',
    'Fly to Tbilisi, night train to Baku, ferry across the Caspian to Aktau, then down into Uzbekistan.',
    admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.', 'ground'),
    (trip_id, 'Tbilisi', 41.7151, 44.8271, 1, 'Fly in from Vienna.', 'flight'),
    (trip_id, 'Baku', 40.4093, 49.8671, 2, 'Night train from Tbilisi.', 'ground'),
    (trip_id, 'Aktau', 43.65, 51.1972, 3, 'Caspian Sea ferry.', 'ground'),
    (trip_id, 'Khiva', 41.3775, 60.3639, 4, null, 'ground'),
    (trip_id, 'Bukhara', 39.7747, 64.4286, 5, null, 'ground'),
    (trip_id, 'Samarkand', 39.6542, 66.9597, 6, null, 'ground'),
    (trip_id, 'Tashkent', 41.2995, 69.2401, 7, null, 'ground');

  -- ── 2029: Lviv, Kyiv & Kharkiv ─────────────────────────────────────
  insert into trips (title, year, status, color, description, created_by)
  values ('Lviv, Kyiv & Kharkiv', 2029, 'idea', '#a78bfa',
    'Train from Vienna via Lviv (Lemberg) to Kyiv and Kharkiv.', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0),
    (trip_id, 'Lviv', 49.8397, 24.0297, 1),
    (trip_id, 'Kyiv', 50.4501, 30.5234, 2),
    (trip_id, 'Kharkiv', 49.9935, 36.2304, 3);

  -- ── 2030: Balkans Road Trip II ─────────────────────────────────────
  insert into trips (title, year, status, color, description, created_by)
  values ('Balkans Road Trip II', 2030, 'idea', '#fb7185',
    'Graz down to Niš, Pristina, Skopje, maybe Albania, back along the coast.', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes) values
    (trip_id, 'Graz', 47.0707, 15.4395, 0, null),
    (trip_id, 'Niš', 43.3209, 21.8958, 1, null),
    (trip_id, 'Pristina', 42.6629, 21.1655, 2, null),
    (trip_id, 'Skopje', 41.9981, 21.4254, 3, null),
    (trip_id, 'Tirana', 41.3275, 19.8187, 4, 'Maybe — if we make it to Albania.'),
    (trip_id, 'Budva', 42.2911, 18.84, 5, 'Coast road back north.');

  -- ── 2030+: Trans-Siberian to China ─────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, created_by)
  values ('Trans-Siberian to China', 2030, '2030+', 'idea', '#38bdf8',
    'Vienna to Moscow, then the real Trans-Siberian/Trans-Mongolian corridor through Yekaterinburg, Novosibirsk, Irkutsk and Ulaanbaatar into China. One of a few 2030+ ideas.',
    admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.'),
    (trip_id, 'Moscow', 55.7558, 37.6173, 1, null),
    (trip_id, 'Yekaterinburg', 56.8389, 60.6057, 2, null),
    (trip_id, 'Novosibirsk', 55.0084, 82.9357, 3, null),
    (trip_id, 'Irkutsk', 52.2978, 104.2964, 4, 'Lake Baikal.'),
    (trip_id, 'Ulan-Ude', 51.8335, 107.5843, 5, null),
    (trip_id, 'Ulaanbaatar', 47.8864, 106.9057, 6, null),
    (trip_id, 'Beijing', 39.9042, 116.4074, 7, null);

  -- ── 2030+: Oman ─────────────────────────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, created_by)
  values ('Oman', 2030, '2030+', 'idea', '#34d399',
    'Flight to Oman — one of a few 2030+ ideas, alternative to the Baku & Tehran idea.', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.', 'ground'),
    (trip_id, 'Muscat', 23.5859, 58.4059, 1, 'Fly in from Vienna.', 'flight'),
    (trip_id, 'Salalah', 17.0151, 54.0924, 2, null, 'ground');

  -- ── 2030+: Baku & Tehran ─────────────────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, created_by)
  values ('Baku & Tehran', 2030, '2030+', 'idea', '#c084fc',
    'Fly to Tbilisi, night train to Baku, then roadtrip or train down to Tehran — one of a few 2030+ ideas, alternative to the Oman idea.',
    admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.', 'ground'),
    (trip_id, 'Tbilisi', 41.7151, 44.8271, 1, 'Fly in from Vienna.', 'flight'),
    (trip_id, 'Baku', 40.4093, 49.8671, 2, 'Night train from Tbilisi.', 'ground'),
    (trip_id, 'Tehran', 35.6892, 51.389, 3, 'Roadtrip or train — not decided yet.', 'ground');

  -- ── 2030+: Bodensee Loop ─────────────────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, created_by)
  values ('Bodensee Loop', 2030, '2030+', 'idea', '#67e8f9',
    'Vienna to Bregenz, then a loop around the Bodensee — Konstanz, St. Gallen, Zürich — back to Vienna by train. One of a few 2030+ ideas.',
    admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, null),
    (trip_id, 'Bregenz', 47.5031, 9.7471, 1, null),
    (trip_id, 'Konstanz', 47.6603, 9.1758, 2, null),
    (trip_id, 'St. Gallen', 47.4245, 9.3767, 3, null),
    (trip_id, 'Zürich', 47.3769, 8.5417, 4, null),
    (trip_id, 'Vienna', 48.2082, 16.3738, 5, 'Back home by train.');

end $$;
