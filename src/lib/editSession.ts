// Admin trip-editing session: the single source of truth driving both
// AdminTripPanel (the form) and MapView (draggable stop markers) while a
// trip is being created or edited. Nothing here is persisted until
// saveEditSession() is called.

import type { Trip, TripStatus, TripCategory, Idea } from '../types'
import { createTrip, updateTrip, createStop, updateStop, deleteStop, deleteIdea, setTripParticipants } from './queries'

export interface EditStop {
  localId: string
  /** Set once the stop exists in the database; absent for stops added this session. */
  id?: string
  name: string
  lat: number
  lng: number
  notes: string
  wikiUrl: string
  travelMode: 'ground' | 'flight'
  /** Precomputed incoming road route; cleared when the stop is dragged to a
   *  new position since the old path no longer starts/ends in the right place. */
  routeGeometry?: [number, number][] | null
}

export interface EditSession {
  /** Null while creating a brand-new trip. */
  tripId: string | null
  /** Set when this session started from "promote idea to trip" — deletes the idea on save. */
  promotingIdeaId: string | null
  title: string
  year: number
  /** Overrides the chip/grouping label (e.g. '2030+'); blank means "just show the year". */
  yearGroup: string
  status: TripStatus
  category: TripCategory
  color: string
  dateStart: string
  dateEnd: string
  datesConfirmed: boolean
  description: string
  stops: EditStop[]
  deletedStopIds: string[]
  /** Character ids actually on this trip — distinct from approvals. */
  participantIds: string[]
}

const PALETTE = ['#fbbf24', '#f472b6', '#2dd4bf', '#a78bfa', '#fb7185', '#38bdf8', '#34d399', '#c084fc', '#67e8f9', '#facc15']

export function nextPaletteColor(existingColors: string[]): string {
  const used = new Set(existingColors)
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

let localIdCounter = 0
export function makeLocalId(): string {
  localIdCounter += 1
  return `local-${Date.now()}-${localIdCounter}`
}

export function newEditSession(
  existingColors: string[],
  defaultYear: number,
  initialParticipantIds: string[] = [],
): EditSession {
  return {
    tripId: null,
    promotingIdeaId: null,
    title: '',
    year: defaultYear,
    yearGroup: '',
    status: 'planned',
    category: 'Friends',
    color: nextPaletteColor(existingColors),
    dateStart: '',
    dateEnd: '',
    datesConfirmed: false,
    description: '',
    stops: [],
    deletedStopIds: [],
    participantIds: initialParticipantIds,
  }
}

export function editSessionFromTrip(trip: Trip, participantIds: string[]): EditSession {
  return {
    tripId: trip.id,
    promotingIdeaId: null,
    title: trip.title,
    year: trip.year,
    yearGroup: trip.yearGroup ?? '',
    status: trip.status,
    category: trip.category,
    color: trip.color,
    dateStart: trip.dateStart ?? '',
    dateEnd: trip.dateEnd ?? '',
    datesConfirmed: trip.datesConfirmed,
    description: trip.description ?? '',
    stops: [...trip.stops]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        localId: makeLocalId(),
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        notes: s.notes ?? '',
        wikiUrl: s.wikiUrl ?? '',
        travelMode: s.travelMode ?? 'ground',
        routeGeometry: s.routeGeometry ?? null,
      })),
    deletedStopIds: [],
    participantIds,
  }
}

export function editSessionFromIdea(
  idea: Idea,
  existingColors: string[],
  fallbackYear: number,
  initialParticipantIds: string[] = [],
): EditSession {
  return {
    tripId: null,
    promotingIdeaId: idea.id,
    title: idea.title,
    year: idea.yearSuggestion ?? fallbackYear,
    yearGroup: '',
    status: 'planned',
    category: 'Friends',
    color: nextPaletteColor(existingColors),
    dateStart: '',
    dateEnd: '',
    datesConfirmed: false,
    description: idea.note ?? '',
    stops: [
      {
        localId: makeLocalId(),
        name: idea.title,
        lat: idea.lat,
        lng: idea.lng,
        notes: '',
        wikiUrl: '',
        travelMode: 'ground',
      },
    ],
    deletedStopIds: [],
    participantIds: initialParticipantIds,
  }
}

/** Commits a session: creates/updates the trip, diffs stops, and (if this
 *  came from "promote idea") deletes the original idea. One button press,
 *  one batch of writes — realtime picks up the result for everyone. */
export async function saveEditSession(session: EditSession, userId: string): Promise<void> {
  const tripInput = {
    title: session.title.trim(),
    year: session.year,
    yearGroup: session.yearGroup.trim() || null,
    status: session.status,
    category: session.category,
    dateStart: session.dateStart || null,
    dateEnd: session.dateEnd || null,
    datesConfirmed: session.datesConfirmed,
    color: session.color,
    description: session.description.trim() || null,
  }

  const tripId = session.tripId ?? (await createTrip(tripInput, userId))
  if (session.tripId) await updateTrip(session.tripId, tripInput)

  await Promise.all([
    ...session.deletedStopIds.map((id) => deleteStop(id)),
    setTripParticipants(tripId, session.participantIds),
  ])

  await Promise.all(
    session.stops.map((stop, index) => {
      const stopInput = {
        tripId,
        name: stop.name.trim() || `Stop ${index + 1}`,
        lat: stop.lat,
        lng: stop.lng,
        orderIndex: index,
        notes: stop.notes.trim() || null,
        wikiUrl: stop.wikiUrl.trim() || null,
        travelMode: stop.travelMode,
        routeGeometry: stop.routeGeometry ?? null,
      }
      return stop.id ? updateStop(stop.id, stopInput) : createStop(stopInput)
    }),
  )

  if (session.promotingIdeaId) await deleteIdea(session.promotingIdeaId)
}
