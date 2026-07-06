import { useMemo, useState } from 'react'
import type { Trip, Profile, Approval, TripStatus } from '../types'
import { yearGroupOf } from '../types'

const STATUS_META: Record<TripStatus, { icon: string; label: string }> = {
  idea: { icon: '💡', label: 'Idea' },
  planned: { icon: '📋', label: 'Planned' },
  locked: { icon: '✅', label: 'Locked in' },
  past: { icon: '🏁', label: 'Past' },
}

function formatRange(trip: Trip): string {
  if (!trip.dateStart) return 'Dates open'
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = new Date(trip.dateStart + 'T00:00:00')
  if (!trip.dateEnd) return start.toLocaleDateString('en-GB', opts)
  const end = new Date(trip.dateEnd + 'T00:00:00')
  return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`
}

interface SidebarProps {
  trips: Trip[]
  members: Profile[]
  approvals: Approval[]
  activeYears: Set<string>
  hoveredTripId: string | null
  onHoverTrip: (tripId: string | null) => void
  onFocusTrip: (tripId: string) => void
  open: boolean
  onToggleOpen: () => void
}

export default function Sidebar({
  trips,
  members,
  approvals,
  activeYears,
  hoveredTripId,
  onHoverTrip,
  onFocusTrip,
  open,
  onToggleOpen,
}: SidebarProps) {
  const byYear = useMemo(() => {
    const groups = new Map<string, { sortKey: number; trips: Trip[] }>()
    for (const trip of trips) {
      const label = yearGroupOf(trip)
      if (!groups.has(label)) groups.set(label, { sortKey: trip.year, trips: [] })
      groups.get(label)!.trips.push(trip)
    }
    return [...groups.entries()].sort(
      ([labelA, a], [labelB, b]) => a.sortKey - b.sortKey || labelA.localeCompare(labelB),
    )
  }, [trips])

  return (
    <>
      <button
        type="button"
        className={`sidebar-toggle${open ? ' open' : ''}`}
        onClick={onToggleOpen}
        aria-label={open ? 'Collapse trip list' : 'Expand trip list'}
      >
        {open ? '›' : '‹'}
      </button>
      <aside className={`sidebar glass${open ? '' : ' collapsed'}`}>
        <header className="sidebar-header">
          <h2>Journeys</h2>
          <span className="sidebar-sub">
            {trips.length} trips · {members.length} travellers
          </span>
        </header>
        <div className="sidebar-scroll">
          {byYear.map(([year, group]) => (
            <section key={year} className={activeYears.has(year) ? '' : 'year-off'}>
              <h3 className="year-heading">{year}</h3>
              {group.trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  members={members}
                  approvals={approvals.filter((a) => a.tripId === trip.id)}
                  hovered={hoveredTripId === trip.id}
                  onHover={onHoverTrip}
                  onFocus={onFocusTrip}
                />
              ))}
            </section>
          ))}
        </div>
      </aside>
    </>
  )
}

function TripCard({
  trip,
  members,
  approvals,
  hovered,
  onHover,
  onFocus,
}: {
  trip: Trip
  members: Profile[]
  approvals: Approval[]
  hovered: boolean
  onHover: (id: string | null) => void
  onFocus: (id: string) => void
}) {
  const status = STATUS_META[trip.status]
  const tripApproved = new Set(approvals.filter((a) => a.kind === 'trip').map((a) => a.userId))
  const datesApproved = new Set(approvals.filter((a) => a.kind === 'dates').map((a) => a.userId))
  const allIn = members.every((m) => tripApproved.has(m.id))

  return (
    <article
      className={`trip-card${hovered ? ' hovered' : ''}${allIn ? ' all-in' : ''}`}
      style={{ '--trip-color': trip.color } as React.CSSProperties}
      onMouseEnter={() => onHover(trip.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onFocus(trip.id)}
    >
      <div className="trip-card-top">
        <span className="trip-dot" />
        <h4 className="trip-title">{trip.title}</h4>
        <span className="status-badge" title={status.label}>
          {status.icon} {status.label}
        </span>
      </div>
      <div className="trip-meta">
        <span>{formatRange(trip)}</span>
        <span className="meta-sep">·</span>
        <span>{trip.stops.length} stops</span>
        {trip.datesConfirmed && <span className="dates-confirmed" title="Dates confirmed">📅✓</span>}
      </div>
      {trip.description && <p className="trip-desc">{trip.description}</p>}
      <div className="approval-row" title="Approvals — filled: trip, corner tick: dates">
        {members.map((m) => {
          const approved = tripApproved.has(m.id)
          return (
            <span
              key={m.id}
              className={`avatar${approved ? ' approved' : ''}`}
              style={{ '--avatar-color': m.color } as React.CSSProperties}
              title={`${m.displayName}${approved ? ' approved the trip' : ' — not yet'}${datesApproved.has(m.id) ? ', dates ✓' : ''}`}
            >
              {m.emoji}
              {datesApproved.has(m.id) && <i className="dates-tick">✓</i>}
            </span>
          )
        })}
      </div>
    </article>
  )
}

export function useSidebarOpen() {
  const [open, setOpen] = useState(() => window.innerWidth > 900)
  return [open, () => setOpen((o) => !o)] as const
}
