import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { REVEAL_HIDDEN_KEY } from './Login'
import type { Profile } from '../types'
import { CharacterIcon, CHARACTER_ICON_COLORS, CloseIcon, SunIcon, MoonIcon, CheckIcon } from './icons'

interface SettingsPanelProps {
  currentUser: Profile
  /** Everyone's current profile, so already-taken emoji can be shown as such. */
  members: Profile[]
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onClose: () => void
}

const EMOJI_OPTIONS = [
  '🦊', '🐙', '🦋', '🐝', '🦅', '🧪', '🐺', '🦉', '🐢', '🦁',
  '🐯', '🐼', '🦄', '🐸', '🦖', '🐳', '🦑', '🦩', '🦔', '🐨',
  '🐧', '🦆', '🦜', '🐬',
]

/** Self-service PIN change + character emoji, tucked behind a settings
 *  icon — not the first thing a signed-in character sees.
 *
 *  Deliberately no email-change field: your account's email is the fixed
 *  join key this whole system matches by (profiles, the allowed_users
 *  sync trigger, the character picker itself). Changing it either sits in
 *  Supabase's email-confirmation limbo or succeeds and silently strands
 *  the picker on the old address — either way you get locked out with a
 *  correct password. Learned this one live; not re-adding it. */
export default function SettingsPanel({ currentUser, members, theme, onToggleTheme, onClose }: SettingsPanelProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [emoji, setEmoji] = useState(currentUser.emoji)
  const [emojiStatus, setEmojiStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [emojiError, setEmojiError] = useState('')

  const takenBy = new Map(
    members.filter((m) => m.id !== currentUser.id).map((m) => [m.emoji, m.displayName]),
  )

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !pin) return
    if (pin !== confirmPin) {
      setError("PINs don't match")
      return
    }
    setStatus('saving')
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password: pin })
    if (updateError) {
      setStatus('error')
      setError(updateError.message)
    } else {
      setStatus('saved')
      setPin('')
      setConfirmPin('')
    }
  }

  async function revealTestAndSwitch() {
    if (!supabase) return
    sessionStorage.setItem(REVEAL_HIDDEN_KEY, '1')
    await supabase.auth.signOut()
  }

  async function pickEmoji(next: string) {
    if (!supabase || next === emoji || takenBy.has(next)) return
    const previous = emoji
    setEmoji(next)
    setEmojiStatus('saving')
    setEmojiError('')
    const { error: updateError } = await supabase.from('profiles').update({ emoji: next }).eq('id', currentUser.id)
    if (updateError) {
      setEmoji(previous)
      setEmojiStatus('error')
      // Postgres unique_violation — someone else grabbed it a moment ago.
      setEmojiError(
        updateError.code === '23505' ? 'Someone just took that one — pick another.' : "Couldn't save — try again.",
      )
    } else {
      setEmojiStatus('saved')
    }
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <aside className="settings-panel glass" onClick={(e) => e.stopPropagation()}>
        <header className="admin-panel-header">
          <h2>Settings</h2>
          <button type="button" className="admin-panel-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="admin-field settings-section">
          <span>Appearance</span>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <span className="theme-toggle-label">
              {theme === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span className="theme-toggle-hint">tap to switch</span>
          </button>
        </div>

        <div className="admin-field">
          <span>Your character</span>
          <div className="emoji-grid">
            {EMOJI_OPTIONS.map((e) => {
              const takenName = takenBy.get(e)
              return (
                <button
                  key={e}
                  type="button"
                  className={`emoji-option${emoji === e ? ' selected' : ''}${takenName ? ' taken' : ''}`}
                  onClick={() => pickEmoji(e)}
                  disabled={!!takenName}
                  aria-label={takenName ? `${e} — taken by ${takenName}` : `Use ${e}`}
                  title={takenName ? `Taken by ${takenName}` : undefined}
                >
                  <CharacterIcon emoji={e} color={CHARACTER_ICON_COLORS[e]} size={26} />
                </button>
              )
            })}
          </div>
          {emojiStatus === 'saved' && (
            <p className="settings-saved">
              Saved <CheckIcon size={13} />
            </p>
          )}
          {emojiStatus === 'error' && <p className="login-error">{emojiError}</p>}
        </div>

        <form onSubmit={handleSave} className="settings-form">
          <label className="admin-field">
            <span>New PIN</span>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Leave blank to keep current PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>Confirm new PIN</span>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Repeat new PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          {status === 'saved' && (
            <p className="settings-saved">
              Saved <CheckIcon size={13} />
            </p>
          )}
          <button type="submit" className="add-idea-save" disabled={status === 'saving' || !pin}>
            {status === 'saving' ? 'Saving…' : 'Save PIN'}
          </button>
        </form>

        {currentUser.isAdmin && (
          <div className="settings-admin-row">
            <button type="button" className="login-back" onClick={revealTestAndSwitch}>
              Reveal Test on login screen & switch character
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
