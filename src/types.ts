// Domain types mirroring supabase/schema.sql (Phase 3 will swap the
// placeholder JSON for real queries; keep these in sync with the schema).

export type TripStatus = 'idea' | 'planned' | 'locked' | 'past'
export type ApprovalKind = 'trip' | 'dates'

export interface Profile {
  id: string
  email: string
  displayName: string
  color: string
  emoji: string
  isAdmin: boolean
}

export interface Stop {
  id: string
  tripId: string
  name: string
  lat: number
  lng: number
  orderIndex: number
  notes?: string | null
  wikiUrl?: string | null
  arrive?: string | null
  depart?: string | null
  /** How you arrive here from the previous stop; defaults to 'ground'. */
  travelMode?: 'flight' | 'ground'
}

export interface Trip {
  id: string
  title: string
  year: number
  status: TripStatus
  dateStart?: string | null
  dateEnd?: string | null
  datesConfirmed: boolean
  color: string
  description?: string | null
  stops: Stop[]
  /**
   * Overrides the year chip/grouping label for open-ended trips (e.g.
   * '2030+') without a fixed year. `year` still holds a real number for
   * chronological sorting; this is purely a display/grouping override.
   */
  yearGroup?: string
}

/** The chip/sidebar grouping label for a trip: its yearGroup override, or its year. */
export function yearGroupOf(trip: Trip): string {
  return trip.yearGroup ?? String(trip.year)
}

export interface Approval {
  id: string
  tripId: string
  userId: string
  kind: ApprovalKind
}

export interface Idea {
  id: string
  title: string
  lat: number
  lng: number
  yearSuggestion?: number | null
  note?: string | null
  createdBy: string
}
