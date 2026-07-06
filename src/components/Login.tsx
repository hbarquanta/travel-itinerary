import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="login-screen">
      <div className="login-card glass">
        <span className="brand-mark">🧭</span>
        <h1>Atlas</h1>
        <p>Enter your email — we'll send you a magic link to sign in.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending' || status === 'sent'}
          />
          <button type="submit" disabled={status === 'sending' || status === 'sent'}>
            {status === 'sent' ? 'Check your email ✓' : 'Send magic link'}
          </button>
        </form>
        {status === 'error' && <p className="login-error">Something went wrong — try again.</p>}
      </div>
    </div>
  )
}
