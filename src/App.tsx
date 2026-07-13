import { useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import YearChips from './components/YearChips'
import CategoryChips from './components/CategoryChips'
import Sidebar, { useSidebarOpen } from './components/Sidebar'
import Login from './components/Login'
import AddIdeaForm from './components/AddIdeaForm'
import AdminTripPanel from './components/AdminTripPanel'
import SettingsPanel from './components/SettingsPanel'
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
  const { trips, members, approvals, ideas, participants, loading: dataLoading, refetch } = useTripsData(!!profile)

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
      participants={participants}
      currentUserId={profile.id}
      currentUser={profile}
      isAdmin={profile.isAdmin}
      onToggleApproval={(tripId, kind) => {
        const mine = approvals.some((a) => a.tripId === tripId && a.userId === profile.id && a.kind === kind)
        if (mine) removeApproval(tripId, profile.id, kind)
        else addApproval(tripId, profile.id, kind)
      }}
      onAddIdea={(data) => addIdea({ ...data, createdBy: profile.id })}
      onDeleteIdea={(ideaId) => deleteIdea(ideaId)}
      onDataChanged={refetch}
      onSignOut={() => supabase?.auth.signOut()}
    />
  )
}

interface AtlasMapProps {
  trips: Trip[]
  members: Profile[]
  approvals: Approval[]
  ideas: Idea[]
  /** Trip id -> participant profile ids; empty in local demo mode. */
  participants?: Map<string, string[]>
  /** Signed-in user's id; null in local demo mode (no interactivity). */
  currentUserId: string | null
  /** Signed-in user's full profile, for the header's "who am I" control. */
  currentUser?: Profile | null
  isAdmin?: boolean
  onToggleApproval?: (tripId: string, kind: ApprovalKind) => void
  onAddIdea?: (data: { title: string; lat: number; lng: number; note: string | null; yearSuggestion: number | null }) => void
  onDeleteIdea?: (ideaId: string) => void
  /** Called after an admin save/delete commits, to refresh from Supabase immediately. */
  onDataChanged?: () => void
  onSignOut?: () => void
}

function AtlasMap({
  trips,
  members,
  approvals,
  ideas,
  participants = new Map(),
  currentUserId,
  currentUser = null,
  isAdmin = false,
  onToggleApproval,
  onAddIdea,
  onDeleteIdea,
  onDataChanged,
  onSignOut,
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

  // Default: just 2025 (a finished trip) as a showcase, so a first-time
  // visitor sees what the app does without spoiling future years. Falls
  // back to every year if 2025 isn't in the data.
  const [activeYears, setActiveYears] = useState<Set<string>>(() =>
    years.includes('2025') ? new Set(['2025']) : new Set(years),
  )
  // Default: just Friends, so a first-time visitor sees the group trips
  // without Solo/Family clutter until they explicitly opt in.
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => new Set(['Friends']))
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ tripId: string; nonce: number } | null>(null)
  const [sidebarOpen, toggleSidebar] = useSidebarOpen()
  const [addIdeaMode, setAddIdeaMode] = useState(false)
  const [pendingIdeaLocation, setPendingIdeaLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [editSession, setEditSession] = useState<EditSession | null>(null)
  /** True once the open edit session has any unsaved change — gates the
   *  discard-changes confirmation on close. */
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [whoamiOpen, setWhoamiOpen] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const toggleYear = (year: string) =>
    setActiveYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })

  const toggleCategory = (category: string) =>
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })

  const focusTrip = (tripId: string) => {
    setFocus((f) => ({ tripId, nonce: (f?.nonce ?? 0) + 1 }))
    const trip = trips.find((t) => t.id === tripId)
    if (trip && !activeYears.has(yearGroupOf(trip))) toggleYear(yearGroupOf(trip))
  }

  const currentYear = new Date().getFullYear()

  /** Closes the trip editor, confirming first if there are unsaved edits. */
  function closeEditSession() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setEditSession(null)
    setDirty(false)
  }

  async function handleSaveSession() {
    if (!editSession || !currentUserId) return
    setSaving(true)
    try {
      await saveEditSession(editSession, currentUserId)
      setEditSession(null)
      setDirty(false)
      onDataChanged?.()
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 2200)
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
      setDirty(false)
      onDataChanged?.()
    } finally {
      setSaving(false)
    }
  }

  // Escape closes whichever panel/menu is currently open, topmost first.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (editSession) closeEditSession()
      else if (settingsOpen) setSettingsOpen(false)
      else if (whoamiOpen) setWhoamiOpen(false)
      else if (pendingIdeaLocation) setPendingIdeaLocation(null)
      else if (addIdeaMode) setAddIdeaMode(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className="app">
      <MapView
        trips={trips}
        activeYears={activeYears}
        activeCategories={activeCategories}
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
        onAddEditStop={(lat, lng) => {
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
          setDirty(true)
        }}
        onDragEditStop={(localId, lat, lng) => {
          setEditSession((s) =>
            s
              ? {
                  ...s,
                  // Dragging moves this stop, so its old incoming route
                  // (computed for the previous position) no longer applies.
                  stops: s.stops.map((st) =>
                    st.localId === localId ? { ...st, lat, lng, routeGeometry: null } : st,
                  ),
                }
              : s,
          )
          setDirty(true)
        }}
      />
      <header className="brand glass">
        <span className="brand-mark">🧭</span>
        <div>
          <h1>Atlas</h1>
        </div>
        {currentUser && (
          <button type="button" className="settings-gear" title="Settings" onClick={() => setSettingsOpen(true)}>
            ⚙️
          </button>
        )}
        {currentUser && onSignOut && (
          <div className="whoami-wrap">
            <button
              type="button"
              className="whoami"
              title="Account"
              onClick={() => setWhoamiOpen((o) => !o)}
            >
              {currentUser.emoji} <span className="whoami-name">{currentUser.displayName}</span>
            </button>
            {whoamiOpen && (
              <>
                <div className="dropdown-backdrop" onClick={() => setWhoamiOpen(false)} />
                <div className="whoami-menu glass">
                  <span className="whoami-menu-label">
                    Signed in as {currentUser.emoji} {currentUser.displayName}
                  </span>
                  <button
                    type="button"
                    className="whoami-signout"
                    onClick={() => {
                      setWhoamiOpen(false)
                      onSignOut()
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>
      {settingsOpen && currentUser && (
        <SettingsPanel currentUser={currentUser} members={members} onClose={() => setSettingsOpen(false)} />
      )}
      <div className="chips-wrap">
        <YearChips years={years} activeYears={activeYears} onToggle={toggleYear} />
        <CategoryChips activeCategories={activeCategories} onToggle={toggleCategory} />
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
          members={members}
          onChange={(patch) => {
            setEditSession((s) => (s ? { ...s, ...patch } : s))
            setDirty(true)
          }}
          onUpdateStop={(localId, patch) => {
            setEditSession((s) =>
              s ? { ...s, stops: s.stops.map((st) => (st.localId === localId ? { ...st, ...patch } : st)) } : s,
            )
            setDirty(true)
          }}
          onMoveStop={(localId, direction) => {
            setEditSession((s) => {
              if (!s) return s
              const i = s.stops.findIndex((st) => st.localId === localId)
              const j = i + direction
              if (i < 0 || j < 0 || j >= s.stops.length) return s
              const stops = [...s.stops]
              ;[stops[i], stops[j]] = [stops[j], stops[i]]
              return { ...s, stops }
            })
            setDirty(true)
          }}
          onRemoveStop={(localId) => {
            setEditSession((s) => {
              if (!s) return s
              const stop = s.stops.find((st) => st.localId === localId)
              return {
                ...s,
                stops: s.stops.filter((st) => st.localId !== localId),
                deletedStopIds: stop?.id ? [...s.deletedStopIds, stop.id] : s.deletedStopIds,
              }
            })
            setDirty(true)
          }}
          onSave={handleSaveSession}
          onCancel={closeEditSession}
          onDeleteTrip={editSession.tripId ? handleDeleteTrip : undefined}
          saving={saving}
        />
      )}
      {savedToast && <div className="toast glass">Trip saved ✓</div>}
      <Sidebar
        trips={trips}
        members={members}
        approvals={approvals}
        ideas={ideas}
        participants={participants}
        activeYears={activeYears}
        activeCategories={activeCategories}
        hoveredTripId={hoveredTripId}
        onHoverTrip={setHoveredTripId}
        onFocusTrip={focusTrip}
        open={sidebarOpen}
        onToggleOpen={toggleSidebar}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onToggleApproval={onToggleApproval}
        onDeleteIdea={onDeleteIdea}
        onNewTrip={() => {
          setEditSession(newEditSession(trips.map((t) => t.color), currentYear, currentUserId ? [currentUserId] : []))
          setDirty(false)
        }}
        onEditTrip={(trip) => {
          setEditSession(editSessionFromTrip(trip, participants.get(trip.id) ?? []))
          setDirty(false)
        }}
        onPromoteIdea={(idea) => {
          setEditSession(
            editSessionFromIdea(idea, trips.map((t) => t.color), currentYear, currentUserId ? [currentUserId] : []),
          )
          setDirty(false)
        }}
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
