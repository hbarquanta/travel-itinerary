import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
}

/** Session + allowlist profile (null session = signed out, null profile = signed in but not on the allowlist).
 *  Subscribes to realtime changes on your own profile row, so a change made
 *  from the Settings panel (or another tab/device) shows up immediately —
 *  e.g. picking a new character emoji — without needing a page reload. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, profile: null })

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null

    async function fetchProfile(userId: string) {
      const { data } = await supabase!
        .from('profiles')
        .select('id, email, display_name, color, emoji, is_admin')
        .eq('id', userId)
        .maybeSingle()
      if (cancelled) return null
      return data
        ? ({
            id: data.id,
            email: data.email,
            displayName: data.display_name,
            color: data.color,
            emoji: data.emoji,
            isAdmin: data.is_admin,
          } as Profile)
        : null
    }

    async function resolve(session: Session | null) {
      channel?.unsubscribe()
      channel = null
      if (!session) {
        if (!cancelled) setState({ loading: false, session: null, profile: null })
        return
      }
      const profile = await fetchProfile(session.user.id)
      if (cancelled) return
      setState({ loading: false, session, profile })

      channel = supabase!
        .channel(`own-profile-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
          async () => {
            const updated = await fetchProfile(session.user.id)
            if (!cancelled) setState((s) => ({ ...s, profile: updated }))
          },
        )
        .subscribe()
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => resolve(session))

    return () => {
      cancelled = true
      channel?.unsubscribe()
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}
