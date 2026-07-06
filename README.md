# Atlas — Shared Travel Map

A shared world map for five friends: all planned journeys as glowing routes
on a dark map, filterable by year, with idea pins and approvals. Built with
Vite + React + TypeScript, MapLibre GL (OpenFreeMap tiles), and — from
Phase 3 on — Supabase. Hosted on GitHub Pages. Always free, no server.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/travel-itinerary/ (note the `/travel-itinerary/`
base path — it matches the GitHub Pages URL).

Current state: **Phase 1** — visual skeleton with placeholder trips from
[src/data/placeholder.ts](src/data/placeholder.ts). No backend yet; auth,
realtime, ideas and approvals arrive in Phases 3–4 (see `PROJECT_BRIEF.md`).

## Stack

- **Map:** [MapLibre GL JS](https://maplibre.org/) with
  [OpenFreeMap](https://openfreemap.org/) dark vector tiles (no API key).
- **App:** Vite + React + TypeScript, hand-rolled CSS (no framework).
- **Data (coming):** Supabase free tier — Postgres + RLS + magic-link auth.
- **Hosting (coming):** GitHub Pages via GitHub Actions.
