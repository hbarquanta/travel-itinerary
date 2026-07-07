import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchTrips, fetchApprovals, fetchProfiles, fetchIdeas } from '../lib/queries'
import type { Trip, Approval, Profile, Idea } from '../types'

/** Live trips/approvals/members/ideas from Supabase, refetched on any realtime change. */
export function useTripsData() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    Promise.all([fetchTrips(), fetchApprovals(), fetchProfiles(), fetchIdeas()]).then(([t, a, p, i]) => {
      setTrips(t)
      setApprovals(a)
      setMembers(p)
      setIdeas(i)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const db = supabase
    if (!db) return
    reload()
    const channel = db
      .channel('atlas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, reload)
      .subscribe()
    return () => {
      db.removeChannel(channel)
    }
  }, [reload])

  return { trips, approvals, members, ideas, loading, refetch: reload }
}
