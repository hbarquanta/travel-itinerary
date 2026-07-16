-- All "Friends"-category trips, consolidated into one file for easier
-- reading/maintenance. Replaces the following, now-deleted files (each
-- trip's data below is the final state after every patch that used to live
-- across them, applied in order):
--   archive/seed.sql, archive/seed_2025.sql,
--   archive/update_2026_2029_trips.sql, archive/streamline_descriptions.sql
--
-- IMPORTANT: every trip below already exists in the live database — this
-- file documents the current, correct state, it is NOT meant to be run
-- against the current DB (it would create duplicates of everything). Keep
-- it as the single source of truth to read/diff against when a trip needs
-- another correction, and only actually execute it if setting up a fresh
-- database from scratch (e.g. disaster recovery).

do $$
#variable_conflict use_variable
declare
  admin_id uuid;
  trip_id uuid;
begin
  select id into admin_id from profiles where email = 'fabian.joebstl@gmail.com';
  if admin_id is null then
    raise exception 'No profile found for fabian.joebstl@gmail.com — sign in once first, then re-run this.';
  end if;

  -- ── 2021: Galizien ────────────────────────────────────────────────────
  insert into trips (title, year, status, dates_confirmed, color, description, category, created_by)
  values ('Galizien', 2021, 'past', true, '#4f46e5',
    'Graz-Vienna-Brno-Kraków-Warsaw-Kraków-Brno-Vienna-Graz', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
    (trip_id, 'Graz',    47.0707, 15.4395, 0, 'train'),
    (trip_id, 'Vienna',  48.2082, 16.3738, 1, 'train'),
    (trip_id, 'Brno',    49.1951, 16.6068, 2, 'train'),
    (trip_id, 'Kraków',  50.0647, 19.9450, 3, 'train'),
    (trip_id, 'Warsaw',  52.2297, 21.0122, 4, 'train'),
    (trip_id, 'Kraków',  50.0647, 19.9450, 5, 'train'),
    (trip_id, 'Brno',    49.1951, 16.6068, 6, 'train'),
    (trip_id, 'Vienna',  48.2082, 16.3738, 7, 'train'),
    (trip_id, 'Graz',    47.0707, 15.4395, 8, 'train');

  insert into trip_participants (trip_id, profile_id)
  select trip_id, p.id from profiles p where p.display_name in ('Fabian', 'Dominik', 'Florian', 'Michael');

  -- ── 2022: Westbalkan I ──────────────────────────────────────────────────
  insert into trips (title, year, status, dates_confirmed, color, description, category, created_by)
  values ('Westbalkan I', 2022, 'past', true, '#b91c1c',
    'Graz-Osijek-Novi Sad-Belgrade-Graz', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
    (trip_id, 'Graz',     47.0707, 15.4395, 0, 'car'),
    (trip_id, 'Osijek',   45.5550, 18.6955, 1, 'car'),
    (trip_id, 'Novi Sad', 45.2671, 19.8335, 2, 'car'),
    (trip_id, 'Belgrade', 44.7866, 20.4489, 3, 'car'),
    (trip_id, 'Graz',     47.0707, 15.4395, 4, 'car');

  insert into trip_participants (trip_id, profile_id)
  select trip_id, p.id from profiles p where p.display_name in ('Fabian', 'Dominik', 'Florian', 'Michael');

  -- ── 2024: Dacia ───────────────────────────────────────────────────────
  insert into trips (title, year, status, dates_confirmed, color, description, category, created_by)
  values ('Dacia', 2024, 'past', true, '#0d9488',
    'Vienna-Alba Iulia-Cluj-Napoca-Timișoara-Arad-Vienna', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna',       48.2082, 16.3738, 0, 'Night train to Cluj-Napoca.',                     'train'),
    (trip_id, 'Alba Iulia',   46.0697, 23.5804, 1, 'Detour — the direct route was under renovation.', 'train'),
    (trip_id, 'Cluj-Napoca',  46.7712, 23.6236, 2, null,                                              'train'),
    (trip_id, 'Timișoara',    45.7489, 21.2087, 3, null,                                              'train'),
    (trip_id, 'Arad',         46.1866, 21.3123, 4, null,                                              'train'),
    (trip_id, 'Vienna',       48.2082, 16.3738, 5, null,                                              'train');

  insert into trip_participants (trip_id, profile_id)
  select trip_id, p.id from profiles p where p.display_name in ('Fabian', 'Dominik', 'Florian', 'Michael');

  -- ── 2025: Westbalkan II ─────────────────────────────────────────────────
  insert into trips (title, year, status, dates_confirmed, color, description, category, created_by)
  values ('Westbalkan II', 2025, 'past', true, '#ef4444',
    'Graz-Wildon-Šibenik-Dubrovnik-Herceg Novi-Kotor-Budva-Cetinje-Podgorica-Nikšić-Mostar-Sarajevo-Banja Luka-Wildon-Graz',
    'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes) values
    (trip_id, 'Graz', 47.0707, 15.4395, 0, null),
    (trip_id, 'Wildon', 46.8886, 15.5211, 1, null),
    (trip_id, 'Šibenik', 43.7350, 15.8952, 2, null),
    (trip_id, 'Dubrovnik', 42.6507, 18.0944, 3, null),
    (trip_id, 'Herceg Novi', 42.4531, 18.5375, 4, null),
    (trip_id, 'Kotor', 42.4247, 18.7712, 5, null),
    (trip_id, 'Budva', 42.2911, 18.8400, 6, null),
    (trip_id, 'Cetinje', 42.3931, 18.9169, 7, 'The old royal capital.'),
    (trip_id, 'Podgorica', 42.4304, 19.2594, 8, null),
    (trip_id, 'Nikšić', 42.7731, 18.9500, 9, null),
    (trip_id, 'Mostar', 43.3438, 17.8078, 10, null),
    (trip_id, 'Sarajevo', 43.8563, 18.4131, 11, null),
    (trip_id, 'Banja Luka', 44.7722, 17.1910, 12, null),
    (trip_id, 'Wildon', 46.8886, 15.5211, 13, 'On the way home.'),
    (trip_id, 'Graz', 47.0707, 15.4395, 14, null);

  -- ── 2026: Polska (was Western Poland) ──────────────────────────────────
  insert into trips (title, year, status, color, description, category, created_by)
  values ('Polska', 2026, 'planned', '#fbbf24',
    'Graz-Poznań-Łódź-Wrocław-Vienna-Graz', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
    (trip_id, 'Graz',    47.0707, 15.4395, 0, 'car'),
    (trip_id, 'Poznań',  52.4064, 16.9252, 1, 'car'),
    (trip_id, 'Łódź',    51.7592, 19.4560, 2, 'car'),
    (trip_id, 'Wrocław', 51.1079, 17.0385, 3, 'car'),
    (trip_id, 'Vienna',  48.2082, 16.3738, 4, 'car'),
    (trip_id, 'Graz',    47.0707, 15.4395, 5, 'car');

  -- ── 2027: Transcaucasia (was Turkey & the Caucasus) ────────────────────
  insert into trips (title, year, status, color, description, category, created_by)
  values ('Transcaucasia', 2027, 'planned', '#f472b6',
    'Vienna-Istanbul-Ankara-Kars-Batumi-Tbilisi-Yerevan-Vienna', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode, wiki_url) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.', 'car', null),
    (trip_id, 'Istanbul', 41.0082, 28.9784, 1, 'Fly in from Vienna.', 'flight', null),
    (trip_id, 'Ankara', 39.9334, 32.8597, 2, 'Train from Istanbul.', 'car', null),
    (trip_id, 'Kars', 40.6013, 43.0975, 3, 'Doğu Express.', 'car', 'https://en.wikipedia.org/wiki/Do%C4%9Fu_Express'),
    (trip_id, 'Batumi', 41.6168, 41.6367, 4, null, 'car', null),
    (trip_id, 'Tbilisi', 41.7151, 44.8271, 5, null, 'car', null),
    (trip_id, 'Yerevan', 40.1792, 44.4991, 6, null, 'car', null),
    (trip_id, 'Vienna', 48.2082, 16.3738, 7, 'Fly home from Yerevan.', 'flight', null);

  -- ── 2028: Україна (was Ukraine / Lviv, Kyiv & Kharkiv) ─────────────────
  insert into trips (title, year, status, color, description, category, created_by)
  values ('Україна', 2028, 'idea', '#a78bfa',
    'Vienna-Lviv-Kyiv-Kharkiv-Odesa-Chișinău-Bucharest-Vienna', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
    (trip_id, 'Vienna',   48.2082, 16.3738, 0, 'car'),
    (trip_id, 'Lviv',     49.8397, 24.0297, 1, 'car'),
    (trip_id, 'Kyiv',     50.4501, 30.5234, 2, 'car'),
    (trip_id, 'Kharkiv',  49.9935, 36.2304, 3, 'car'),
    (trip_id, 'Odesa',    46.4825, 30.7233, 4, 'car'),
    (trip_id, 'Chișinău', 47.0105, 28.8638, 5, 'car'),
    (trip_id, 'Bucharest',44.4268, 26.1025, 6, 'car'),
    (trip_id, 'Vienna',   48.2082, 16.3738, 7, 'car');

  -- ── 2029: Turkestan (was Caspian Crossing to Uzbekistan) ───────────────
  insert into trips (title, year, status, color, description, category, created_by)
  values ('Turkestan', 2029, 'idea', '#2dd4bf',
    'Vienna-Tbilisi-Baku-Aktau-Khiva-Bukhara-Samarkand-Tashkent-Vienna', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, 'Home base.', 'car'),
    (trip_id, 'Tbilisi', 41.7151, 44.8271, 1, 'Fly in from Vienna.', 'flight'),
    (trip_id, 'Baku', 40.4093, 49.8671, 2, 'Night train from Tbilisi.', 'car'),
    (trip_id, 'Aktau', 43.6500, 51.1972, 3, 'Caspian Sea ferry.', 'car'),
    (trip_id, 'Khiva', 41.3775, 60.3639, 4, null, 'car'),
    (trip_id, 'Bukhara', 39.7747, 64.4286, 5, null, 'car'),
    (trip_id, 'Samarkand', 39.6542, 66.9597, 6, null, 'car'),
    (trip_id, 'Tashkent', 41.2995, 69.2401, 7, null, 'car');

  -- ── 2030+: Westbalkan III (was Balkans Road Trip II) ───────────────────
  insert into trips (title, year, status, color, description, category, created_by)
  values ('Westbalkan III', 2030, 'idea', '#fb7185',
    'Graz-Niš-Pristina-Skopje-Tirana-Budva-Dubrovnik-Split-Graz', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes) values
    (trip_id, 'Graz', 47.0707, 15.4395, 0, null),
    (trip_id, 'Niš', 43.3209, 21.8958, 1, null),
    (trip_id, 'Pristina', 42.6629, 21.1655, 2, null),
    (trip_id, 'Skopje', 41.9981, 21.4254, 3, null),
    (trip_id, 'Tirana', 41.3275, 19.8187, 4, 'Maybe — if we make it to Albania.'),
    (trip_id, 'Budva', 42.2911, 18.8400, 5, 'Coast road back north.'),
    (trip_id, 'Dubrovnik', 42.6507, 18.0944, 6, null),
    (trip_id, 'Split', 43.5081, 16.4402, 7, null),
    (trip_id, 'Graz', 47.0707, 15.4395, 8, null);

  -- ── 2030+: Transsiberia (was Trans-Siberian to China) ──────────────────
  insert into trips (title, year, year_group, status, color, description, category, created_by)
  values ('Transsiberia', 2030, '2030+', 'idea', '#38bdf8',
    'Vienna-Moscow-Yekaterinburg-Novosibirsk-Irkutsk-Ulan-Ude-Ulaanbaatar-Beijing-Shanghai-Vienna',
    'Friends', admin_id)
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

  insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
    (trip_id, 'Shanghai', 31.2304, 121.4737, 8, 'train'),
    (trip_id, 'Vienna',   48.2082,  16.3738, 9, 'flight');

  -- ── 2030+: Arabia (was Oman) ────────────────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, category, created_by)
  values ('Arabia', 2030, '2030+', 'idea', '#34d399',
    'Vienna-Muscat-Nizwa-Jebel Akhdar-Wahiba Sands-Salalah-Abu Dhabi-Dubai-Riyadh-AlUla-Jeddah-Vienna',
    'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna',        48.2082, 16.3738,  0, 'Home base.',                                 'car'),
    (trip_id, 'Muscat',        23.5859, 58.4059,  1, 'Fly in from Vienna.',                        'flight'),
    (trip_id, 'Nizwa',         22.9333, 57.5333,  2, null,                                         'car'),
    (trip_id, 'Jebel Akhdar',  23.0667, 57.6667,  3, null,                                         'car'),
    (trip_id, 'Wahiba Sands',  22.0833, 58.5000,  4, null,                                         'car'),
    (trip_id, 'Salalah',       17.0151, 54.0924,  5, null,                                         'car'),
    (trip_id, 'Abu Dhabi',     24.4539, 54.3773,  6, 'Long drive back north, via Al Ain.',          'car'),
    (trip_id, 'Dubai',         25.2048, 55.2708,  7, null,                                         'car'),
    (trip_id, 'Riyadh',        24.7136, 46.6753,  8, 'Land crossing into Saudi at Al-Ghuwaifat.',   'car'),
    (trip_id, 'AlUla',         26.6097, 37.9153,  9, null,                                         'car'),
    (trip_id, 'Jeddah',        21.4858, 39.1925, 10, null,                                         'car'),
    (trip_id, 'Vienna',        48.2082, 16.3738, 11, 'Fly home from Jeddah.',                       'flight');

  -- ── 2030+: Persia (was Baku & Tehran) ───────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, category, created_by)
  values ('Persia', 2030, '2030+', 'idea', '#c084fc',
    'Vienna-Tbilisi-Baku-Kashan-Isfahan-Yazd-Shiraz-Tehran-Vienna', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode) values
    (trip_id, 'Vienna',  48.2082, 16.3738, 0, 'Home base.',               'car'),
    (trip_id, 'Tbilisi', 41.7151, 44.8271, 1, 'Fly in from Vienna.',      'flight'),
    (trip_id, 'Baku',    40.4093, 49.8671, 2, 'Night train from Tbilisi.', 'train'),
    (trip_id, 'Kashan',  33.9850, 51.4100, 3, null,                       'car'),
    (trip_id, 'Isfahan', 32.6546, 51.6680, 4, null,                       'car'),
    (trip_id, 'Yazd',    31.8974, 54.3569, 5, null,                       'car'),
    (trip_id, 'Shiraz',  29.5918, 52.5837, 6, null,                       'car'),
    (trip_id, 'Tehran',  35.6892, 51.3890, 7, null,                       'car'),
    (trip_id, 'Vienna',  48.2082, 16.3738, 8, 'Fly home from Tehran.',    'flight');

  -- ── 2030+: Bodensee (was Bodensee Loop) ─────────────────────────────────
  insert into trips (title, year, year_group, status, color, description, category, created_by)
  values ('Bodensee', 2030, '2030+', 'idea', '#67e8f9',
    'Vienna-Bregenz-Konstanz-St. Gallen-Zürich-Vienna', 'Friends', admin_id)
  returning id into trip_id;

  insert into stops (trip_id, name, lat, lng, order_index, notes) values
    (trip_id, 'Vienna', 48.2082, 16.3738, 0, null),
    (trip_id, 'Bregenz', 47.5031, 9.7471, 1, null),
    (trip_id, 'Konstanz', 47.6603, 9.1758, 2, null),
    (trip_id, 'St. Gallen', 47.4245, 9.3767, 3, null),
    (trip_id, 'Zürich', 47.3769, 8.5417, 4, null),
    (trip_id, 'Vienna', 48.2082, 16.3738, 5, 'Back home by train.');

end $$;
