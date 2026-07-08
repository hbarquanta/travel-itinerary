import { useState } from 'react'
import type { EditSession, EditStop } from '../lib/editSession'
import type { TripStatus, TripCategory, Profile } from '../types'
import { CATEGORIES } from './CategoryChips'

const STATUS_OPTIONS: TripStatus[] = ['idea', 'planned', 'locked', 'past']
const COLOR_PALETTE = ['#fbbf24', '#f472b6', '#2dd4bf', '#a78bfa', '#fb7185', '#38bdf8', '#34d399', '#c084fc', '#67e8f9', '#facc15']

interface AdminTripPanelProps {
  session: EditSession
  members: Profile[]
  onChange: (patch: Partial<EditSession>) => void
  onUpdateStop: (localId: string, patch: Partial<EditStop>) => void
  onMoveStop: (localId: string, direction: -1 | 1) => void
  onRemoveStop: (localId: string) => void
  onSave: () => void
  onCancel: () => void
  onDeleteTrip?: () => void
  saving: boolean
}

export default function AdminTripPanel({
  session,
  members,
  onChange,
  onUpdateStop,
  onMoveStop,
  onRemoveStop,
  onSave,
  onCancel,
  onDeleteTrip,
  saving,
}: AdminTripPanelProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <aside className="admin-panel glass">
      <header className="admin-panel-header">
        <h2>{session.tripId ? 'Edit trip' : session.promotingIdeaId ? 'Promote idea' : 'New trip'}</h2>
        <button type="button" className="admin-panel-close" onClick={onCancel} aria-label="Close">
          ✕
        </button>
      </header>

      <div className="admin-panel-scroll">
        <label className="admin-field">
          <span>Title</span>
          <input value={session.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Trip name" />
        </label>

        <div className="admin-field-row">
          <label className="admin-field">
            <span>Year</span>
            <input
              type="number"
              value={session.year}
              onChange={(e) => onChange({ year: parseInt(e.target.value, 10) || session.year })}
            />
          </label>
          <label className="admin-field">
            <span>Status</span>
            <select value={session.status} onChange={(e) => onChange({ status: e.target.value as TripStatus })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Category</span>
            <select value={session.category} onChange={(e) => onChange({ category: e.target.value as TripCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="admin-field">
          <span>Year label override</span>
          <input
            value={session.yearGroup}
            onChange={(e) => onChange({ yearGroup: e.target.value })}
            placeholder="Leave blank to just show the year, e.g. 2030+"
          />
        </label>

        <div className="admin-field">
          <span>Participants</span>
          <div className="participant-toggle-row">
            {members.map((m) => {
              const on = session.participantIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`avatar participant-toggle${on ? ' approved' : ''}`}
                  style={{ '--avatar-color': m.color } as React.CSSProperties}
                  title={m.displayName}
                  onClick={() =>
                    onChange({
                      participantIds: on
                        ? session.participantIds.filter((id) => id !== m.id)
                        : [...session.participantIds, m.id],
                    })
                  }
                >
                  {m.emoji}
                </button>
              )
            })}
          </div>
        </div>

        <div className="admin-field">
          <span>Color</span>
          <div className="color-swatches">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch${session.color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => onChange({ color: c })}
                aria-label={`Use color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="admin-field-row">
          <label className="admin-field">
            <span>Start date</span>
            <input type="date" value={session.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>End date</span>
            <input type="date" value={session.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} />
          </label>
        </div>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={session.datesConfirmed}
            onChange={(e) => onChange({ datesConfirmed: e.target.checked })}
          />
          Dates confirmed
        </label>

        <label className="admin-field">
          <span>Description</span>
          <textarea
            rows={2}
            value={session.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Short description"
          />
        </label>

        <div className="admin-stops-header">
          <h3>Stops</h3>
          <span className="sidebar-sub">Click the map to add one</span>
        </div>

        {session.stops.length === 0 && <p className="admin-empty-hint">No stops yet — click anywhere on the map.</p>}

        {session.stops.map((stop, i) => (
          <div key={stop.localId} className="admin-stop-row">
            <div className="admin-stop-top">
              <span className="admin-stop-index">{i + 1}</span>
              <input
                className="admin-stop-name"
                value={stop.name}
                onChange={(e) => onUpdateStop(stop.localId, { name: e.target.value })}
                placeholder="Stop name"
              />
              <button
                type="button"
                className="admin-mode-toggle"
                title="Toggle flight/ground arrival"
                onClick={() =>
                  onUpdateStop(stop.localId, { travelMode: stop.travelMode === 'flight' ? 'ground' : 'flight' })
                }
              >
                {stop.travelMode === 'flight' ? '✈️' : '🚗'}
              </button>
              <button type="button" disabled={i === 0} onClick={() => onMoveStop(stop.localId, -1)} title="Move up">
                ▲
              </button>
              <button
                type="button"
                disabled={i === session.stops.length - 1}
                onClick={() => onMoveStop(stop.localId, 1)}
                title="Move down"
              >
                ▼
              </button>
              <button type="button" className="admin-stop-remove" onClick={() => onRemoveStop(stop.localId)} title="Remove">
                ✕
              </button>
            </div>
            <input
              className="admin-stop-detail"
              value={stop.notes}
              onChange={(e) => onUpdateStop(stop.localId, { notes: e.target.value })}
              placeholder="Notes (optional)"
            />
            <input
              className="admin-stop-detail"
              value={stop.wikiUrl}
              onChange={(e) => onUpdateStop(stop.localId, { wikiUrl: e.target.value })}
              placeholder="Wikipedia URL (optional)"
            />
          </div>
        ))}
      </div>

      <div className="admin-panel-actions">
        {onDeleteTrip &&
          (confirmingDelete ? (
            <>
              <span className="admin-confirm-text">Delete this trip?</span>
              <button type="button" className="add-idea-cancel" onClick={() => setConfirmingDelete(false)}>
                No
              </button>
              <button type="button" className="admin-delete-confirm" onClick={onDeleteTrip}>
                Yes, delete
              </button>
            </>
          ) : (
            <button type="button" className="admin-delete" onClick={() => setConfirmingDelete(true)}>
              Delete trip
            </button>
          ))}
        <button type="button" className="add-idea-cancel" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="add-idea-save" onClick={onSave} disabled={saving || !session.title.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </aside>
  )
}
