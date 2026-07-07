import { useMemo, useState } from 'react'
import MapView from './components/MapView'
import YearChips from './components/YearChips'
import Sidebar, { useSidebarOpen } from './components/Sidebar'
import Login from './components/Login'
import AddIdeaForm from './components/AddIdeaForm'
import AdminTripPanel from './components/AdminTripPanel'
import {
  trips as placeholderTrips,
  members as placeholderMembers,
  approvals as placeholderApprovals,
  ideas as placeholderIdeas,
} from './data/placeholder'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import { useTripsData } from './hooks/useTripsData'
import { addApproval, removeApproval, addIdea, deleteIdea, deleteTrip } from './lib/queries'
import {
  newEditSession,
  editSessionFromTrip,
  editSessionFromIdea,
  saveEditSession,
  makeLocalId,
  type EditSession,
} from './lib/editSession'
import type { Trip, Profile, Approval, Idea, ApprovalKind } from './types'
import { yearGroupOf } from './types'

const SIDEBAR_WIDTH = 340

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="loading-veil">
      <div className="loading-globe">🧭</div>
      <p>{label}</p>
    </div>
  )
}

function NotAllowlisted() {
  return (
    <div className="login-screen">
      <div className="login-card glass">
        <span className="brand-mark">🚫</span>
        <h1>Not on the list</h1>
        <p>This email isn't in the Atlas allowlist yet — ask Fabian to add it.</p>
        <button type="button" onClick={() => supabase?.auth.signOut()}>
          Sign out
        </button>
      </div>
    </div>
  )
}

/** Gates the map behind Supabase auth once VITE_SUPABASE_URL/ANON_KEY are set. */
function ConnectedApp() {
  const { loading: authLoading, session, profile } = useAuth()
  const { trips, members, approvals, ideas, loading: dataLoading, refetch } = useTripsData()

  if (authLoading) return <LoadingScreen label="Signing in…" />
  if (!session) return <Login />
  if (!profile) return <NotAllowlisted />
  if (dataLoading) return <LoadingScreen label="Charting the atlas…" />

  return (
    <AtlasMap
      trips={trips}
      members={members}
      approvals={approvals}
      ideas={ideas}
      currentUserId={profile.id}
      isAdmin={profile.isAdmin}
      onToggleApproval={(tripId, kind) => {
        const mine = approvals.some((a) => a.tripId === tripId && a.userId === profile.id && a.kind === kind)
        if (mine) removeApproval(tripId, profile.id, kind)
        else addApproval(tripId, profile.id, kind)
      }}
      onAddIdea={(data) => addIdea({ ...data, createdBy: profile.id })}
      onDeleteIdea={(ideaId) => deleteIdea(ideaId)}
      onDataChanged={refetch}
    />
  )
}

interface AtlasMapProps {
  trips: Trip[]
  members: Profile[]
  approvals: Approval[]
  ideas: Idea[]
  /** Signed-in user's id; null in local demo mode (no interactivity). */
  currentUserId: string | null
  isAdmin?: boolean
  onToggleApproval?: (tripId: string, kind: ApprovalKind) => void
  onAddIdea?: (data: { title: string; lat: number; lng: number; note: string | null; yearSuggestion: number | null }) => void
  onDeleteIdea?: (ideaId: string) => void
  /** Called after an admin save/delete commits, to refresh from Supabase immediately. */
  onDataChanged?: () => void
}

function AtlasMap({
  trips,
  members,
  approvals,
  ideas,
  currentUserId,
  isAdmin = false,
  onToggleApproval,
  onAddIdea,
  onDeleteIdea,
  onDataChanged,
}: AtlasMapProps) {
  const years = useMemo(() => {
    const bySortKey = new Map<string, number>()
    for (const t of trips) {
      const label = yearGroupOf(t)
      if (!bySortKey.has(label)) bySortKey.set(label, t.year)
    }
    return [...bySortKey.entries()].sort(([a, ay], [b, by]) => ay - by || a.localeCompare(b)).map(([label]) => label)
  }, [trips])

  const ideaAuthors = useMemo(() => new Map(members.map((m) => [m.id, m.color])), [members])

  // Default: every year visible → overlay mode.
  const [activeYears, setActiveYears] = useState<Set<string>>(() => new Set(years))
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ tripId: string; nonce: number } | null>(null)
  const [sidebarOpen, toggleSidebar] = useSidebarOpen()
  const [addIdeaMode, setAddIdeaMode] = useState(false)
  const [pendingIdeaLocation, setPendingIdeaLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [editSession, setEditSession] = useState<EditSession | null>(null)
  const [saving, setSaving] = useState(false)

  const toggleYear = (year: string) =>
    setActiveYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })

  const focusTrip = (tripId: string) => {
    setFocus((f) => ({ tripId, nonce: (f?.nonce ?? 0) + 1 }))
    const trip = trips.find((t) => t.id === tripId)
    if (trip && !activeYears.has(yearGroupOf(trip))) toggleYear(yearGroupOf(trip))
  }

  const currentYear = new Date().getFullYear()

  async function handleSaveSession() {
    if (!editSession || !currentUserId) return
    setSaving(true)
    try {
      await saveEditSession(editSession, currentUserId)
      setEditSession(null)
      onDataChanged?.()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTrip() {
    if (!editSession?.tripId) return
    setSaving(true)
    try {
      await deleteTrip(editSession.tripId)
      setEditSession(null)
      onDataChanged?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app">
      <MapView
        trips={trips}
        activeYears={activeYears}
        hoveredTripId={hoveredTripId}
        onHoverTrip={setHoveredTripId}
        focus={focus}
        sidebarPadding={sidebarOpen ? SIDEBAR_WIDTH : 0}
        ideas={ideas}
        ideaAuthors={ideaAuthors}
        addIdeaMode={addIdeaMode}
        onMapClickForIdea={(lat, lng) => setPendingIdeaLocation({ lat, lng })}
        pendingIdeaLocation={pendingIdeaLocation}
        editStops={editSession?.stops ?? null}
        onAddEditStop={(lat, lng) =>
          setEditSession((s) =>
            s
              ? {
                  ...s,
                  stops: [
                    ...s.stops,
                    {
                      localId: makeLocalId(),
                      name: `Stop ${s.stops.length + 1}`,
                      lat,
                      lng,
                      notes: '',
                      wikiUrl: '',
                      travelMode: 'ground',
                    },
                  ],
                }
              : s,
          )
        }
        onDragEditStop={(localId, lat, lng) =>
          setEditSession((s) =>
            s ? { ...s, stops: s.stops.map((st) => (st.localId === localId ? { ...st, lat, lng } : st)) } : s,
          )
        }
      />
      <header className="brand glass">
        <span className="brand-mark">🧭</span>
        <div>
          <h1>Atlas</h1>
          <p>five friends · one map</p>
        </div>
      </header>
      <div className="chips-wrap">
        <YearChips years={years} activeYears={activeYears} onToggle={toggleYear} />
      </div>
      {currentUserId !== null && onAddIdea && (
        <button
          type="button"
          className={`add-idea-toggle${addIdeaMode ? ' active' : ''}`}
          onClick={() => {
            setAddIdeaMode((on) => !on)
            setPendingIdeaLocation(null)
          }}
        >
          {addIdeaMode ? '✕ Cancel' : '📍 Add idea'}
        </button>
      )}
      {pendingIdeaLocation && onAddIdea && (
        <AddIdeaForm
          onCancel={() => setPendingIdeaLocation(null)}
          onSave={({ title, note, yearSuggestion }) => {
            onAddIdea({ title, note: note || null, yearSuggestion, lat: pendingIdeaLocation.lat, lng: pendingIdeaLocation.lng })
            setPendingIdeaLocation(null)
            setAddIdeaMode(false)
          }}
        />
      )}
      {editSession && (
        <AdminTripPanel
          session={editSession}
          onChange={(patch) => setEditSession((s) => (s ? { ...s, ...patch } : s))}
          onUpdateStop={(localId, patch) =>
            setEditSession((s) =>
              s ? { ...s, stops: s.stops.map((st) => (st.localId === localId ? { ...st, ...patch } : st)) } : s,
            )
          }
          onMoveStop={(localId, direction) =>
            setEditSession((s) => {
              if (!s) return s
              const i = s.stops.findIndex((st) => st.localId === localId)
              const j = i + direction
              if (i < 0 || j < 0 || j >= s.stops.length) return s
              const stops = [...s.stops]
              ;[stops[i], stops[j]] = [stops[j], stops[i]]
              return { ...s, stops }
            })
          }
          onRemoveStop={(localId) =>
            setEditSession((s) => {
              if (!s) return s
              const stop = s.stops.find((st) => st.localId === localId)
              return {
                ...s,
                stops: s.stops.filter((st) => st.localId !== localId),
                deletedStopIds: stop?.id ? [...s.deletedStopIds, stop.id] : s.deletedStopIds,
              }
            })
          }
          onSave={handleSaveSession}
          onCancel={() => setEditSession(null)}
          onDeleteTrip={editSession.tripId ? handleDeleteTrip : undefined}
          saving={saving}
        />
      )}
      <Sidebar
        trips={trips}
        members={members}
        approvals={approvals}
        ideas={ideas}
        activeYears={activeYears}
        hoveredTripId={hoveredTripId}
        onHoverTrip={setHoveredTripId}
        onFocusTrip={focusTrip}
        open={sidebarOpen}
        onToggleOpen={toggleSidebar}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onToggleApproval={onToggleApproval}
        onDeleteIdea={onDeleteIdea}
        onNewTrip={() => setEditSession(newEditSession(trips.map((t) => t.color), currentYear))}
        onEditTrip={(trip) => setEditSession(editSessionFromTrip(trip))}
        onPromoteIdea={(idea) =>
          setEditSession(editSessionFromIdea(idea, trips.map((t) => t.color), currentYear))
        }
      />
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <AtlasMap
        trips={placeholderTrips}
        members={placeholderMembers}
        approvals={placeholderApprovals}
        ideas={placeholderIdeas}
        currentUserId={null}
      />
    )
  }
  return <ConnectedApp />
}
