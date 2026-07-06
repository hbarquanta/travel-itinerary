import { useMemo, useState } from 'react'
import MapView from './components/MapView'
import YearChips from './components/YearChips'
import Sidebar, { useSidebarOpen } from './components/Sidebar'
import { trips, members, approvals } from './data/placeholder'

const SIDEBAR_WIDTH = 340

export default function App() {
  const years = useMemo(() => [...new Set(trips.map((t) => t.year))].sort((a, b) => a - b), [])

  // Default: every (future) year visible → overlay mode.
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
