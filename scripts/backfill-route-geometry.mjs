#!/usr/bin/env node
// Fetches real road routes (via OSRM's free public routing API) for every
// `car`/`train`-mode leg that doesn't already have one, and stores the
// resulting path on the destination stop's `route_geometry` column (see
// supabase/schema.sql). `train` legs use this as a *shape proxy* — rail
// corridors mostly follow the same valleys/passes as roads, so it beats a
// straight line — but a specific well-documented train route (e.g. a
// named express with known stations) should be hand-overridden with a
// more accurate polyline rather than relying on this generic pass.
// `ferry`/`flight` legs are left alone (no road exists to route across).
//
// Uses `overview=simplified` (not `full`) — full returns one point per
// underlying road-network node, which for a long route is tens of
// thousands of points and visibly lags the draw-in animation; simplified
// keeps the real shape at a much lower, render-appropriate point count.
//
// Safe to re-run — by default it only fills in legs still missing a
// route. Pass FORCE=1 to re-fetch and overwrite legs that already have one
// (e.g. after this simplification fix, to replace the old full-detail data).
//
// Requires an admin account. Reads credentials from env vars so nothing
// sensitive is hardcoded here:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY   (already in .env.local)
//   ADMIN_EMAIL, ADMIN_PASSWORD                 (pass at invocation time)
//
// Usage:
//   ADMIN_EMAIL=test@atlas.internal ADMIN_PASSWORD=<pin> node scripts/backfill-route-geometry.mjs
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... FORCE=1 node scripts/backfill-route-geometry.mjs

import { readFileSync } from 'node:fs'

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {
    // .env.local not present — rely on already-exported env vars.
  }
}
loadEnvLocal()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const FORCE = process.env.FORCE === '1'

if (!SUPABASE_URL || !ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing SUPABASE_URL/ANON_KEY (from .env.local) or ADMIN_EMAIL/ADMIN_PASSWORD (env vars).')
  process.exit(1)
}

async function main() {
  const tokenResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  }).then((r) => r.json())
  const accessToken = tokenResp.access_token
  if (!accessToken) throw new Error('Login failed: ' + JSON.stringify(tokenResp))

  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` }
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' }

  const trips = await fetch(`${SUPABASE_URL}/rest/v1/trips?select=id,title`, { headers }).then((r) => r.json())
  const stops = await fetch(
    `${SUPABASE_URL}/rest/v1/stops?select=id,trip_id,name,lat,lng,order_index,travel_mode,route_geometry&order=order_index`,
    { headers },
  ).then((r) => r.json())

  let routed = 0
  let skipped = 0
  let alreadyDone = 0

  for (const trip of trips) {
    const tripStops = stops.filter((s) => s.trip_id === trip.id).sort((a, b) => a.order_index - b.order_index)
    for (let i = 0; i < tripStops.length - 1; i++) {
      const from = tripStops[i]
      const to = tripStops[i + 1]
      if (to.travel_mode !== 'car' && to.travel_mode !== 'train') continue
      if (!FORCE && to.route_geometry && to.route_geometry.length > 1) {
        alreadyDone++
        continue
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=simplified&geometries=geojson`
      const res = await fetch(url).then((r) => r.json())
      const coords = res?.routes?.[0]?.geometry?.coordinates
      if (!coords || coords.length < 2) {
        console.log(`  skip  ${trip.title}: ${from.name} -> ${to.name} (no road route, e.g. a sea crossing)`)
        skipped++
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/stops?id=eq.${to.id}`, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ route_geometry: coords }),
        })
        console.log(`  route ${trip.title}: ${from.name} -> ${to.name} (${coords.length} points)`)
        routed++
      }
      // Be polite to the free public OSRM demo server.
      await new Promise((r) => setTimeout(r, 600))
    }
  }

  console.log(`\nDone. Routed ${routed}, skipped ${skipped} (no road), already had a route ${alreadyDone}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
