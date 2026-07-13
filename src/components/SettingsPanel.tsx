import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface SettingsPanelProps {
  currentUser: Profile
  onClose: () => void
}

const EMOJI_OPTIONS = [
  '🦊', '🐙', '🦋', '🐝', '🦅', '🧪', '🐺', '🦉', '🐢', '🦁',
  '🐯', '🐼', '🦄', '🐸', '🦖', '🐳', '🦑', '🦩', '🦔', '🐨',
  '🐧', '🦆', '🦜', '🐬',
]

/** Self-service PIN/email change + character emoji, tucked behind a
 *  settings icon — not the first thing a signed-in character sees. */
export default function SettingsPanel({ currentUser, onClose }: SettingsPanelProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [emoji, setEmoji] = useState(currentUser.emoji)
  const [emojiStatus, setEmojiStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (!pin && !email) return
    if (pin && pin !== confirmPin) {
      setError("PINs don't match")
      return
    }
    setStatus('saving')
    setError('')
    const updates: { password?: string; email?: string } = {}
    if (pin) updates.password = pin
    if (email) updates.email = email
    const { error: updateError } = await supabase.auth.updateUser(updates)
    if (updateError) {
      setStatus('error')
      setError(updateError.message)
    } else {
      setStatus('saved')
      setPin('')
      setConfirmPin('')
      setEmail('')
    }
  }

  async function pickEmoji(next: string) {
    if (!supabase || next === emoji) return
    setEmoji(next)
    setEmojiStatus('saving')
    const { error: updateError } = await supabase.from('profiles').update({ emoji: next }).eq('id', currentUser.id)
    setEmojiStatus(updateError ? 'error' : 'saved')
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <aside className="settings-panel glass" onClick={(e) => e.stopPropagation()}>
        <header className="admin-panel-header">
          <h2>Settings</h2>
          <button type="button" className="admin-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="admin-field">
          <span>Your character</span>
          <div className="emoji-grid">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                className={`emoji-option${emoji === e ? ' selected' : ''}`}
                onClick={() => pickEmoji(e)}
                aria-label={`Use ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
          {emojiStatus === 'saved' && <p className="settings-saved">Saved ✓</p>}
          {emojiStatus === 'error' && <p className="login-error">Couldn't save — try again.</p>}
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
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="Leave blank to keep current email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          {status === 'saved' && <p className="settings-saved">Saved ✓</p>}
          <button type="submit" className="add-idea-save" disabled={status === 'saving' || (!pin && !email)}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </aside>
    </div>
  )
}
