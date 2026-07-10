import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection, Point } from 'geojson'
import type { Trip, Idea } from '../types'
import { yearGroupOf } from '../types'
import { tripRouteSegments, concatSegments, topmostPoint, sliceCoordinates, coordsLengthKm, type LngLat } from '../lib/geo'
import type { EditStop } from '../lib/editSession'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const DRAW_IN_MS = 4000

interface MapViewProps {
  trips: Trip[]
  activeYears: Set<string>
  activeCategories: Set<string>
  hoveredTripId: string | null
  onHoverTrip: (tripId: string | null) => void
  /** Bump `nonce` to fly to a trip even if the id is unchanged. */
  focus: { tripId: string; nonce: number } | null
  /** Extra right padding for fit-to-bounds while the sidebar is open. */
  sidebarPadding: number
  ideas: Idea[]
  ideaAuthors: Map<string, string>
  /** While true, clicking the map drops a ghost pin instead of panning/selecting. */
  addIdeaMode: boolean
  onMapClickForIdea: (lat: number, lng: number) => void
  pendingIdeaLocation: { lat: number; lng: number } | null
  /** Admin trip-editing stops (draggable) — null when no trip is being edited. */
  editStops: EditStop[] | null
  onAddEditStop: (lat: number, lng: number) => void
  onDragEditStop: (localId: string, lat: number, lng: number) => void
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function ideaPopupHtml(idea: Idea, color: string): string {
  return `
    <div class="stop-popup" style="--trip-color:${esc(color)}">
      <div class="stop-popup-name">${esc(idea.title)}</div>
      ${idea.yearSuggestion ? `<div class="stop-popup-dates">${idea.yearSuggestion}?</div>` : ''}
      ${idea.note ? `<div class="stop-popup-notes">${esc(idea.note)}</div>` : ''}
    </div>`
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
  yearGroup: string
  category: string
  color: string
  mode: 'flight' | 'ground'
  coords: LngLat[]
}

/** One draw-in animation per trip: a single ratio sweeping the whole
 *  journey start-to-end, with each leg's share proportional to its real
 *  distance so the "pen" moves at roughly constant speed. Stops reveal
 *  as the pen passes their position, rather than all at once. */
interface TripAnim {
  ratio: number
  totalLength: number
  segments: { id: string; length: number; cumulative: number }[]
  /** stop.id -> cumulative distance from the trip's first stop. */
  stopPositions: Map<string, number>
}

function buildStopsData(trips: Trip[], tripAnims: Map<string, TripAnim>): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: trips.flatMap((t) => {
      const anim = tripAnims.get(t.id)
      return t.stops.map((s) => {
        const pos = anim?.stopPositions.get(s.id) ?? 0
        const revealed = !anim || anim.totalLength <= 0 || pos <= anim.ratio * anim.totalLength ? 1 : 0
        return {
          type: 'Feature' as const,
          properties: {
            tripId: t.id,
            yearGroup: yearGroupOf(t),
            category: t.category,
            color: t.color,
            name: s.name,
            notes: s.notes ?? '',
            wikiUrl: s.wikiUrl ?? '',
            arrive: s.arrive ?? '',
            depart: s.depart ?? '',
            revealed,
          },
          geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
        }
      })
    }),
  }
}

function segmentRatioFor(anim: TripAnim | undefined, segId: string): number {
  if (!anim || anim.totalLength <= 0) return 1
  const segMeta = anim.segments.find((s) => s.id === segId)
  if (!segMeta) return 1
  const target = anim.ratio * anim.totalLength
  if (segMeta.cumulative + segMeta.length <= target) return 1
  if (segMeta.cumulative >= target) return 0
  return (target - segMeta.cumulative) / segMeta.length
}

function segmentsFeatureCollection(
  segments: SegmentMeta[],
  mode: 'flight' | 'ground',
  tripAnims: Map<string, TripAnim>,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: segments
      .filter((s) => s.mode === mode)
      .map((s) => ({
        type: 'Feature',
        properties: { tripId: s.tripId, yearGroup: s.yearGroup, category: s.category, color: s.color },
        geometry: {
          type: 'LineString',
          coordinates: sliceCoordinates(s.coords, segmentRatioFor(tripAnims.get(s.tripId), s.id)),
        },
      })),
  }
}

/** Builds segments + per-trip draw-in animations from a trips list,
 *  carrying over each trip's existing ratio (if any) so unrelated data
 *  refreshes (e.g. someone else approving a trip) don't replay the
 *  draw-in animation for routes that are already fully drawn. */
function buildSegmentsAndAnims(trips: Trip[], previous: Map<string, TripAnim>) {
  const tripFullCoords = new Map<string, LngLat[]>()
  const allSegments: SegmentMeta[] = []
  const anims = new Map<string, TripAnim>()

  for (const trip of trips) {
    if (trip.stops.length < 2) continue
    const sortedStops = [...trip.stops].sort((a, b) => a.orderIndex - b.orderIndex)
    const segs = tripRouteSegments(trip.stops)
    tripFullCoords.set(trip.id, concatSegments(segs))

    let cumulative = 0
    const segMetaList: TripAnim['segments'] = []
    const stopPositions = new Map<string, number>()
    stopPositions.set(sortedStops[0].id, 0)
    segs.forEach((seg, i) => {
      const id = `${trip.id}-${i}`
      const length = coordsLengthKm(seg.coords) || 0.001
      segMetaList.push({ id, length, cumulative })
      cumulative += length
      stopPositions.set(sortedStops[i + 1].id, cumulative)
      allSegments.push({
        id,
        tripId: trip.id,
        yearGroup: yearGroupOf(trip),
        category: trip.category,
        color: trip.color,
        mode: seg.mode,
        coords: seg.coords,
      })
    })
    const ratio = previous.get(trip.id)?.ratio ?? 0
    anims.set(trip.id, { ratio, totalLength: cumulative, segments: segMetaList, stopPositions })
  }

  return { tripFullCoords, allSegments, anims }
}

// Rotating dash pattern that makes routes feel like they're flowing.
const DASH_STEPS: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
  [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
]

export default function MapView({
  trips,
  activeYears,
  activeCategories,
  hoveredTripId,
  onHoverTrip,
  focus,
  sidebarPadding,
  ideas,
  ideaAuthors,
  addIdeaMode,
  onMapClickForIdea,
  pendingIdeaLocation,
  editStops,
  onAddEditStop,
  onDragEditStop,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const badgeMarkers = useRef<Map<string, maplibregl.Marker>>(new Map())
  const ideaMarkers = useRef<Map<string, maplibregl.Marker>>(new Map())
  const ghostMarker = useRef<maplibregl.Marker | null>(null)
  const editStopMarkers = useRef<Map<string, maplibregl.Marker>>(new Map())
  const segmentsRef = useRef<SegmentMeta[]>([])
  const tripAnimsRef = useRef<Map<string, TripAnim>>(new Map())
  const prevVisible = useRef<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  // Keep latest values available to map event handlers without re-binding.
  const hoverCb = useRef(onHoverTrip)
  hoverCb.current = onHoverTrip
  const addIdeaCb = useRef(onMapClickForIdea)
  addIdeaCb.current = onMapClickForIdea
  const addIdeaModeRef = useRef(addIdeaMode)
  addIdeaModeRef.current = addIdeaMode
  const editStopsCb = useRef(onAddEditStop)
  editStopsCb.current = onAddEditStop
  const dragEditCb = useRef(onDragEditStop)
  dragEditCb.current = onDragEditStop
  const isEditingRef = useRef(false)
  isEditingRef.current = editStops !== null
  const tripsRef = useRef(trips)
  tripsRef.current = trips

  // Create the map once: empty sources, layers, listeners, and the rAF loop.
  // Actual trip data is populated by the effect below, which re-runs
  // whenever `trips` changes (not just on mount).
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

    map.on('load', () => {
      const empty: FeatureCollection = { type: 'FeatureCollection', features: [] }
      map.addSource('routes', { type: 'geojson', data: empty })
      map.addSource('flights', { type: 'geojson', data: empty })
      map.addSource('stops', { type: 'geojson', data: empty })

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
          'circle-radius': ['case', ['==', ['get', 'revealed'], 1], 11, 0],
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
          'circle-radius': ['case', ['==', ['get', 'revealed'], 1], 4.5, 0],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['case', ['==', ['get', 'revealed'], 1], 1.5, 0],
        },
      })

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
        if (addIdeaModeRef.current || isEditingRef.current) return
        const f = e.features?.[0]
        if (!f) return
        const [lng, lat] = (f.geometry as Point).coordinates
        new maplibregl.Popup({ closeButton: false, offset: 14, maxWidth: '280px' })
          .setLngLat([lng, lat])
          .setHTML(popupHtml(f.properties as Record<string, string>))
          .addTo(map)
        map.easeTo({ center: [lng, lat], duration: 800 })
      })

      // Add-idea mode: any map click drops a pending idea at that point.
      // Admin edit mode: any map click appends a new stop to the trip being edited.
      map.on('click', (e) => {
        if (addIdeaModeRef.current) addIdeaCb.current(e.lngLat.lat, e.lngLat.lng)
        else if (isEditingRef.current) editStopsCb.current(e.lngLat.lat, e.lngLat.lng)
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
          const pulseRadius = 11 + Math.sin(pulsePhase / 480) * 2.2
          map.setPaintProperty('stop-glow', 'circle-radius', [
            'case',
            ['==', ['get', 'revealed'], 1],
            pulseRadius,
            0,
          ])
        }

        let drawChanged = false
        for (const anim of tripAnimsRef.current.values()) {
          if (anim.ratio < 1) {
            anim.ratio = Math.min(1, anim.ratio + dt / DRAW_IN_MS)
            drawChanged = true
          }
        }
        if (drawChanged) {
          const routesSrc = map.getSource('routes') as maplibregl.GeoJSONSource | undefined
          const flightsSrc = map.getSource('flights') as maplibregl.GeoJSONSource | undefined
          const stopsSrc = map.getSource('stops') as maplibregl.GeoJSONSource | undefined
          routesSrc?.setData(segmentsFeatureCollection(segmentsRef.current, 'ground', tripAnimsRef.current))
          flightsSrc?.setData(segmentsFeatureCollection(segmentsRef.current, 'flight', tripAnimsRef.current))
          stopsSrc?.setData(buildStopsData(tripsRef.current, tripAnimsRef.current))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rebuild segments/anims/sources/badges whenever the trips list changes —
  // not just on mount — so a newly created or edited trip actually shows up
  // without a page reload. Existing trips keep their current draw-in ratio.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    const { tripFullCoords, allSegments, anims } = buildSegmentsAndAnims(trips, tripAnimsRef.current)
    segmentsRef.current = allSegments
    tripAnimsRef.current = anims

    const routesSrc = map.getSource('routes') as maplibregl.GeoJSONSource | undefined
    const flightsSrc = map.getSource('flights') as maplibregl.GeoJSONSource | undefined
    const stopsSrc = map.getSource('stops') as maplibregl.GeoJSONSource | undefined
    routesSrc?.setData(segmentsFeatureCollection(allSegments, 'ground', anims))
    flightsSrc?.setData(segmentsFeatureCollection(allSegments, 'flight', anims))
    stopsSrc?.setData(buildStopsData(trips, anims))

    badgeMarkers.current.forEach((m) => m.remove())
    badgeMarkers.current.clear()
    for (const trip of trips) {
      if (trip.stops.length < 2) continue
      const el = document.createElement('div')
      el.className = 'year-badge'
      el.textContent = yearGroupOf(trip)
      el.style.setProperty('--trip-color', trip.color)
      el.addEventListener('mouseenter', () => hoverCb.current(trip.id))
      el.addEventListener('mouseleave', () => hoverCb.current(null))
      const marker = new maplibregl.Marker({ element: el, anchor: 'center', offset: [0, -18] })
        .setLngLat(topmostPoint(tripFullCoords.get(trip.id) ?? []))
        .addTo(map)
      badgeMarkers.current.set(trip.id, marker)
    }
  }, [trips, ready])

  // Year + category filter + draw-in trigger for newly-visible trips + fit bounds.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const isVisible = (t: Trip) => activeYears.has(yearGroupOf(t)) && activeCategories.has(t.category)
    const groups = [...activeYears]
    const categories = [...activeCategories]
    const filter: maplibregl.FilterSpecification = [
      'all',
      ['in', ['get', 'yearGroup'], ['literal', groups]],
      ['in', ['get', 'category'], ['literal', categories]],
    ]
    for (const layer of ['route-glow', 'route-line', 'route-flow', 'flight-glow', 'flight-line', 'stop-glow', 'stop-core']) {
      map.setFilter(layer, filter)
    }
    for (const trip of trips) {
      const marker = badgeMarkers.current.get(trip.id)
      if (marker) marker.getElement().classList.toggle('hidden', !isVisible(trip))
    }

    const visibleIds = new Set(trips.filter(isVisible).map((t) => t.id))
    for (const [tripId, anim] of tripAnimsRef.current) {
      if (visibleIds.has(tripId) && !prevVisible.current.has(tripId)) anim.ratio = 0
    }
    prevVisible.current = visibleIds

    const visible = trips.filter(isVisible)
    if (visible.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    for (const t of visible) for (const s of t.stops) bounds.extend([s.lng, s.lat])
    map.fitBounds(bounds, {
      padding: { top: 110, bottom: 80, left: 80, right: 80 + sidebarPadding },
      duration: 1400,
      maxZoom: 5.5,
    })
  }, [activeYears, activeCategories, trips, ready, sidebarPadding])

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

  // Idea pins: ghost/dashed markers in the author's color, rebuilt when the list changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    ideaMarkers.current.forEach((m) => m.remove())
    ideaMarkers.current.clear()
    for (const idea of ideas) {
      const color = ideaAuthors.get(idea.createdBy) ?? '#8b93a7'
      const el = document.createElement('div')
      el.className = 'idea-marker'
      el.style.setProperty('--trip-color', color)
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: '260px' })
          .setLngLat([idea.lng, idea.lat])
          .setHTML(ideaPopupHtml(idea, color))
          .addTo(map)
      })
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([idea.lng, idea.lat]).addTo(map)
      ideaMarkers.current.set(idea.id, marker)
    }
  }, [ideas, ideaAuthors, ready])

  // Ghost pin while an idea is pending (map clicked, form not yet submitted).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (!pendingIdeaLocation) {
      ghostMarker.current?.remove()
      ghostMarker.current = null
      return
    }
    const el = document.createElement('div')
    el.className = 'ghost-pin'
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([pendingIdeaLocation.lng, pendingIdeaLocation.lat])
      .addTo(map)
    ghostMarker.current?.remove()
    ghostMarker.current = marker
    return () => {
      marker.remove()
    }
  }, [pendingIdeaLocation, ready])

  // Draggable stop markers for the trip currently being admin-edited. Keyed
  // off positions only (not every text-field keystroke) so typing in the
  // panel doesn't rebuild markers mid-drag.
  const editStopsPositionKey = useMemo(
    () => editStops?.map((s) => `${s.localId}:${s.lat.toFixed(6)}:${s.lng.toFixed(6)}`).join('|') ?? '',
    [editStops],
  )
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    editStopMarkers.current.forEach((m) => m.remove())
    editStopMarkers.current.clear()
    if (!editStops) return
    for (const stop of editStops) {
      const el = document.createElement('div')
      el.className = 'edit-stop-marker'
      const marker = new maplibregl.Marker({ element: el, anchor: 'center', draggable: true })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map)
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLngLat()
        dragEditCb.current(stop.localId, lat, lng)
      })
      editStopMarkers.current.set(stop.localId, marker)
    }
    return () => {
      editStopMarkers.current.forEach((m) => m.remove())
      editStopMarkers.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStopsPositionKey, ready])

  // Add-idea / admin-edit mode: hint clickability with a crosshair cursor.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.getCanvas().style.cursor = addIdeaMode || editStops !== null ? 'crosshair' : ''
  }, [addIdeaMode, editStops, ready])

  return (
    <>
      <div ref={containerRef} className="map-root" />
      <div className={`loading-veil${ready ? ' done' : ''}`}>
        <div className="loading-globe">🧭</div>
        <p>Charting the atlas…</p>
      </div>
      {ready && (activeYears.size === 0 || activeCategories.size === 0) && (
        <div className="empty-state glass">
          <p>No trips selected</p>
          <span>Toggle a year or category above to see the trips.</span>
        </div>
      )}
    </>
  )
}
