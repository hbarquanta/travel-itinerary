import type { Stop } from '../types'

export type LngLat = [number, number]

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/**
 * Points along the great-circle arc from `a` to `b` (both [lng, lat]),
 * inclusive of the endpoints.
 */
export function greatCircleArc(a: LngLat, b: LngLat, steps = 64): LngLat[] {
  const [lng1, lat1] = [rad(a[0]), rad(a[1])]
  const [lng2, lat2] = [rad(b[0]), rad(b[1])]

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
      ),
    )
  if (d < 1e-9) return [a, b]

  const points: LngLat[] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    points.push([deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.sqrt(x * x + y * y)))])
  }
  return points
}

export interface RouteSegment {
  mode: 'flight' | 'ground'
  coords: LngLat[]
}

/**
 * A flight leg is drawn as a smooth curved arc, bowed toward higher
 * latitude (like a conventional flight-path graphic), rather than the
 * great-circle curve used for ground travel — dashed styling in MapView
 * is what actually distinguishes "we flew here" from "we took a
 * train/road here"; this curve just gives it a plane-like sweep.
 */
export function flightPath(a: LngLat, b: LngLat, steps = 64): LngLat[] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dist = Math.hypot(dx, dy) || 1e-6
  let px = -dy / dist
  let py = dx / dist
  if (py < 0) {
    px = -px
    py = -py
  }
  const bump = dist * 0.13
  const ctrl: LngLat = [(a[0] + b[0]) / 2 + px * bump, (a[1] + b[1]) / 2 + py * bump]

  const points: LngLat[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    points.push([
      mt * mt * a[0] + 2 * mt * t * ctrl[0] + t * t * b[0],
      mt * mt * a[1] + 2 * mt * t * ctrl[1] + t * t * b[1],
    ])
  }
  return points
}

/**
 * Per-leg route segments for a trip: a real road route when precomputed
 * (`to.routeGeometry` — see supabase/schema.sql and the routing backfill
 * script), a great-circle curve as the ground-travel fallback, or a bowed
 * flight curve when the destination stop's `travelMode` is 'flight'.
 * Longitudes are unwrapped across the whole sequence so segments never
 * jump across the antimeridian.
 */
export function tripRouteSegments(stops: Stop[], stepsPerLeg = 48): RouteSegment[] {
  const ordered = [...stops].sort((x, y) => x.orderIndex - y.orderIndex)
  const segments: RouteSegment[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i]
    const to = ordered[i + 1]
    const a: LngLat = [from.lng, from.lat]
    const b: LngLat = [to.lng, to.lat]
    const mode: 'flight' | 'ground' = to.travelMode === 'flight' ? 'flight' : 'ground'
    let coords: LngLat[]
    if (mode === 'flight') {
      coords = flightPath(a, b)
    } else if (to.routeGeometry && to.routeGeometry.length > 1) {
      coords = to.routeGeometry
    } else {
      coords = greatCircleArc(a, b, stepsPerLeg)
    }
    segments.push({ mode, coords })
  }

  // Unwrap longitudes across the whole trip so segments joined end-to-end
  // never jump across the antimeridian.
  let prevLng: number | null = null
  for (const seg of segments) {
    for (let i = 0; i < seg.coords.length; i++) {
      let [lng, lat] = seg.coords[i]
      if (prevLng !== null) {
        while (lng - prevLng > 180) lng -= 360
        while (lng - prevLng < -180) lng += 360
      }
      seg.coords[i] = [lng, lat]
      prevLng = lng
    }
  }
  return segments
}

/** Flattens ordered route segments into one coordinate list. */
export function concatSegments(segments: RouteSegment[]): LngLat[] {
  const out: LngLat[] = []
  for (const seg of segments) out.push(...seg.coords)
  return out
}

/**
 * The northernmost (highest-latitude) point of a route — used to place the
 * year badge near the top of the trip's visual footprint on the map,
 * rather than at its geometric midpoint (which can land anywhere,
 * including empty ocean, depending on the route's shape).
 */
export function topmostPoint(coords: LngLat[]): LngLat {
  if (coords.length === 0) return [0, 0]
  return coords.reduce((top, p) => (p[1] > top[1] ? p : top), coords[0])
}

/** Approximate great-circle length of a coordinate list, in kilometres. */
export function coordsLengthKm(coords: LngLat[]): number {
  const R = 6371
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = rad(lat2 - lat1)
    const dLng = rad(lng2 - lng1)
    const h =
      Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
    total += 2 * R * Math.asin(Math.sqrt(h))
  }
  return total
}

/**
 * Truncates a route to the first `ratio` (0–1) of its points, interpolating
 * the cut point so the line grows smoothly frame to frame. Used for the
 * route "draw-in" reveal animation.
 */
export function sliceCoordinates(coords: LngLat[], ratio: number): LngLat[] {
  if (coords.length === 0) return coords
  if (ratio >= 1) return coords
  if (ratio <= 0) return [coords[0]]
  const idx = ratio * (coords.length - 1)
  const i = Math.floor(idx)
  const frac = idx - i
  const sliced = coords.slice(0, i + 1)
  if (i < coords.length - 1) {
    const [lng1, lat1] = coords[i]
    const [lng2, lat2] = coords[i + 1]
    sliced.push([lng1 + (lng2 - lng1) * frac, lat1 + (lat2 - lat1) * frac])
  }
  return sliced
}
