import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchRoster, type RosterEntry } from '../lib/queries'

/** Set by an admin's "reveal hidden characters" button in Settings so the
 *  next time the picker renders (after signing out), hidden entries like
 *  Test show up too. Session-only — clears itself once the tab closes. */
export const REVEAL_HIDDEN_KEY = 'atlas-reveal-hidden'

export default function Login() {
  const [roster, setRoster] = useState<RosterEntry[] | null>(null)
  const [rosterError, setRosterError] = useState(false)
  const [selected, setSelected] = useState<RosterEntry | null>(null)
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle')

  useEffect(() => {
    fetchRoster()
      .then(setRoster)
      .catch(() => setRosterError(true))
  }, [])

  const revealHidden = sessionStorage.getItem(REVEAL_HIDDEN_KEY) === '1'
  const visibleRoster = (roster ?? []).filter((entry) => !entry.hidden || revealHidden)

  function pickCharacter(entry: RosterEntry) {
    setSelected(entry)
    setPin('')
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !selected) return
    setStatus('checking')
    const { error } = await supabase.auth.signInWithPassword({ email: selected.email, password: pin })
    setStatus(error ? 'error' : 'idle')
  }

  return (
    <div className="login-screen">
      <div className="login-card glass">
        <span className="brand-mark">🧭</span>
        <h1>Atlas</h1>

        {!selected ? (
          <>
            <p>Who are you?</p>
            {rosterError && <p className="login-error">Couldn't load the roster — try refreshing.</p>}
            <div className="roster-grid">
              {visibleRoster.map((entry) => (
                <button
                  key={entry.email}
                  type="button"
                  className="roster-btn"
                  style={{ '--avatar-color': entry.color } as React.CSSProperties}
                  onClick={() => pickCharacter(entry)}
                >
                  <span className="roster-emoji">{entry.emoji}</span>
                  <span className="roster-name">{entry.displayName}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>
              Enter {selected.displayName}'s PIN <span className="roster-emoji">{selected.emoji}</span>
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                required
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={status === 'checking'}
              />
              <button type="submit" disabled={status === 'checking' || !pin}>
                {status === 'checking' ? 'Checking…' : 'Enter'}
              </button>
              <button type="button" className="login-back" onClick={() => setSelected(null)}>
                ‹ Not {selected.displayName}?
              </button>
            </form>
            {status === 'error' && <p className="login-error">Wrong PIN — try again.</p>}
          </>
        )}
      </div>
    </div>
  )
}
