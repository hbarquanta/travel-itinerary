# Atlas — Shared Travel Map

A shared world map for five friends: all planned journeys as glowing routes
on a dark map, filterable by year and category, with idea pins and
approvals. Built with Vite + React + TypeScript, MapLibre GL (OpenFreeMap
tiles), and Supabase. Hosted on GitHub Pages. Always free, no server.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/travel-itinerary/ (note the `/travel-itinerary/`
base path — it matches the GitHub Pages URL).

Without a `.env.local`, the app runs in **local demo mode**: no login, data
comes from [src/data/placeholder.ts](src/data/placeholder.ts). Once Supabase
is wired up (below), it switches to real data + character login automatically.

## Connecting Supabase (Fabian — one-time setup)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, paste and run the whole of
   [supabase/schema.sql](supabase/schema.sql). It creates the tables, RLS
   policies, and seeds the character roster. Re-running it later (e.g. after
   editing a row in the `allowed_users` block) is safe.
3. Copy `.env.example` to `.env.local` and fill in the two values from
   *Project Settings → API*:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Add the same two `VITE_SUPABASE_*` values as GitHub Actions repo secrets
   (*Settings → Secrets and variables → Actions → New repository secret*) —
   the deployed build needs them at build time, same as `.env.local` locally.
5. Sign in once (so your `profiles` row exists — see "Character accounts"
   below for how login actually works), then run
   [supabase/friends_trips.sql](supabase/friends_trips.sql) and
   [supabase/solo_trips.sql](supabase/solo_trips.sql) **once each** in the
   SQL editor to load the group's actual trip data. Unlike `schema.sql`
   these are **not** idempotent — running them twice creates duplicate
   trips. From then on, use the in-app admin trip editor to add/change trips
   instead. (This step is moot for the already-running app — both files are
   a record of one-time inserts that have already been applied; they're only
   relevant if you're ever setting up a brand-new Supabase project from
   scratch.)

Restart `npm run dev` after creating `.env.local` — the app then requires
picking a character + PIN and reads/writes real data with realtime updates.

## Character accounts (Fabian — one-time setup)

Login isn't email-based — you pick your character from a roster and type a
short PIN. Under the hood each character is still a real Supabase Auth
account (the PIN is just that account's password), so every existing RLS
policy keeps working unchanged; only the login screen is different.

1. *Authentication → Providers → Email*: turn **off** "Confirm email" and
   **off** "Allow new user signups" — nobody signs up publicly, only you
   create accounts, from here on.
2. *Authentication → Policies* (or Providers → Email, depending on your
   Supabase version): lower **Minimum password length** to 6, so 6-digit
   PINs are accepted.
3. *Authentication → Users → Add user*, once per friend (Dominik, Florian,
   Mateo, Michael) plus one `Test` account for your own testing: email = the
   matching `@atlas.internal` address from `allowed_users` in
   `supabase/schema.sql`, password = their 6-digit PIN, **Auto Confirm
   User** checked.
4. Set a password on your own existing account (same real email — this
   keeps your user id/profile/`created_by` references intact). Use the
   dashboard's user-edit screen if it exposes a password field; otherwise
   run `supabase.auth.admin.updateUserById(id, { password })` once locally
   with the service-role key (never commit that key anywhere).
5. If you add/rename a friend later, edit the matching row in
   `allowed_users` in `supabase/schema.sql` and re-run the file — the
   picker's roster comes live from that table (via the `public_roster`
   view), no redeploy needed.

Consider giving your own account (and the `Test` account) a longer password
than the friends' PINs — a compromised admin account can write/delete
everything, so it's worth the extra length.

## Deploying (Fabian — one-time setup)

1. *Settings → Pages* → under **Build and deployment**, set Source to
   **GitHub Actions** (not "Deploy from a branch").
2. Make sure the two `VITE_SUPABASE_*` repo secrets from step 4 above are
   set — the [deploy workflow](.github/workflows/deploy.yml) needs them.
3. Push to `main` (or run the workflow manually from the Actions tab). It
   builds the app and publishes `dist/` to GitHub Pages automatically from
   then on, on every push.

## Stack

- **Map:** [MapLibre GL JS](https://maplibre.org/) with
  [OpenFreeMap](https://openfreemap.org/) dark vector tiles (no API key).
- **App:** Vite + React + TypeScript, hand-rolled CSS (no framework).
- **Data:** Supabase free tier — Postgres + RLS + character/PIN auth + realtime.
- **Hosting:** GitHub Pages via GitHub Actions
  ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).
