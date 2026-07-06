import { useMemo, useState } from 'react'
import MapView from './components/MapView'
import YearChips from './components/YearChips'
import Sidebar, { useSidebarOpen } from './components/Sidebar'
import Login from './components/Login'
import { trips as placeholderTrips, members as placeholderMembers, approvals as placeholderApprovals } from './data/placeholder'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import { useTripsData } from './hooks/useTripsData'
import type { Trip, Profile, Approval } from './types'

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
  const { trips, members, approvals, loading: dataLoading } = useTripsData()

  if (authLoading) return <LoadingScreen label="Signing in…" />
  if (!session) return <Login />
  if (!profile) return <NotAllowlisted />
  if (dataLoading) return <LoadingScreen label="Charting the atlas…" />
  return <AtlasMap trips={trips} members={members} approvals={approvals} />
}

function AtlasMap({ trips, members, approvals }: { trips: Trip[]; members: Profile[]; approvals: Approval[] }) {
  const years = useMemo(() => [...new Set(trips.map((t) => t.year))].sort((a, b) => a - b), [trips])

  // Default: every year visible → overlay mode.
  const [activeYears, setActiveYears] = useState<Set<number>>(() => new Set(years))
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ tripId: string; nonce: number } | null>(null)
  const [sidebarOpen, toggleSidebar] = useSidebarOpen()

  const toggleYear = (year: number) =>
    setActiveYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })

  const focusTrip = (tripId: string) => {
    setFocus((f) => ({ tripId, nonce: (f?.nonce ?? 0) + 1 }))
    const year = trips.find((t) => t.id === tripId)?.year
    if (year !== undefined && !activeYears.has(year)) toggleYear(year)
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
      <Sidebar
        trips={trips}
        members={members}
        approvals={approvals}
        activeYears={activeYears}
        hoveredTripId={hoveredTripId}
        onHoverTrip={setHoveredTripId}
        onFocusTrip={focusTrip}
        open={sidebarOpen}
        onToggleOpen={toggleSidebar}
      />
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <AtlasMap trips={placeholderTrips} members={placeholderMembers} approvals={placeholderApprovals} />
  }
  return <ConnectedApp />
}
