import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection, Point } from 'geojson'
import type { Trip } from '../types'
import { tripRouteSegments, concatSegments, routeMidpoint, sliceCoordinates, type LngLat } from '../lib/geo'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const DRAW_IN_MS = 2000

interface MapViewProps {
  trips: Trip[]
  activeYears: Set<number>
  hoveredTripId: string | null
  onHoverTrip: (tripId: string | null) => void
  /** Bump `nonce` to fly to a trip even if the id is unchanged. */
  focus: { tripId: string; nonce: number } | null
  /** Extra right padding for fit-to-bounds while the sidebar is open. */
  sidebarPadding: number
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function popupHtml(p: Record<string, string>): string {
  let dates = ''
  if (p.arrive && p.depart) dates = `${fmtDate(p.arrive)} → ${fmtDate(p.depart)}`
  else if (p.arrive) dates = fmtDate(p.arrive)
  return `
    <div class="stop-popup" style="--trip-color:${esc(p.color)}">
      <div class="stop-popup-name">${esc(p.name)}</div>
      ${dates ? `<div class="stop-popup-dates">${esc(dates)}</div>` : ''}
      ${p.notes ? `<div class="stop-popup-notes">${esc(p.notes)}</div>` : ''}
      ${p.wikiUrl ? `<a class="stop-popup-wiki" href="${esc(p.wikiUrl)}" target="_blank" rel="noreferrer">Wikipedia ↗</a>` : ''}
    </div>`
}

interface SegmentMeta {
  id: string
  tripId: string
  year: number
  color: string
  mode: 'flight' | 'ground'
  coords: LngLat[]
}

function buildStopsData(trips: Trip[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: trips.flatMap((t) =>
      t.stops.map((s) => ({
        type: 'Feature' as const,
        properties: {
          tripId: t.id,
          year: t.year,
          color: t.color,
          name: s.name,
          notes: s.notes ?? '',
          wikiUrl: s.wikiUrl ?? '',
          arrive: s.arrive ?? '',
          depart: s.depart ?? '',
        },
        geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
      })),
    ),
  }
}

function segmentsDataAtRatios(
  segments: SegmentMeta[],
  mode: 'flight' | 'ground',
  ratios: Map<string, number>,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: segments
      .filter((s) => s.mode === mode)
      .map((s) => ({
        type: 'Feature',
        properties: { tripId: s.tripId, year: s.year, color: s.color },
        geometry: { type: 'LineString', coordinates: sliceCoordinates(s.coords, ratios.get(s.id) ?? 1) },
      })),
  }
}

// Rotating dash pattern that makes routes feel like they're flowing.
const DASH_STEPS: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
  [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
]

export default function MapView({
  trips,
  activeYears,
  hoveredTripId,
  onHoverTrip,
  focus,
  sidebarPadding,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const badgeMarkers = useRef<Map<string, maplibregl.Marker>>(new Map())
  const segmentsRef = useRef<SegmentMeta[]>([])
  const drawRatios = useRef<Map<string, number>>(new Map())
  const prevVisible = useRef<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  // Keep latest values available to map event handlers without re-binding.
  const hoverCb = useRef(onHoverTrip)
  hoverCb.current = onHoverTrip

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [20, 28],
      zoom: 1.7,
      attributionControl: { compact: true },
    })
    mapRef.current = map

    const tripFullCoords = new Map<string, LngLat[]>()
    const allSegments: SegmentMeta[] = []
    for (const trip of trips) {
      if (trip.stops.length < 2) continue
      const segs = tripRouteSegments(trip.stops)
      tripFullCoords.set(trip.id, concatSegments(segs))
      segs.forEach((seg, i) => {
        allSegments.push({
          id: `${trip.id}-${i}`,
          tripId: trip.id,
          year: trip.year,
          color: trip.color,
          mode: seg.mode,
          coords: seg.coords,
        })
      })
    }
    segmentsRef.current = allSegments
    drawRatios.current = new Map(allSegments.map((s) => [s.id, 0]))

    map.on('load', () => {
      map.addSource('routes', { type: 'geojson', data: segmentsDataAtRatios(segmentsRef.current, 'ground', drawRatios.current) })
      map.addSource('flights', { type: 'geojson', data: segmentsDataAtRatios(segmentsRef.current, 'flight', drawRatios.current) })
      map.addSource('stops', { type: 'geojson', data: buildStopsData(trips) })

      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 9,
          'line-blur': 8,
          'line-opacity': 0.45,
        },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.4,
          'line-opacity': 0.95,
        },
      })
      map.addLayer({
        id: 'route-flow',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.6,
          'line-opacity': 0.5,
          'line-dasharray': DASH_STEPS[0],
        },
      })
      map.addLayer({
        id: 'flight-glow',
        type: 'line',
        source: 'flights',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 6,
          'line-blur': 6,
          'line-opacity': 0.28,
        },
      })
      map.addLayer({
        id: 'flight-line',
        type: 'line',
        source: 'flights',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.9,
          'line-dasharray': [2.2, 2.2],
        },
      })
      map.addLayer({
        id: 'stop-glow',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 11,
          'circle-blur': 1.1,
          'circle-opacity': 0.6,
        },
      })
      map.addLayer({
        id: 'stop-core',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 4.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      })

      // Year badges as HTML markers at each route's midpoint.
      for (const trip of trips) {
        if (trip.stops.length < 2) continue
        const el = document.createElement('div')
        el.className = 'year-badge'
        el.textContent = String(trip.year)
        el.style.setProperty('--trip-color', trip.color)
        el.addEventListener('mouseenter', () => hoverCb.current(trip.id))
        el.addEventListener('mouseleave', () => hoverCb.current(null))
        const marker = new maplibregl.Marker({ element: el, anchor: 'center', offset: [0, -18] })
          .setLngLat(routeMidpoint(tripFullCoords.get(trip.id) ?? []))
          .addTo(map)
        badgeMarkers.current.set(trip.id, marker)
      }

      // Hover: highlight the whole trip, dim the rest.
      for (const layer of ['route-line', 'flight-line', 'stop-core'] as const) {
        map.on('mousemove', layer, (e) => {
          const tripId = e.features?.[0]?.properties?.tripId as string | undefined
          hoverCb.current(tripId ?? null)
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          hoverCb.current(null)
          map.getCanvas().style.cursor = ''
        })
      }

      map.on('click', 'stop-core', (e) => {
        const f = e.features?.[0]
        if (!f) return
        const [lng, lat] = (f.geometry as Point).coordinates
        new maplibregl.Popup({ closeButton: false, offset: 14, maxWidth: '280px' })
          .setLngLat([lng, lat])
          .setHTML(popupHtml(f.properties as Record<string, string>))
          .addTo(map)
        map.easeTo({ center: [lng, lat], duration: 800 })
      })

      // Single rAF loop: flowing route dashes, pin pulse, and route draw-in.
      let dashStep = 0
      let lastDashTs = 0
      let lastTs = 0
      let pulsePhase = 0
      const animate = (ts: number) => {
        if (!mapRef.current) return
        const dt = lastTs ? ts - lastTs : 16
        lastTs = ts

        if (ts - lastDashTs > 90) {
          dashStep = (dashStep + 1) % DASH_STEPS.length
          if (map.getLayer('route-flow')) {
            map.setPaintProperty('route-flow', 'line-dasharray', DASH_STEPS[dashStep])
          }
          lastDashTs = ts
        }

        pulsePhase += dt
        if (map.getLayer('stop-glow')) {
          map.setPaintProperty('stop-glow', 'circle-radius', 11 + Math.sin(pulsePhase / 480) * 2.2)
        }

        let drawChanged = false
        for (const seg of segmentsRef.current) {
          const ratio = drawRatios.current.get(seg.id) ?? 1
          if (ratio < 1) {
            drawRatios.current.set(seg.id, Math.min(1, ratio + dt / DRAW_IN_MS))
            drawChanged = true
          }
        }
        if (drawChanged) {
          const routesSrc = map.getSource('routes') as maplibregl.GeoJSONSource | undefined
          const flightsSrc = map.getSource('flights') as maplibregl.GeoJSONSource | undefined
          routesSrc?.setData(segmentsDataAtRatios(segmentsRef.current, 'ground', drawRatios.current))
          flightsSrc?.setData(segmentsDataAtRatios(segmentsRef.current, 'flight', drawRatios.current))
        }

        requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)

      setReady(true)
    })

    return () => {
      badgeMarkers.current.forEach((m) => m.remove())
      badgeMarkers.current.clear()
      mapRef.current = null
      setReady(false)
      map.remove()
    }
    // Trips are static placeholder data in Phase 1; the map is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Year filter + draw-in trigger for newly-visible trips + fit bounds.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const years = [...activeYears]
    const filter: maplibregl.FilterSpecification = ['in', ['get', 'year'], ['literal', years]]
    for (const layer of ['route-glow', 'route-line', 'route-flow', 'flight-glow', 'flight-line', 'stop-glow', 'stop-core']) {
      map.setFilter(layer, filter)
    }
    for (const trip of trips) {
      const marker = badgeMarkers.current.get(trip.id)
      if (marker) marker.getElement().classList.toggle('hidden', !activeYears.has(trip.year))
    }

    const visibleIds = new Set(trips.filter((t) => activeYears.has(t.year)).map((t) => t.id))
    for (const seg of segmentsRef.current) {
      if (visibleIds.has(seg.tripId) && !prevVisible.current.has(seg.tripId)) drawRatios.current.set(seg.id, 0)
    }
    prevVisible.current = visibleIds

    const visible = trips.filter((t) => activeYears.has(t.year))
    if (visible.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    for (const t of visible) for (const s of t.stops) bounds.extend([s.lng, s.lat])
    map.fitBounds(bounds, {
      padding: { top: 110, bottom: 80, left: 80, right: 80 + sidebarPadding },
      duration: 1400,
      maxZoom: 5.5,
    })
  }, [activeYears, trips, ready, sidebarPadding])

  // Hover highlighting: dim everything that isn't the hovered trip.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const h = hoveredTripId
    const pick = (on: number, off: number, base: number) =>
      h === null
        ? base
        : (['case', ['==', ['get', 'tripId'], h], on, off] as unknown as number)
    map.setPaintProperty('route-glow', 'line-opacity', pick(0.8, 0.1, 0.45))
    map.setPaintProperty('route-line', 'line-opacity', pick(1, 0.18, 0.95))
    map.setPaintProperty('route-flow', 'line-opacity', pick(0.75, 0.05, 0.5))
    map.setPaintProperty('flight-glow', 'line-opacity', pick(0.55, 0.06, 0.28))
    map.setPaintProperty('flight-line', 'line-opacity', pick(1, 0.15, 0.9))
    map.setPaintProperty('stop-glow', 'circle-opacity', pick(0.85, 0.12, 0.6))
    map.setPaintProperty('stop-core', 'circle-opacity', pick(1, 0.2, 1))
    map.setPaintProperty('stop-core', 'circle-stroke-opacity', pick(1, 0.2, 1))
    map.setPaintProperty('route-line', 'line-width', pick(3.2, 2.4, 2.4))
    for (const trip of trips) {
      const el = badgeMarkers.current.get(trip.id)?.getElement()
      if (el) {
        el.classList.toggle('dimmed', h !== null && h !== trip.id)
        el.classList.toggle('lit', h === trip.id)
      }
    }
  }, [hoveredTripId, trips, ready])

  // Fly to a trip when the sidebar asks for it.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !focus) return
    const trip = trips.find((t) => t.id === focus.tripId)
    if (!trip || trip.stops.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    for (const s of trip.stops) bounds.extend([s.lng, s.lat])
    map.fitBounds(bounds, {
      padding: { top: 120, bottom: 90, left: 100, right: 100 + sidebarPadding },
      duration: 1800,
      maxZoom: 6.5,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, ready])

  return (
    <>
      <div ref={containerRef} className="map-root" />
      <div className={`loading-veil${ready ? ' done' : ''}`}>
        <div className="loading-globe">🧭</div>
        <p>Charting the atlas…</p>
      </div>
      {ready && activeYears.size === 0 && (
        <div className="empty-state glass">
          <p>No years selected</p>
          <span>Toggle a year above to see the trips.</span>
        </div>
      )}
    </>
  )
}
