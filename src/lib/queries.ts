import { supabase } from './supabase'
import type { Trip, Stop, Idea, Approval, Profile, TripStatus, ApprovalKind } from '../types'

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

interface TripRow {
  id: string
  title: string
  year: number
  status: TripStatus
  date_start: string | null
  date_end: string | null
  dates_confirmed: boolean
  color: string
  description: string | null
}

interface StopRow {
  id: string
  trip_id: string
  name: string
  lat: number
  lng: number
  order_index: number
  notes: string | null
  wiki_url: string | null
  arrive: string | null
  depart: string | null
  travel_mode: 'ground' | 'flight'
}

interface ProfileRow {
  id: string
  email: string
  display_name: string
  color: string
  emoji: string
  is_admin: boolean
}

interface ApprovalRow {
  id: string
  trip_id: string
  user_id: string
  kind: ApprovalKind
}

interface IdeaRow {
  id: string
  title: string
  lat: number
  lng: number
  year_suggestion: number | null
  note: string | null
  created_by: string
}

const toStop = (row: StopRow): Stop => ({
  id: row.id,
  tripId: row.trip_id,
  name: row.name,
  lat: row.lat,
  lng: row.lng,
  orderIndex: row.order_index,
  notes: row.notes,
  wikiUrl: row.wiki_url,
  arrive: row.arrive,
  depart: row.depart,
  travelMode: row.travel_mode,
})

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  color: row.color,
  emoji: row.emoji,
  isAdmin: row.is_admin,
})

export async function fetchTrips(): Promise<Trip[]> {
  const db = client()
  const { data: tripRows, error: tripErr } = await db
    .from('trips')
    .select('id, title, year, status, date_start, date_end, dates_confirmed, color, description')
    .order('year', { ascending: true })
  if (tripErr) throw tripErr

  const { data: stopRows, error: stopErr } = await db
    .from('stops')
    .select('id, trip_id, name, lat, lng, order_index, notes, wiki_url, arrive, depart, travel_mode')
    .order('order_index', { ascending: true })
  if (stopErr) throw stopErr

  const stopsByTrip = new Map<string, Stop[]>()
  for (const row of (stopRows ?? []) as StopRow[]) {
    const stop = toStop(row)
    if (!stopsByTrip.has(stop.tripId)) stopsByTrip.set(stop.tripId, [])
    stopsByTrip.get(stop.tripId)!.push(stop)
  }

  return ((tripRows ?? []) as TripRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    year: row.year,
    status: row.status,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    datesConfirmed: row.dates_confirmed,
    color: row.color,
    description: row.description,
    stops: stopsByTrip.get(row.id) ?? [],
  }))
}

export async function fetchProfiles(): Promise<Profile[]> {
  const db = client()
  const { data, error } = await db.from('profiles').select('id, email, display_name, color, emoji, is_admin')
  if (error) throw error
  return ((data ?? []) as ProfileRow[]).map(toProfile)
}

export async function fetchApprovals(): Promise<Approval[]> {
  const db = client()
  const { data, error } = await db.from('approvals').select('id, trip_id, user_id, kind')
  if (error) throw error
  return ((data ?? []) as ApprovalRow[]).map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    kind: row.kind,
  }))
}

export async function fetchIdeas(): Promise<Idea[]> {
  const db = client()
  const { data, error } = await db.from('ideas').select('id, title, lat, lng, year_suggestion, note, created_by')
  if (error) throw error
  return ((data ?? []) as IdeaRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    lat: row.lat,
    lng: row.lng,
    yearSuggestion: row.year_suggestion,
    note: row.note,
    createdBy: row.created_by,
  }))
}
