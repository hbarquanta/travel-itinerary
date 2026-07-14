import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ChatMessage, Profile } from '../types'
import { CHAT_MESSAGE_MAX_LENGTH } from '../lib/queries'
import { CharacterIcon, CloseIcon, ChatIcon } from './icons'

interface ChatPanelProps {
  messages: ChatMessage[]
  members: Profile[]
  currentUser: Profile
  onSend: (body: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
        ', ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPanel({ messages, members, currentUser, onSend, onDelete, onClose }: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const memberById = new Map(members.map((m) => [m.id, m]))

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    onSend(body)
    setDraft('')
  }

  return (
    <div className="chat-overlay" onClick={onClose}>
      <aside className="chat-panel glass" onClick={(e) => e.stopPropagation()}>
        <header className="chat-panel-header">
          <span className="chat-panel-title">
            <ChatIcon size={17} /> Chat
          </span>
          <button type="button" className="admin-panel-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="chat-panel-list" ref={listRef}>
          {messages.length === 0 && <p className="chat-empty">No messages yet — say something.</p>}
          {messages.map((m) => {
            const author = memberById.get(m.createdBy)
            const own = m.createdBy === currentUser.id
            return (
              <div key={m.id} className={`chat-message${own ? ' own' : ''}`}>
                <CharacterIcon
                  emoji={author?.emoji ?? '🧭'}
                  color={author?.color ?? '#8b93a7'}
                  size={24}
                  className="chat-message-avatar"
                />
                <div className="chat-message-body">
                  <div className="chat-message-meta">
                    <span className="chat-message-name">{author?.displayName ?? 'Someone'}</span>
                    <span className="chat-message-time">{formatTime(m.createdAt)}</span>
                  </div>
                  <p className="chat-message-text">{m.body}</p>
                </div>
                {(own || currentUser.isAdmin) && (
                  <button type="button" className="chat-message-delete" title="Remove" onClick={() => onDelete(m.id)}>
                    <CloseIcon size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <form className="chat-panel-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, CHAT_MESSAGE_MAX_LENGTH))}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            placeholder="Say something…"
            autoComplete="off"
          />
          <span className="chat-panel-counter">
            {draft.length}/{CHAT_MESSAGE_MAX_LENGTH}
          </span>
          <button type="submit" disabled={!draft.trim()}>
            Send
          </button>
        </form>
      </aside>
    </div>
  )
}
