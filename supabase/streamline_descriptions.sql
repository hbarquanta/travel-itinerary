-- Renames trips to short, evocative names, rewrites each description as a
-- plain hyphen-separated stop listing (mirroring the actual route on the
-- map), and rebuilds the stop lists for two trips that grew since this
-- file was first written:
--   - Oman -> Arabia: extended into a full Oman-then-Saudi loop, entirely
--     overland once inside the region (see the note further down), flying
--     home from Jeddah instead of back through Muscat.
--   - Baku & Tehran -> Persia: Kashan and Yazd added, the two classic
--     stops on the real Iran tourist trail that were missing between
--     Baku/Isfahan and Isfahan/Shiraz.
--
-- Every match below checks old-title-OR-new-title, not just the old one —
-- this consolidates an earlier version of this file that may or may not
-- have actually been run against the database, so it's correct either way
-- and safe to re-run afterward (updates just re-set the same values; the
-- stop rebuilds delete-then-reinsert rather than duplicate).

-- ── Arabia (was: Oman) ──────────────────────────────────────────────────
-- All ground once inside the region — no internal flight. Do the Oman
-- south loop first (Nizwa/Jebel Akhdar interior, then Wahiba Sands and
-- Salalah), drive back north to the UAE (real land crossing at Al Ain/
-- Buraimi), then cross directly from the UAE into Saudi Arabia's Eastern
-- Province via the real Al-Ghuwaifat/Sila border crossing west of Abu
-- Dhabi — going *around* the Rub' al Khali/Empty Quarter (which has no
-- tourist road) instead of flying over it. Only the two international
-- legs (Vienna->Muscat, Jeddah->Vienna) stay flights.
--
-- Note: the values-list's travel_mode column infers as `text`, and
-- Postgres won't implicitly cast that into the stops.travel_mode enum
-- column on select — needs an explicit `::travel_mode` cast.
delete from stops where trip_id = (select id from trips where title in ('Oman', 'Arabia'));
insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode)
select id, s.name, s.lat, s.lng, s.order_index, s.notes, s.travel_mode::travel_mode
from trips, (values
  ('Vienna',        48.2082, 16.3738,  0, 'Home base.',                              'ground'),
  ('Muscat',        23.5859, 58.4059,  1, 'Fly in from Vienna.',                     'flight'),
  ('Nizwa',         22.9333, 57.5333,  2, null,                                      'ground'),
  ('Jebel Akhdar',  23.0667, 57.6667,  3, null,                                      'ground'),
  ('Wahiba Sands',  22.0833, 58.5000,  4, null,                                      'ground'),
  ('Salalah',       17.0151, 54.0924,  5, null,                                      'ground'),
  ('Abu Dhabi',     24.4539, 54.3773,  6, 'Long drive back north, via Al Ain.',      'ground'),
  ('Dubai',         25.2048, 55.2708,  7, null,                                      'ground'),
  ('Riyadh',        24.7136, 46.6753,  8, 'Land crossing into Saudi at Al-Ghuwaifat.', 'ground'),
  ('AlUla',         26.6097, 37.9153,  9, null,                                      'ground'),
  ('Jeddah',        21.4858, 39.1925, 10, null,                                      'ground'),
  ('Vienna',        48.2082, 16.3738, 11, 'Fly home from Jeddah.',                   'flight')
) as s(name, lat, lng, order_index, notes, travel_mode)
where trips.title in ('Oman', 'Arabia');

-- ── Persia (was: Baku & Tehran) ──────────────────────────────────────────
delete from stops where trip_id = (select id from trips where title in ('Baku & Tehran', 'Persia'));
insert into stops (trip_id, name, lat, lng, order_index, notes, travel_mode)
select id, s.name, s.lat, s.lng, s.order_index, s.notes, s.travel_mode::travel_mode
from trips, (values
  ('Vienna',  48.2082, 16.3738, 0, 'Home base.',              'ground'),
  ('Tbilisi', 41.7151, 44.8271, 1, 'Fly in from Vienna.',     'flight'),
  ('Baku',    40.4093, 49.8671, 2, 'Night train from Tbilisi.','ground'),
  ('Kashan',  33.9850, 51.4100, 3, null,                      'ground'),
  ('Isfahan', 32.6546, 51.6680, 4, null,                      'ground'),
  ('Yazd',    31.8974, 54.3569, 5, null,                      'ground'),
  ('Shiraz',  29.5918, 52.5837, 6, null,                      'ground'),
  ('Tehran',  35.6892, 51.3890, 7, null,                      'ground'),
  ('Vienna',  48.2082, 16.3738, 8, 'Fly home from Tehran.',   'flight')
) as s(name, lat, lng, order_index, notes, travel_mode)
where trips.title in ('Baku & Tehran', 'Persia');

-- ── Renames + descriptions ───────────────────────────────────────────────
update trips set
  title = 'Westbalkan II',
  description = 'Graz-Wildon-Šibenik-Dubrovnik-Herceg Novi-Kotor-Budva-Cetinje-Podgorica-Nikšić-Mostar-Sarajevo-Banja Luka-Wildon-Graz'
  where title in ('Balkans Road Trip', 'Westbalkan II');

update trips set
  title = 'Polska',
  description = 'Graz-Poznań-Łódź-Wrocław-Vienna-Graz'
  where title in ('Western Poland', 'Polska');

update trips set
  title = 'Transcaucasia',
  description = 'Vienna-Istanbul-Ankara-Kars-Batumi-Tbilisi-Yerevan-Vienna'
  where title in ('Turkey & the Caucasus', 'Transcaucasia');

update trips set
  title = 'Україна',
  description = 'Vienna-Lviv-Kyiv-Kharkiv-Odesa-Chișinău-Bucharest-Vienna'
  where title in ('Ukraine', 'Україна');

update trips set
  title = 'Turkestan',
  description = 'Vienna-Tbilisi-Baku-Aktau-Khiva-Bukhara-Samarkand-Tashkent-Vienna'
  where title in ('Caspian Crossing to Uzbekistan', 'Turkestan');

update trips set
  title = 'Persia',
  description = 'Vienna-Tbilisi-Baku-Kashan-Isfahan-Yazd-Shiraz-Tehran-Vienna'
  where title in ('Baku & Tehran', 'Persia');

update trips set
  title = 'Westbalkan III',
  description = 'Graz-Niš-Pristina-Skopje-Tirana-Budva-Dubrovnik-Split-Graz'
  where title in ('Balkans Road Trip II', 'Westbalkan III');

update trips set
  title = 'Bodensee',
  description = 'Vienna-Bregenz-Konstanz-St. Gallen-Zürich-Vienna'
  where title in ('Bodensee Loop', 'Bodensee');

update trips set
  title = 'Arabia',
  description = 'Vienna-Muscat-Nizwa-Jebel Akhdar-Wahiba Sands-Salalah-Abu Dhabi-Dubai-Riyadh-AlUla-Jeddah-Vienna'
  where title in ('Oman', 'Arabia');

update trips set
  title = 'Transsiberia',
  description = 'Vienna-Moscow-Yekaterinburg-Novosibirsk-Irkutsk-Ulan-Ude-Ulaanbaatar-Beijing-Shanghai-Vienna'
  where title in ('Trans-Siberian to China', 'Transsiberia');
