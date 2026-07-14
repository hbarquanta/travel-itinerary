One-time SQL scripts that have already been run against the live database.
Kept as a record of what changed and why — **do not re-run any of these**;
several are explicitly not idempotent and would duplicate or corrupt data.

- `seed.sql` — original trip data load (2026-07-07).
- `seed_2025.sql` — added the 2025 Balkans trip on top of the above.
- `update_2026_2029_trips.sql` — one-off corrections applied 2026-07-13.
- `streamline_descriptions.sql` — trip renames, hyphen-listing descriptions,
  and the Arabia/Persia route rebuilds, applied 2026-07-14.

`../schema.sql` is the only file in this directory tree meant to be re-run —
it's the living schema and is kept idempotent on purpose.
