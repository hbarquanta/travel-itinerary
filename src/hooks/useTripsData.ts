import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchTrips, fetchApprovals, fetchProfiles } from '../lib/queries'
import type { Trip, Approval, Profile } from '../types'

/** Live trips/approvals/members from Supabase, refetched on any realtime change. */
export function useTripsData() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    Promise.all([fetchTrips(), fetchApprovals(), fetchProfiles()]).then(([t, a, p]) => {
      setTrips(t)
      setApprovals(a)
      setMembers(p)
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
      .subscribe()
    return () => {
      db.removeChannel(channel)
    }
  }, [reload])

  return { trips, approvals, members, loading }
}
