# Atlas — Shared Travel Map

A shared world map for five friends: all planned journeys as glowing routes
on a dark map, filterable by year, with idea pins and approvals. Built with
Vite + React + TypeScript, MapLibre GL (OpenFreeMap tiles), and Supabase.
Hosted on GitHub Pages. Always free, no server.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/travel-itinerary/ (note the `/travel-itinerary/`
base path — it matches the GitHub Pages URL).

Without a `.env.local`, the app runs in **local demo mode**: no login, data
comes from [src/data/placeholder.ts](src/data/placeholder.ts). Once Supabase
is wired up (below), it switches to real data + magic-link auth automatically.

## Connecting Supabase (Fabian — one-time setup)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, paste and run the whole of
   [supabase/schema.sql](supabase/schema.sql). It creates the tables, RLS
   policies, and seeds the 5-person allowlist. Re-running it later (e.g.
   after editing an email in the allowlist block) is safe.
3. Copy `.env.example` to `.env.local` and fill in the two values from
   *Project Settings → API*:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. In *Authentication → URL Configuration*, set the Site URL (and a redirect
   URL) to wherever the app is served — `http://localhost:5173/travel-itinerary/`
   for local dev, and the GitHub Pages URL once deployed (see below).
5. Add the same two `VITE_SUPABASE_*` values as GitHub Actions repo secrets
   (*Settings → Secrets and variables → Actions → New repository secret*) —
   the deployed build needs them at build time, same as `.env.local` locally.
6. If a friend's real email isn't `@example.com` yet, edit the `insert into
   allowed_users (...)` block in `supabase/schema.sql` and re-run the file.
7. Sign in once via the magic link (so your `profiles` row exists), then run
   [supabase/seed.sql](supabase/seed.sql) **once** in the SQL editor to load
   the group's actual trip data. Unlike `schema.sql` this is **not**
   idempotent — running it twice creates duplicate trips. From then on, use
   the in-app admin trip editor to add/change trips instead.

Restart `npm run dev` after creating `.env.local` — the app then requires a
magic-link sign-in and reads/writes real data with realtime updates.

## Deploying (Fabian — one-time setup)

1. *Settings → Pages* → under **Build and deployment**, set Source to
   **GitHub Actions** (not "Deploy from a branch").
2. Make sure the two `VITE_SUPABASE_*` repo secrets from step 5 above are
   set — the [deploy workflow](.github/workflows/deploy.yml) needs them.
3. Push to `main` (or run the workflow manually from the Actions tab). It
   builds the app and publishes `dist/` to GitHub Pages automatically from
   then on, on every push.
4. Once it's deployed, go back to Supabase *Authentication → URL
   Configuration* and add the GitHub Pages URL as a Site URL / redirect URL
   (step 4 above) — magic links won't redirect correctly without this.

## Stack

- **Map:** [MapLibre GL JS](https://maplibre.org/) with
  [OpenFreeMap](https://openfreemap.org/) dark vector tiles (no API key).
- **App:** Vite + React + TypeScript, hand-rolled CSS (no framework).
- **Data:** Supabase free tier — Postgres + RLS + magic-link auth + realtime.
- **Hosting:** GitHub Pages via GitHub Actions
  ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).
