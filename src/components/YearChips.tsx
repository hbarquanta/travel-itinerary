interface YearChipsProps {
  years: number[]
  activeYears: Set<number>
  onToggle: (year: number) => void
}

export default function YearChips({ years, activeYears, onToggle }: YearChipsProps) {
  return (
    <nav className="year-chips" aria-label="Filter trips by year">
      {years.map((year) => {
        const active = activeYears.has(year)
        return (
          <button
            key={year}
            type="button"
            className={`chip${active ? ' active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(year)}
          >
            {year}
          </button>
        )
      })}
    </nav>
  )
}
