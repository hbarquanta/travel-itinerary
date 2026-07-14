/** Custom icon set replacing platform emoji, so Atlas doesn't lean on
 *  inconsistent OS/browser glyphs. One shared lookup, referenced everywhere
 *  instead of one-off inline SVGs per usage site — see the
 *  custom-icon-set-idea memory note for the design rationale. */

interface CharacterIconProps {
  /** The animal's stored emoji — still the DB value, just used as a lookup key. */
  emoji: string
  /** The circle backdrop color — normally the character's own `Profile.color`. */
  color: string
  size?: number
  className?: string
}

/** Decorative per-animal accent used only where an emoji isn't yet tied to a
 *  real user's chosen color, e.g. the settings picker grid of all 24 options. */
export const CHARACTER_ICON_COLORS: Record<string, string> = {
  '🦊': '#f97316',
  '🐙': '#8b5cf6',
  '🦋': '#22d3ee',
  '🐝': '#f43f5e',
  '🦅': '#a3e635',
  '🧪': '#94a3b8',
  '🐺': '#64748b',
  '🦉': '#a16207',
  '🐢': '#16a34a',
  '🦁': '#d97706',
  '🐯': '#ea580c',
  '🐼': '#57534e',
  '🦄': '#a78bfa',
  '🐸': '#22c55e',
  '🦖': '#65a30d',
  '🐳': '#3b82f6',
  '🦑': '#c026d3',
  '🦩': '#ec4899',
  '🦔': '#92400e',
  '🐨': '#6b7280',
  '🐧': '#1e3a5f',
  '🦆': '#eab308',
  '🦜': '#0d9488',
  '🐬': '#0891b2',
}

function glyphPaths(emoji: string, bg: string) {
  switch (emoji) {
    case '🦊':
      return (
        <>
          <path d="M5 10 L2.3 4.3 L8 8.2 Z" />
          <path d="M19 10 L21.7 4.3 L16 8.2 Z" />
          <path d="M12 5 C7.8 5 5.3 8.2 5.3 11.8 C5.3 15.6 8 19 12 20.6 C16 19 18.7 15.6 18.7 11.8 C18.7 8.2 16.2 5 12 5 Z" />
          <circle cx="9.2" cy="12.3" r="1" fill={bg} />
          <circle cx="14.8" cy="12.3" r="1" fill={bg} />
          <path d="M12 15.3 L10.6 17.2 L13.4 17.2 Z" fill={bg} />
        </>
      )
    case '🐙':
      return (
        <>
          <ellipse cx="12" cy="9" rx="5.5" ry="5" />
          <path d="M7 12 Q5 16 6 19 Q7.5 17 8 14" />
          <path d="M9.5 13 Q8.3 17.5 9 20 Q10.3 18 10.6 14.5" />
          <path d="M12 13.3 Q12 18 12 20.5 Q13 18 13 13.3" />
          <path d="M14.5 13 Q15.7 17.5 15 20 Q13.7 18 13.4 14.5" />
          <path d="M17 12 Q19 16 18 19 Q16.5 17 16 14" />
          <circle cx="9.8" cy="8.5" r="1" fill={bg} />
          <circle cx="14.2" cy="8.5" r="1" fill={bg} />
        </>
      )
    case '🦋':
      return (
        <>
          <path d="M12 8 C10 3 3 3 4 9 C4.5 12 8.5 12.5 12 9.5 Z" />
          <path d="M12 8 C14 3 21 3 20 9 C19.5 12 15.5 12.5 12 9.5 Z" />
          <path d="M12 9.5 C10.5 13 4 14 4.5 19 C5 22 9 21 11.5 16 Z" />
          <path d="M12 9.5 C13.5 13 20 14 19.5 19 C19 22 15 21 12.5 16 Z" />
          <rect x="11.3" y="8" width="1.4" height="12" rx="0.7" />
        </>
      )
    case '🐝':
      return (
        <>
          <ellipse cx="12" cy="14.3" rx="5.2" ry="4.5" />
          <path
            d={`M7.2 11.7 h9.6 M6.9 14.3 h10.2 M7.2 16.9 h9.6`}
            stroke={bg}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M10 6.7 Q8.7 4.7 10.2 3.4" stroke={bg} strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M14 6.7 Q15.3 4.7 13.8 3.4" stroke={bg} strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <ellipse cx="7.6" cy="9.6" rx="3" ry="1.9" opacity="0.95" transform="rotate(-24 7.6 9.6)" />
          <ellipse cx="16.4" cy="9.6" rx="3" ry="1.9" opacity="0.95" transform="rotate(24 16.4 9.6)" />
        </>
      )
    case '🦅':
      return (
        <>
          <path d="M12 6.5 Q3 8.5 1.5 13.5 Q6 12.3 10.3 13.5 L11.2 11.8 Z" />
          <path d="M12 6.5 Q21 8.5 22.5 13.5 Q18 12.3 13.7 13.5 L12.8 11.8 Z" />
          <circle cx="12" cy="9" r="2.6" />
          <path d="M12 9.3 L14.3 9.9 L12 10.8 Z" fill={bg} />
          <circle cx="10.9" cy="8.3" r="0.5" fill={bg} />
        </>
      )
    case '🧪':
      return (
        <>
          <path d="M10 3 h4 M11 3 v6.5 L8 17 a3 3 0 0 0 3 4 h2 a3 3 0 0 0 3 -4 L13 9.5 V3" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.6 15 h6.8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.7 12 h4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case '🐺':
      return (
        <>
          <path d="M6.3 9.5 L4.8 3.3 L10 7.5 Z" />
          <path d="M17.7 9.5 L19.2 3.3 L14 7.5 Z" />
          <path d="M12 5.8 C7.3 5.8 4.7 9.5 4.7 13.5 C4.7 15.6 6 17.2 8 18.5 L7.3 21 L9.6 19.4 C10.3 19.6 11.1 19.7 12 19.7 C12.9 19.7 13.7 19.6 14.4 19.4 L16.7 21 L16 18.5 C18 17.2 19.3 15.6 19.3 13.5 C19.3 9.5 16.7 5.8 12 5.8 Z" />
          <circle cx="9" cy="12.5" r="1" fill={bg} />
          <circle cx="15" cy="12.5" r="1" fill={bg} />
          <path d="M12 15 L10.5 17 L13.5 17 Z" fill={bg} />
        </>
      )
    case '🦉':
      return (
        <>
          <path d="M7 6 L9 9 M17 6 L15 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="12" cy="13" rx="7.5" ry="7" />
          <circle cx="8.7" cy="12" r="3.1" fill={bg} />
          <circle cx="15.3" cy="12" r="3.1" fill={bg} />
          <circle cx="8.7" cy="12" r="1.4" fill="#fff" />
          <circle cx="15.3" cy="12" r="1.4" fill="#fff" />
          <path d="M11 15.5 L13 15.5 L12 17 Z" fill={bg} />
        </>
      )
    case '🐢':
      return (
        <>
          <circle cx="4.3" cy="12.7" r="2.3" />
          <circle cx="3.4" cy="11.8" r="0.5" fill={bg} />
          <ellipse cx="6" cy="9.3" rx="1.6" ry="1.2" transform="rotate(-30 6 9.3)" />
          <ellipse cx="6" cy="16.1" rx="1.6" ry="1.2" transform="rotate(30 6 16.1)" />
          <ellipse cx="20" cy="9.8" rx="1.5" ry="1.1" transform="rotate(25 20 9.8)" />
          <ellipse cx="20" cy="15.6" rx="1.5" ry="1.1" transform="rotate(-25 20 15.6)" />
          <ellipse cx="13" cy="12.7" rx="8" ry="6.3" />
          <path
            d="M13 7 L9.7 10.5 L6.5 12.7 L9.7 15 L13 18.4 L16.3 15 L19.5 12.7 L16.3 10.5 Z"
            stroke={bg}
            strokeWidth="0.9"
            fill="none"
          />
        </>
      )
    case '🦁':
      return (
        <>
          <path d="M12 2 L13.3 6.3 L16.8 3.6 L16.3 8.1 L20.3 6.1 L18 9.9 L22 9.5 L18.5 12 L22 14.5 L18 14.1 L20.3 17.9 L16.3 15.9 L16.8 20.4 L13.3 17.7 L12 22 L10.7 17.7 L7.2 20.4 L7.7 15.9 L3.7 17.9 L6 14.1 L2 14.5 L5.5 12 L2 9.5 L6 9.9 L3.7 6.1 L7.7 8.1 L7.2 3.6 L10.7 6.3 Z" />
          <circle cx="12" cy="12" r="4.3" fill={bg} />
          <circle cx="10.4" cy="11.3" r="0.7" fill="#fff" />
          <circle cx="13.6" cy="11.3" r="0.7" fill="#fff" />
        </>
      )
    case '🐯':
      return (
        <>
          <ellipse cx="12" cy="13" rx="7" ry="6.3" />
          <path d="M7 6 L8.5 9 M17 6 L15.5 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M6.5 11 Q9 10 11 11.5 M6.3 14 Q9 13.3 11.5 14.5 M13 11.3 Q15.5 10.2 17.7 11.3 M12.7 14.3 Q15.3 13.4 17.9 14.6"
            stroke={bg}
            strokeWidth="1"
            fill="none"
          />
          <circle cx="9.3" cy="12" r="0.8" fill={bg} />
          <circle cx="14.7" cy="12" r="0.8" fill={bg} />
        </>
      )
    case '🐼':
      return (
        <>
          <circle cx="6.3" cy="7.3" r="2.6" fill={bg} />
          <circle cx="17.7" cy="7.3" r="2.6" fill={bg} />
          <ellipse cx="12" cy="13" rx="7.2" ry="6.4" />
          <ellipse cx="8.7" cy="12.3" rx="2" ry="2.3" fill={bg} />
          <ellipse cx="15.3" cy="12.3" rx="2" ry="2.3" fill={bg} />
          <ellipse cx="12" cy="15" rx="1.6" ry="1.1" fill={bg} />
        </>
      )
    case '🦄':
      return (
        <>
          <path d="M12 2 L13.8 7.3 L10.2 7.3 Z" />
          <ellipse cx="12" cy="13.7" rx="7" ry="6.2" />
          <path d="M5.7 9.8 Q3.5 7 4 3.7 Q7.3 4.8 8.3 8.3 Z" opacity="0.9" />
          <path d="M18.3 9.8 Q20.5 7 20 3.7 Q16.7 4.8 15.7 8.3 Z" opacity="0.9" />
          <circle cx="9.2" cy="13" r="1" fill={bg} />
          <circle cx="14.8" cy="13" r="1" fill={bg} />
        </>
      )
    case '🐸':
      return (
        <>
          <circle cx="8" cy="7" r="2.6" />
          <circle cx="16" cy="7" r="2.6" />
          <circle cx="8" cy="7" r="1.1" fill={bg} />
          <circle cx="16" cy="7" r="1.1" fill={bg} />
          <ellipse cx="12" cy="14" rx="7.5" ry="5.5" />
          <path d="M7.5 15 Q12 18 16.5 15" stroke={bg} strokeWidth="1.1" fill="none" />
        </>
      )
    case '🦖':
      return (
        <>
          <ellipse cx="12" cy="11.8" rx="7.3" ry="6.3" />
          <path d="M6 15.3 L7.7 18.5 L9.3 15.5 L11 18.7 L12.5 15.5 L14 18.7 L15.7 15.5 L17.3 18.5 L18.7 15.2 Z" fill={bg} />
          <circle cx="8.7" cy="9.8" r="1" fill={bg} />
          <circle cx="15.3" cy="9.8" r="1" fill={bg} />
        </>
      )
    case '🐳':
      return (
        <>
          <path d="M3 14 Q4 7 12 7 Q19 7 20 12 Q20.5 15 17 16.5 L18 19 L15 17.5 Q11 18.5 6.5 16.5 Q3.5 15 3 14 Z" />
          <path
            d="M9 4.5 Q9.5 6 9 7.3 M11.5 3.5 Q12 5.5 11.3 7"
            stroke={bg}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="8" cy="10.5" r="0.8" fill={bg} />
        </>
      )
    case '🦑':
      return (
        <>
          <path d="M12 3 L18 10 Q19 12 17.5 12.5 L12 11 L6.5 12.5 Q5 12 6 10 Z" />
          <path d="M8 12 Q6.5 16 7.3 19.5 Q8.7 17 9.3 14" />
          <path d="M10.3 12.3 Q9.5 17 10.5 20 Q11.5 17.5 11.3 13" />
          <path d="M13.7 12.3 Q14.5 17 13.5 20 Q12.5 17.5 12.7 13" />
          <path d="M16 12 Q17.5 16 16.7 19.5 Q15.3 17 14.7 14" />
          <circle cx="10" cy="8" r="0.9" fill={bg} />
          <circle cx="14" cy="8" r="0.9" fill={bg} />
        </>
      )
    case '🦩':
      return (
        <>
          <path d="M9.3 12.3 Q6.3 8 8.3 4.3 Q9.6 2 12 3.3" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11.6" cy="3.4" r="1" />
          <path d="M14.5 19.5 L13.7 15.7 M17.3 19.5 L17.6 15.7" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" />
          <ellipse cx="15" cy="13.3" rx="4.6" ry="3.7" />
        </>
      )
    case '🦔':
      return (
        <>
          <path d="M9 6 L11.5 10.5 L4 9.5 Z M13 5.7 L13.6 10.7 L18.5 7 Z M16 8.5 L15 12.5 L20.5 11.5 Z M17 13 L14 14.5 L20 17 Z M6 14 L10 14 L7 18.5 Z M4.5 12 L9 12.5 L5.5 16.5 Z" />
          <ellipse cx="12" cy="13" rx="5.5" ry="4.5" />
          <path d="M6 15 L2.5 17 M6.7 12.5 L3 12" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7.3" cy="13.5" r="0.7" fill={bg} />
        </>
      )
    case '🐨':
      return (
        <>
          <circle cx="5.7" cy="9" r="3.6" />
          <circle cx="18.3" cy="9" r="3.6" />
          <circle cx="5.7" cy="9" r="1.6" fill={bg} />
          <circle cx="18.3" cy="9" r="1.6" fill={bg} />
          <circle cx="12" cy="13" r="6.5" />
          <ellipse cx="12" cy="14.7" rx="2" ry="1.5" fill={bg} />
          <circle cx="9.3" cy="11.5" r="0.8" fill={bg} />
          <circle cx="14.7" cy="11.5" r="0.8" fill={bg} />
        </>
      )
    case '🐧':
      return (
        <>
          <path d="M12 3.5 C7 3.5 5 9 5 14 C5 18.5 8 20.5 12 20.5 C16 20.5 19 18.5 19 14 C19 9 17 3.5 12 3.5 Z" />
          <path d="M12 8 C9.3 8 8 11.5 8 14.5 C8 17.3 9.7 18.7 12 18.7 C14.3 18.7 16 17.3 16 14.5 C16 11.5 14.7 8 12 8 Z" fill={bg} />
          <circle cx="9.7" cy="7.5" r="0.8" fill={bg} />
          <circle cx="14.3" cy="7.5" r="0.8" fill={bg} />
          <path d="M10.7 10 L13.3 10 L12 12 Z" fill="#f59e0b" />
        </>
      )
    case '🦆':
      return (
        <>
          <circle cx="13" cy="14" r="6.5" />
          <circle cx="9" cy="7.5" r="4" />
          <path d="M4 8.3 Q7 6.5 9.5 8" fill={bg} />
          <circle cx="7.7" cy="6.8" r="0.7" fill={bg} />
        </>
      )
    case '🦜':
      return (
        <>
          <ellipse cx="13" cy="12" rx="6.5" ry="7" />
          <path d="M6.5 10 Q2 10.5 3 14.5 Q5.5 13.5 7.5 12" />
          <path d="M8.5 4 Q5 2.5 3.5 6 Q6.5 6.5 9 8" fill={bg} />
          <circle cx="11" cy="9" r="0.9" fill={bg} />
          <path d="M17.5 12 Q21.5 12.5 20.5 8 Q18 9.5 16.5 10.5 Z" fill={bg} />
        </>
      )
    case '🐬':
      return (
        <>
          <path d="M2 14 Q6 6 14 7 Q20 7.5 21.5 11 Q18 11 16.5 9.5 Q17.5 12.5 16 15 Q10.5 16.5 5.5 15 Q3 14.5 2 14 Z" />
          <path d="M14.5 7.3 Q16 4.5 19 5 Q18 7.5 16.3 8.7" fill={bg} />
          <circle cx="9" cy="10.3" r="0.8" fill={bg} />
        </>
      )
    default:
      return <circle cx="12" cy="12" r="8" />
  }
}

/** A character's chosen animal as a solid circular badge — colored circle
 *  (their saved `color`) + a simplified white glyph on top. Replaces bare
 *  emoji everywhere a character avatar shows up. */
export function CharacterIcon({ emoji, color, size = 24, className }: CharacterIconProps) {
  return (
    <span
      className={`char-icon${className ? ` ${className}` : ''}`}
      style={{ background: color, width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="#fff" width={size * 0.62} height={size * 0.62}>
        {glyphPaths(emoji, color)}
      </svg>
    </span>
  )
}

interface UIIconProps {
  size?: number
  className?: string
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function CompassIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M16.2 7.8 L13.8 13.8 L10.2 10.2 Z" fill="currentColor" stroke="none" />
      <path d="M13.8 13.8 L7.8 16.2 L10.2 10.2 Z" fill="none" />
    </svg>
  )
}

export function SunIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M12 3 v2.2 M12 18.8 V21 M3 12 h2.2 M18.8 12 H21 M5.6 5.6 l1.6 1.6 M16.8 16.8 l1.6 1.6 M5.6 18.4 l1.6 -1.6 M16.8 7.2 l1.6 -1.6" />
      <circle cx="12" cy="12" r="4.2" />
    </svg>
  )
}

export function MoonIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M20 14.2 A8 8 0 1 1 9.8 4 A6.3 6.3 0 0 0 20 14.2 Z" />
    </svg>
  )
}

export function SettingsIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="6.2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(45 12 12)" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(90 12 12)" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(135 12 12)" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(180 12 12)" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(225 12 12)" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(270 12 12)" />
      <path d="M12 5.4 V3.2" strokeWidth={2.4} transform="rotate(315 12 12)" />
    </svg>
  )
}

export function AddIdeaIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M12 21 C8 16.5 5 13 5 9.2 A7 7 0 0 1 19 9.2 C19 13 16 16.5 12 21 Z" />
      <circle cx="12" cy="9.3" r="2.2" />
    </svg>
  )
}

export function CloseIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  )
}

export function ChevronIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M9 6 L15 12 L9 18" />
    </svg>
  )
}

export function EditIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M4 20 L4.7 16.9 L15.5 6 a2 2 0 0 1 3 3 L7.7 20 Z M13.3 8.2 L16.3 11.2" />
    </svg>
  )
}

export function CheckIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps} strokeWidth={1.8}>
      <path d="M5 12.5 L9.5 17 L19 6.5" />
    </svg>
  )
}
