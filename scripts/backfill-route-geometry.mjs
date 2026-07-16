#!/usr/bin/env node
// Fetches real routes for every `car`/`train`-mode leg that doesn't already
// have one, and stores the resulting path on the destination stop's
// `route_geometry` column (see supabase/schema.sql).
//
// - `car` legs: OSRM's free public driving-routing API (road network).
// - `train` legs: Transitous (transitous.org), a free pan-European public-
//   transit journey planner (MOTIS engine, crowd-sourced GTFS). It returns
//   an actual itinerary with per-leg polylines that follow real rail
//   tracks — not a road-network proxy. We query it with the two stops'
//   coordinates, pick the itinerary that best matches "mostly rail, fewest
//   transfers", and stitch together all of its legs' geometry (including
//   the short walk/tram legs at each end getting to/from the station).
//   If Transitous has no usable route (e.g. it's not a real transit
//   corridor, or coverage gap), falls back to the OSRM road proxy with a
//   warning so the leg can be checked/hand-fixed.
// `ferry`/`flight` legs are left alone (no road/rail exists to route across).
//
// Uses `overview=simplified` for OSRM (not `full`) — full returns one point
// per underlying road-network node, which for a long route is tens of
// thousands of points and visibly lags the draw-in animation; simplified
// keeps the real shape at a much lower, render-appropriate point count.
//
// Safe to re-run — by default it only fills in legs still missing a
// route. Pass FORCE=1 to re-fetch and overwrite legs that already have one
// (e.g. to replace old OSRM-proxy train geometry with real Transitous rail
// geometry now that this script supports it).
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

// Transitous requires a descriptive User-Agent identifying the app + contact.
const TRANSITOUS_HEADERS = { 'User-Agent': 'Atlas (travel-itinerary map, fabian.joebstl@gmail.com)' }

// OTP2/MOTIS transit-mode names that represent an actual train, as opposed
// to WALK/BUS/COACH/TRAM/SUBWAY/FERRY/etc. Used to score itineraries so we
// pick the one that's "really the train", not a bus-replacement service.
const RAIL_MODES = new Set(['RAIL', 'HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL', 'REGIONAL_FAST_RAIL', 'REGIONAL_RAIL'])

// Decodes a Google-style encoded polyline at the given decimal precision
// (Transitous/MOTIS uses precision 7, not the more common 5) into [lng,lat] pairs.
function decodePolyline(encoded, precision = 7) {
  const factor = 10 ** precision
  let index = 0
  let lat = 0
  let lng = 0
  const coords = []
  while (index < encoded.length) {
    for (const key of ['lat', 'lng']) {
      let shift = 0
      let result = 0
      let byte
      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (key === 'lat') lat += delta
      else lng += delta
    }
    coords.push([lng / factor, lat / factor])
  }
  return coords
}

// Queries Transitous for a journey between two coordinates and returns a
// stitched [lng,lat][] path following the best-matching itinerary's real
// transit-network geometry, or null if no itinerary is usable.
async function fetchTransitousRoute(from, to) {
  const url =
    `https://api.transitous.org/api/v1/plan?fromPlace=${from.lat},${from.lng}` +
    `&toPlace=${to.lat},${to.lng}&numItineraries=5`
  const res = await fetch(url, { headers: TRANSITOUS_HEADERS }).then((r) => r.json())
  const itineraries = res?.itineraries
  if (!itineraries || itineraries.length === 0) return null

  // Prefer the itinerary whose travel time is most dominated by real rail
  // legs (HIGHSPEED_RAIL/LONG_DISTANCE/REGIONAL_RAIL/etc, not bus/coach
  // replacement or subway connectors) — this reliably picks "the train
  // route", including which real border crossing/pass it uses, over
  // options with more transfers/connectors but the same core rail leg.
  const legDuration = (l) =>
    typeof l.duration === 'number' ? l.duration : (new Date(l.endTime) - new Date(l.startTime)) / 1000
  const scored = itineraries.map((it) => {
    const total = it.legs.reduce((s, l) => s + legDuration(l), 0)
    const rail = it.legs.filter((l) => RAIL_MODES.has(l.mode)).reduce((s, l) => s + legDuration(l), 0)
    return { it, railFraction: total > 0 ? rail / total : 0, transfers: it.transfers ?? 0 }
  })
  scored.sort((a, b) => b.railFraction - a.railFraction || a.transfers - b.transfers)
  const best = scored[0].it
  if (scored[0].railFraction === 0) {
    // No itinerary has any real train leg at all — not a rail corridor / no coverage.
    return null
  }

  const coords = []
  for (const leg of best.legs) {
    const points = leg?.legGeometry?.points
    if (!points) continue
    const precision = leg.legGeometry.precision ?? 7
    coords.push(...decodePolyline(points, precision))
  }
  return coords.length > 1 ? coords : null
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

      let coords = null
      let source = 'osrm'

      if (to.travel_mode === 'train') {
        try {
          coords = await fetchTransitousRoute(from, to)
          if (coords) source = 'transitous'
        } catch (err) {
          console.log(`  warn  ${trip.title}: ${from.name} -> ${to.name} (Transitous error: ${err.message})`)
        }
        // Be polite to the free public Transitous instance.
        await new Promise((r) => setTimeout(r, 600))
      }

      if (!coords) {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=simplified&geometries=geojson`
        const res = await fetch(url).then((r) => r.json())
        coords = res?.routes?.[0]?.geometry?.coordinates
        source = 'osrm-fallback'
        // Be polite to the free public OSRM demo server.
        await new Promise((r) => setTimeout(r, 600))
      }

      if (!coords || coords.length < 2) {
        console.log(`  skip  ${trip.title}: ${from.name} -> ${to.name} (no route found, e.g. a sea crossing)`)
        skipped++
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/stops?id=eq.${to.id}`, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ route_geometry: coords }),
        })
        const tag = to.travel_mode === 'train' && source !== 'transitous' ? ' — no rail route, used road proxy, check manually' : ''
        console.log(`  route ${trip.title}: ${from.name} -> ${to.name} (${coords.length} points, ${source})${tag}`)
        routed++
      }
    }
  }

  console.log(`\nDone. Routed ${routed}, skipped ${skipped} (no road), already had a route ${alreadyDone}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
