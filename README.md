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
   for local dev, and the GitHub Pages URL once deployed.
5. Add the same two `VITE_SUPABASE_*` values as GitHub Actions repo secrets
   so the deployed build can reach Supabase.
6. If a friend's real email isn't `@example.com` yet, edit the `insert into
   allowed_users (...)` block in `supabase/schema.sql` and re-run the file.

Restart `npm run dev` after creating `.env.local` — the app then requires a
magic-link sign-in and reads/writes real data with realtime updates.

## Stack

- **Map:** [MapLibre GL JS](https://maplibre.org/) with
  [OpenFreeMap](https://openfreemap.org/) dark vector tiles (no API key).
- **App:** Vite + React + TypeScript, hand-rolled CSS (no framework).
- **Data:** Supabase free tier — Postgres + RLS + magic-link auth + realtime.
- **Hosting (coming):** GitHub Pages via GitHub Actions.
