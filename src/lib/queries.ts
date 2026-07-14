import { supabase } from './supabase'
import type { Trip, Stop, Idea, Approval, Profile, TripStatus, ApprovalKind, TripCategory, ChatMessage } from '../types'

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

interface TripRow {
  id: string
  title: string
  year: number
  year_group: string | null
  status: TripStatus
  category: TripCategory
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
  travel_mode: 'car' | 'flight'
  route_geometry: [number, number][] | null
}

interface ProfileRow {
  id: string
  email: string
  display_name: string
  color: string
  emoji: string
  is_admin: boolean
  hidden: boolean
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
  routeGeometry: row.route_geometry,
})

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  color: row.color,
  emoji: row.emoji,
  isAdmin: row.is_admin,
  hidden: row.hidden,
})

export async function fetchTrips(): Promise<Trip[]> {
  const db = client()
  const { data: tripRows, error: tripErr } = await db
    .from('trips')
    .select('id, title, year, year_group, status, category, date_start, date_end, dates_confirmed, color, description')
    .order('year', { ascending: true })
  if (tripErr) throw tripErr

  const { data: stopRows, error: stopErr } = await db
    .from('stops')
    .select('id, trip_id, name, lat, lng, order_index, notes, wiki_url, arrive, depart, travel_mode, route_geometry')
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
    yearGroup: row.year_group ?? undefined,
    status: row.status,
    category: row.category,
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
  const { data, error } = await db
    .from('profiles')
    .select('id, email, display_name, color, emoji, is_admin, hidden')
    .order('is_admin', { ascending: false })
    .order('display_name', { ascending: true })
  if (error) throw error
  return ((data ?? []) as ProfileRow[]).map(toProfile)
}

export interface RosterEntry {
  email: string
  displayName: string
  color: string
  emoji: string
  hidden: boolean
}

interface RosterRow {
  email: string
  display_name: string
  color: string
  emoji: string
  hidden: boolean
  sort_order: number
}

/** Pre-login character roster for the picker screen — no session required.
 *  Ordered explicitly by sort_order (not left to the view's own internal
 *  ORDER BY, which isn't reliably preserved once queried from outside it). */
export async function fetchRoster(): Promise<RosterEntry[]> {
  const db = client()
  const { data, error } = await db
    .from('public_roster')
    .select('email, display_name, color, emoji, hidden, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return ((data ?? []) as RosterRow[]).map((row) => ({
    email: row.email,
    displayName: row.display_name,
    color: row.color,
    emoji: row.emoji,
    hidden: row.hidden,
  }))
}

interface ParticipantRow {
  trip_id: string
  profile_id: string
}

export async function fetchParticipants(): Promise<Map<string, string[]>> {
  const db = client()
  const { data, error } = await db.from('trip_participants').select('trip_id, profile_id')
  if (error) throw error
  const byTrip = new Map<string, string[]>()
  for (const row of (data ?? []) as ParticipantRow[]) {
    if (!byTrip.has(row.trip_id)) byTrip.set(row.trip_id, [])
    byTrip.get(row.trip_id)!.push(row.profile_id)
  }
  return byTrip
}

/** Replaces a trip's participant list wholesale (delete-all-then-insert). */
export async function setTripParticipants(tripId: string, profileIds: string[]) {
  const db = client()
  const { error: delErr } = await db.from('trip_participants').delete().eq('trip_id', tripId)
  if (delErr) throw delErr
  if (profileIds.length === 0) return
  const { error: insErr } = await db
    .from('trip_participants')
    .insert(profileIds.map((profileId) => ({ trip_id: tripId, profile_id: profileId })))
  if (insErr) throw insErr
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

/** Approve a trip — a no-op (via unique constraint) if already approved. */
export async function addApproval(tripId: string, userId: string, kind: ApprovalKind) {
  const db = client()
  const { error } = await db.from('approvals').upsert(
    { trip_id: tripId, user_id: userId, kind },
    { onConflict: 'trip_id,user_id,kind', ignoreDuplicates: true },
  )
  if (error) throw error
}

/** Withdraw a previously-given approval. */
export async function removeApproval(tripId: string, userId: string, kind: ApprovalKind) {
  const db = client()
  const { error } = await db.from('approvals').delete().match({ trip_id: tripId, user_id: userId, kind })
  if (error) throw error
}

export interface NewIdea {
  title: string
  lat: number
  lng: number
  yearSuggestion: number | null
  note: string | null
  createdBy: string
}

export async function addIdea(idea: NewIdea) {
  const db = client()
  const { error } = await db.from('ideas').insert({
    title: idea.title,
    lat: idea.lat,
    lng: idea.lng,
    year_suggestion: idea.yearSuggestion,
    note: idea.note,
    created_by: idea.createdBy,
  })
  if (error) throw error
}

/** Delete an idea — RLS only allows deleting your own. */
export async function deleteIdea(id: string) {
  const db = client()
  const { error } = await db.from('ideas').delete().eq('id', id)
  if (error) throw error
}

// ── Global chat ────────────────────────────────────────────────────────

/** Kept in sync with the `char_length(body) <= 150` check constraint in
 *  schema.sql — the DB is the real enforcement, this just drives the
 *  input's maxLength/counter so people aren't surprised by a rejected send. */
export const CHAT_MESSAGE_MAX_LENGTH = 150

interface MessageRow {
  id: string
  body: string
  created_by: string
  created_at: string
}

const toChatMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  body: row.body,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

export async function fetchMessages(): Promise<ChatMessage[]> {
  const db = client()
  const { data, error } = await db
    .from('messages')
    .select('id, body, created_by, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as MessageRow[]).map(toChatMessage)
}

export async function sendMessage(body: string, createdBy: string): Promise<ChatMessage> {
  const db = client()
  const { data, error } = await db
    .from('messages')
    .insert({ body, created_by: createdBy })
    .select('id, body, created_by, created_at')
    .single()
  if (error) throw error
  return toChatMessage(data as MessageRow)
}

/** Delete a message — RLS allows your own, or any if you're admin. */
export async function deleteMessage(id: string) {
  const db = client()
  const { error } = await db.from('messages').delete().eq('id', id)
  if (error) throw error
}

// ── Admin: trip & stop CRUD (RLS restricts writes to is_admin) ────────────

export interface TripInput {
  title: string
  year: number
  yearGroup: string | null
  status: TripStatus
  category: TripCategory
  dateStart: string | null
  dateEnd: string | null
  datesConfirmed: boolean
  color: string
  description: string | null
}

export async function createTrip(input: TripInput, createdBy: string): Promise<string> {
  const db = client()
  const { data, error } = await db
    .from('trips')
    .insert({
      title: input.title,
      year: input.year,
      year_group: input.yearGroup,
      status: input.status,
      category: input.category,
      date_start: input.dateStart,
      date_end: input.dateEnd,
      dates_confirmed: input.datesConfirmed,
      color: input.color,
      description: input.description,
      created_by: createdBy,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updateTrip(id: string, input: TripInput) {
  const db = client()
  const { error } = await db
    .from('trips')
    .update({
      title: input.title,
      year: input.year,
      year_group: input.yearGroup,
      status: input.status,
      category: input.category,
      date_start: input.dateStart,
      date_end: input.dateEnd,
      dates_confirmed: input.datesConfirmed,
      color: input.color,
      description: input.description,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTrip(id: string) {
  const db = client()
  const { error } = await db.from('trips').delete().eq('id', id)
  if (error) throw error
}

export interface StopInput {
  tripId: string
  name: string
  lat: number
  lng: number
  orderIndex: number
  notes: string | null
  wikiUrl: string | null
  travelMode: 'car' | 'flight'
  routeGeometry?: [number, number][] | null
}

export async function createStop(input: StopInput): Promise<string> {
  const db = client()
  const { data, error } = await db
    .from('stops')
    .insert({
      trip_id: input.tripId,
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      order_index: input.orderIndex,
      notes: input.notes,
      wiki_url: input.wikiUrl,
      travel_mode: input.travelMode,
      route_geometry: input.routeGeometry ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updateStop(id: string, input: Omit<StopInput, 'tripId'>) {
  const db = client()
  const { error } = await db
    .from('stops')
    .update({
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      order_index: input.orderIndex,
      notes: input.notes,
      wiki_url: input.wikiUrl,
      travel_mode: input.travelMode,
      route_geometry: input.routeGeometry ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteStop(id: string) {
  const db = client()
  const { error } = await db.from('stops').delete().eq('id', id)
  if (error) throw error
}
