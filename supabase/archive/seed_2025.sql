-- Adds the 2025 Balkans trip on top of the existing seed. Run this ONCE —
-- like seed.sql, it is not idempotent (re-running duplicates the trip).
-- Does not touch or re-run supabase/seed.sql.

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

  insert into trips (title, year, status, dates_confirmed, color, description, created_by)
  values ('Balkans Road Trip', 2025, 'past', true, '#f59e0b',
    'Dalmatian coast down through Montenegro into Bosnia — Graz to Šibenik, Dubrovnik, the Bay of Kotor, Podgorica, Nikšić, Mostar, Sarajevo, Banja Luka and back.',
    admin_id)
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
    -- NOTE: one stop between Podgorica and Nikšić ("carls bridge niksic")
    -- wasn't clear enough to place confidently — add it via the map-click
    -- flow in the trip editor, or tell Claude the name and it'll be added.
    (trip_id, 'Nikšić', 42.7731, 18.9500, 9, null),
    (trip_id, 'Mostar', 43.3438, 17.8078, 10, null),
    (trip_id, 'Sarajevo', 43.8563, 18.4131, 11, null),
    (trip_id, 'Banja Luka', 44.7722, 17.1910, 12, null),
    (trip_id, 'Wildon', 46.8886, 15.5211, 13, 'On the way home.'),
    (trip_id, 'Graz', 47.0707, 15.4395, 14, null);

end $$;
