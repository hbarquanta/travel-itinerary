interface YearChipsProps {
  years: string[]
  activeYears: Set<string>
  onToggle: (year: string) => void
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
