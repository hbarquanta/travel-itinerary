import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface SettingsPanelProps {
  onClose: () => void
}

/** Self-service PIN/email change, tucked behind a settings icon — not the
 *  first thing a signed-in character sees. */
export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

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

  return (
    <div className="settings-overlay" onClick={onClose}>
      <aside className="settings-panel glass" onClick={(e) => e.stopPropagation()}>
        <header className="admin-panel-header">
          <h2>Settings</h2>
          <button type="button" className="admin-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
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
