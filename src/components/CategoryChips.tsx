import type { TripCategory } from '../types'

/** Fixed, small, admin-defined set — not derived from data, so a chip exists
 *  even before the first trip of that category is created. */
export const CATEGORIES: TripCategory[] = ['Friends', 'Solo', 'Family']

interface CategoryChipsProps {
  activeCategories: Set<string>
  onToggle: (category: string) => void
}

export default function CategoryChips({ activeCategories, onToggle }: CategoryChipsProps) {
  return (
    <nav className="year-chips category-chips" aria-label="Filter trips by category">
      {CATEGORIES.map((category) => {
        const active = activeCategories.has(category)
        return (
          <button
            key={category}
            type="button"
            className={`chip${active ? ' active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(category)}
          >
            {category}
          </button>
        )
      })}
    </nav>
  )
}
