-- One-time trip data corrections, discussed 2026-07-10.
--
-- ALREADY APPLIED (2026-07-13) — run directly via the REST API using the
-- Test admin account rather than pasted into the SQL editor, once that
-- account was promoted to is_admin. Kept here as a record of what changed
-- and why; do NOT re-run this file, it is not idempotent (the DELETEs and
-- stop rebuilds would duplicate/error on a second run).

-- 2025: give it a color that isn't so close to 2026's amber (#fbbf24).
update trips set color = '#ef4444' where id = '2fa04399-a7a3-4d99-bc7e-6f663ccff54d'; -- Balkans Road Trip

-- 2026 "Western Poland": reorder into a single loop out of and back to
-- Graz, matching the confirmed route (Graz -> Poznan -> Lodz -> Wroclaw
-- (Breslau) -> Vienna -> Graz).
delete from stops where trip_id = '3d3f9ef2-e0fc-40b2-b9d8-056cace68c75';
insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
  ('3d3f9ef2-e0fc-40b2-b9d8-056cace68c75', 'Graz',    47.0707, 15.4395, 0, 'ground'),
  ('3d3f9ef2-e0fc-40b2-b9d8-056cace68c75', 'Poznań',  52.4064, 16.9252, 1, 'ground'),
  ('3d3f9ef2-e0fc-40b2-b9d8-056cace68c75', 'Łódź',    51.7592, 19.4560, 2, 'ground'),
  ('3d3f9ef2-e0fc-40b2-b9d8-056cace68c75', 'Wrocław', 51.1079, 17.0385, 3, 'ground'),
  ('3d3f9ef2-e0fc-40b2-b9d8-056cace68c75', 'Vienna',  48.2082, 16.3738, 4, 'ground'),
  ('3d3f9ef2-e0fc-40b2-b9d8-056cace68c75', 'Graz',    47.0707, 15.4395, 5, 'ground');

-- 2027 "Turkey & the Caucasus" (the Georgia trip) — confirmed as-is, no change.

-- Delete the "Israel" trip — confirmed test data (note the lowercase city
-- names and leftover "Stop 9" placeholder). Cascades to its stops.
delete from trips where id = 'fdc18fe0-759e-4220-994a-5035052c987e';

-- The Ukraine trip (Vienna -> Lviv -> Kyiv -> Kharkiv) was tagged 2029 but
-- is actually the 2028 trip; the Caspian-crossing-to-Uzbekistan trip (via
-- Tbilisi + Baku) was tagged 2028 but is actually the "other Caspian sea
-- crossing" option for 2029 (Baku & Tehran, already correctly at 2030+,
-- covers the Tehran/Persia option discussed for the same year). Swapping
-- both years, and completing the Ukraine loop with Odesa + a return to
-- Vienna.
update trips set year = 2028, title = 'Ukraine'
  where id = 'beeb09f3-2835-45a7-8e1a-2591ab9d709f';
update trips set year = 2029
  where id = 'fad9087f-0417-4df2-b49b-d025c576fa44'; -- Caspian Crossing to Uzbekistan

insert into stops (trip_id, name, lat, lng, order_index, travel_mode) values
  ('beeb09f3-2835-45a7-8e1a-2591ab9d709f', 'Odesa',  46.4825, 30.7233, 4, 'ground'),
  ('beeb09f3-2835-45a7-8e1a-2591ab9d709f', 'Vienna', 48.2082, 16.3738, 5, 'ground');
