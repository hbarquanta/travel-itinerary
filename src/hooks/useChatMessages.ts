import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMessages, sendMessage as sendMessageQuery, deleteMessage as deleteMessageQuery } from '../lib/queries'
import type { ChatMessage } from '../types'

/** Live global chat, appended to incrementally over realtime rather than
 *  refetching the whole history on every message — kept as its own channel
 *  (separate from useTripsData's) so chat traffic never triggers a trip
 *  reload and vice versa. `ready` should reflect "a real, allowlisted
 *  session exists" — see useTripsData for why that gate matters. */
export function useChatMessages(ready: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    fetchMessages().then((m) => {
      setMessages(m)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const db = supabase
    if (!db || !ready) return
    setLoading(true)
    reload()
    const channel = db
      .channel('atlas-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as { id: string; body: string; created_by: string; created_at: string }
        setMessages((prev) =>
          prev.some((m) => m.id === row.id)
            ? prev
            : [...prev, { id: row.id, body: row.body, createdBy: row.created_by, createdAt: row.created_at }],
        )
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.old as { id: string }
        setMessages((prev) => prev.filter((m) => m.id !== row.id))
      })
      .subscribe()
    return () => {
      db.removeChannel(channel)
    }
  }, [reload, ready])

  const send = useCallback(async (body: string, createdBy: string) => {
    const sent = await sendMessageQuery(body, createdBy)
    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
  }, [])

  const remove = useCallback(async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    await deleteMessageQuery(id)
  }, [])

  return { messages, loading, send, remove }
}
