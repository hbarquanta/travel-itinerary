import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
}

/** Session + allowlist profile (null session = signed out, null profile = signed in but not on the allowlist). */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, profile: null })

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    async function resolve(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ loading: false, session: null, profile: null })
        return
      }
      const { data } = await supabase!
        .from('profiles')
        .select('id, email, display_name, color, emoji, is_admin')
        .eq('id', session.user.id)
        .maybeSingle()
      if (cancelled) return
      setState({
        loading: false,
        session,
        profile: data
          ? {
              id: data.id,
              email: data.email,
              displayName: data.display_name,
              color: data.color,
              emoji: data.emoji,
              isAdmin: data.is_admin,
            }
          : null,
      })
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => resolve(session))

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}
