import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchTrips, fetchApprovals, fetchProfiles, fetchIdeas, fetchParticipants } from '../lib/queries'
import type { Trip, Approval, Profile, Idea } from '../types'

/** Live trips/approvals/members/ideas/participants from Supabase, refetched on any
 *  realtime change. `ready` should reflect "a real, allowlisted session exists" —
 *  without it, the very first fetch (which fires as soon as this hook mounts, before
 *  login) runs as an anonymous request, gets RLS-filtered down to empty arrays, and
 *  then never refetches once you actually sign in. */
export function useTripsData(ready: boolean) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [participants, setParticipants] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    Promise.all([fetchTrips(), fetchApprovals(), fetchProfiles(), fetchIdeas(), fetchParticipants()]).then(
      ([t, a, p, i, participantsByTrip]) => {
        setTrips(t)
        setApprovals(a)
        setMembers(p)
        setIdeas(i)
        setParticipants(participantsByTrip)
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    const db = supabase
    if (!db || !ready) return
    setLoading(true)
    reload()
    const channel = db
      .channel('atlas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_participants' }, reload)
      .subscribe()
    return () => {
      db.removeChannel(channel)
    }
  }, [reload, ready])

  return { trips, approvals, members, ideas, participants, loading, refetch: reload }
}
