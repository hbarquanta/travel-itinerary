import { useMemo, useState } from 'react'
import type { Trip, Profile, Approval, ApprovalKind, Idea, TripStatus } from '../types'
import { yearGroupOf } from '../types'
import { CharacterIcon, EditIcon, CheckIcon } from './icons'

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
  ideas: Idea[]
  /** Trip id -> participant profile ids. */
  participants: Map<string, string[]>
  activeYears: Set<string>
  activeCategories: Set<string>
  hoveredTripId: string | null
  onHoverTrip: (tripId: string | null) => void
  onFocusTrip: (tripId: string) => void
  open: boolean
  onToggleOpen: () => void
  /** Signed-in user's id — enables tapping your own avatar / deleting your own ideas. Demo mode passes null. */
  currentUserId: string | null
  isAdmin: boolean
  onToggleApproval?: (tripId: string, kind: ApprovalKind) => void
  onDeleteIdea?: (ideaId: string) => void
  onNewTrip?: () => void
  onEditTrip?: (trip: Trip) => void
  onPromoteIdea?: (idea: Idea) => void
}

export default function Sidebar({
  trips,
  members,
  approvals,
  ideas,
  participants,
  activeYears,
  activeCategories,
  hoveredTripId,
  onHoverTrip,
  onFocusTrip,
  open,
  onToggleOpen,
  currentUserId,
  isAdmin,
  onToggleApproval,
  onDeleteIdea,
  onNewTrip,
  onEditTrip,
  onPromoteIdea,
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

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

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
          <div>
            <h2>Journeys</h2>
            <span className="sidebar-sub">
              {trips.length} trips · {members.length} travellers
            </span>
          </div>
          {isAdmin && onNewTrip && (
            <button type="button" className="sidebar-new-trip" onClick={onNewTrip}>
              + New trip
            </button>
          )}
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
                  participantIds={participants.get(trip.id) ?? []}
                  categoryOff={!activeCategories.has(trip.category)}
                  hovered={hoveredTripId === trip.id}
                  onHover={onHoverTrip}
                  onFocus={onFocusTrip}
                  currentUserId={currentUserId}
                  onToggleApproval={onToggleApproval}
                  isAdmin={isAdmin}
                  onEdit={onEditTrip}
                />
              ))}
            </section>
          ))}

          {ideas.length > 0 && (
            <section>
              <h3 className="year-heading">Ideas</h3>
              {ideas.map((idea) => {
                const author = memberById.get(idea.createdBy)
                const own = currentUserId !== null && idea.createdBy === currentUserId
                return (
                  <article
                    key={idea.id}
                    className="idea-card"
                    style={{ '--avatar-color': author?.color ?? '#8b93a7' } as React.CSSProperties}
                  >
                    <div className="trip-card-top">
                      <span className="trip-dot idea-dot" />
                      <h4 className="trip-title">{idea.title}</h4>
                      {idea.yearSuggestion && <span className="status-badge">{idea.yearSuggestion}?</span>}
                    </div>
                    {idea.note && <p className="trip-desc">{idea.note}</p>}
                    <div className="idea-footer">
                      <span className="idea-author">
                        {author ? (
                          <>
                            <CharacterIcon emoji={author.emoji} color={author.color} size={16} />
                            {author.displayName}
                          </>
                        ) : (
                          'Someone'
                        )}
                      </span>
                      <span className="idea-actions">
                        {isAdmin && onPromoteIdea && (
                          <button type="button" className="idea-promote" onClick={() => onPromoteIdea(idea)}>
                            Promote to trip
                          </button>
                        )}
                        {(own || isAdmin) && onDeleteIdea && (
                          <button type="button" className="idea-delete" onClick={() => onDeleteIdea(idea.id)}>
                            Remove
                          </button>
                        )}
                      </span>
                    </div>
                  </article>
                )
              })}
            </section>
          )}
        </div>
      </aside>
    </>
  )
}

function TripCard({
  trip,
  members,
  approvals,
  participantIds,
  categoryOff,
  hovered,
  onHover,
  onFocus,
  currentUserId,
  onToggleApproval,
  isAdmin,
  onEdit,
}: {
  trip: Trip
  members: Profile[]
  approvals: Approval[]
  participantIds: string[]
  categoryOff: boolean
  hovered: boolean
  onHover: (id: string | null) => void
  onFocus: (id: string) => void
  currentUserId: string | null
  onToggleApproval?: (tripId: string, kind: ApprovalKind) => void
  isAdmin: boolean
  onEdit?: (trip: Trip) => void
}) {
  const status = STATUS_META[trip.status]
  // Dev/test accounts never belong in a member-facing roster like this one
  // (approvals, participants) — hidden is for exactly that, not just the
  // pre-login character picker.
  const visibleMembers = members.filter((m) => !m.hidden)
  const tripApproved = new Set(approvals.filter((a) => a.kind === 'trip').map((a) => a.userId))
  const datesApproved = new Set(approvals.filter((a) => a.kind === 'dates').map((a) => a.userId))
  const allIn = visibleMembers.every((m) => tripApproved.has(m.id))
  const participants = visibleMembers.filter((m) => participantIds.includes(m.id))

  return (
    <article
      className={`trip-card${hovered ? ' hovered' : ''}${allIn ? ' all-in' : ''}${categoryOff ? ' category-off' : ''}`}
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
        {isAdmin && onEdit && (
          <button
            type="button"
            className="trip-card-edit"
            title="Edit trip"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(trip)
            }}
          >
            <EditIcon size={14} />
          </button>
        )}
      </div>
      <div className="trip-meta">
        <span>{formatRange(trip)}</span>
        <span className="meta-sep">·</span>
        <span>{trip.stops.length} stops</span>
        {trip.datesConfirmed && <span className="dates-confirmed" title="Dates confirmed">📅✓</span>}
      </div>
      {trip.description && <p className="trip-desc">{trip.description}</p>}
      {participants.length > 0 && (
        <div className="participant-row" title="Who was actually on this trip">
          {participants.map((m) => (
            <span key={m.id} className="avatar participant" style={{ '--avatar-color': m.color } as React.CSSProperties}>
              <CharacterIcon emoji={m.emoji} color={m.color} size={18} />
            </span>
          ))}
        </div>
      )}
      <div className="approval-row" title="Approvals — filled: trip, corner tick: dates">
        {visibleMembers.map((m) => {
          const approved = tripApproved.has(m.id)
          const own = currentUserId !== null && m.id === currentUserId
          const label = `${m.displayName}${approved ? ' approved the trip' : ' — not yet'}${datesApproved.has(m.id) ? ', dates ✓' : ''}${own ? ' (tap to toggle)' : ''}`
          return (
            <button
              key={m.id}
              type="button"
              className={`avatar${approved ? ' approved' : ''}${own ? ' own' : ''}`}
              style={{ '--avatar-color': m.color } as React.CSSProperties}
              title={label}
              disabled={!own}
              onClick={(e) => {
                e.stopPropagation()
                if (own && onToggleApproval) onToggleApproval(trip.id, 'trip')
              }}
            >
              <CharacterIcon emoji={m.emoji} color={m.color} size={22} />
              {datesApproved.has(m.id) && (
                <i className="dates-tick">
                  <CheckIcon size={9} />
                </i>
              )}
            </button>
          )
        })}
      </div>
    </article>
  )
}

export function useSidebarOpen() {
  // Closed by default everywhere — the trip list is easy to spoil future
  // years/trips with, so it should be an explicit open, not a first sight.
  const [open, setOpen] = useState(false)
  return [open, () => setOpen((o) => !o)] as const
}
