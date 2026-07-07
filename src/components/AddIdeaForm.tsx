import { useState, type FormEvent } from 'react'

interface AddIdeaFormProps {
  onSave: (data: { title: string; note: string; yearSuggestion: number | null }) => void
  onCancel: () => void
}

export default function AddIdeaForm({ onSave, onCancel }: AddIdeaFormProps) {
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const parsedYear = parseInt(year, 10)
    onSave({
      title: title.trim(),
      note: note.trim(),
      yearSuggestion: Number.isFinite(parsedYear) ? parsedYear : null,
    })
  }

  return (
    <form className="add-idea-form glass" onSubmit={handleSubmit}>
      <h3>New idea</h3>
      <input
        type="text"
        placeholder="Where to?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        required
      />
      <input
        type="number"
        placeholder="Year (optional)"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <textarea
        placeholder="Short note (optional)"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="add-idea-actions">
        <button type="button" className="add-idea-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="add-idea-save">
          Drop pin
        </button>
      </div>
    </form>
  )
}
