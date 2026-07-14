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

/** The 10 selectable avatar colors — each real, unique to whoever picks it
 *  (see profiles_color_unique / allowed_users_color_unique in schema.sql).
 *  The first 6 are the group's existing colors (never reorder these without
 *  checking who's already on which one); the last 4 are headroom for more
 *  people or a color change. */
export const CHARACTER_COLOR_OPTIONS = [
  '#f97316', // orange — Fabian
  '#8b5cf6', // violet — Dominik
  '#22d3ee', // cyan — Florian
  '#a3e635', // lime — Mateo
  '#f43f5e', // rose — Michael
  '#94a3b8', // slate — Test
  '#3b82f6', // blue
  '#10b981', // emerald
  '#eab308', // amber
  '#d946ef', // fuchsia
]

/** SVG path data for each character glyph, generated externally (Canva) from
 *  a prompt asking for a simple flat white-silhouette icon per animal — see
 *  the custom-icon-set-idea memory note. Cutout details (eyes, shell seams,
 *  etc.) are real vector holes via each path's own winding direction, not a
 *  painted-over background-color hack, so a single fill="#fff" composites
 *  correctly onto any circle color without per-icon color threading. */
export const CHARACTER_ICON_PATHS: Record<string, string> = {
  "🦊": "M182,138A54,54 0 1 1 74,138A54,54 0 1 1 182,138Z M87.25,102.57L70.64,56.08L108.65,87.59Z M147.35,87.59L185.36,56.08L168.75,102.57Z M108,186L148,186L128,230Z M116,134A7,7 0 1 0 102,134A7,7 0 1 0 116,134Z M154,134A7,7 0 1 0 140,134A7,7 0 1 0 154,134Z",
  "🐙": "M200,110A72,66 0 1 1 56,110A72,66 0 1 1 200,110Z M110,100A10,10 0 1 0 90,100A10,10 0 1 0 110,100Z M166,100A10,10 0 1 0 146,100A10,10 0 1 0 166,100Z M49,150L71,150L62,180L46.2,206L29.8,214L26.2,206L40,180Z M71,150L93,150L88.5,180L76.3,206L61.7,214L56.3,206L66.5,180Z M93,150L115,150L114.5,180L105.5,206L92.5,214L85.5,206L92.5,180Z M117,150L139,150L141,180L134,206L122,214L114,206L119,180Z M141,150L163,150L167.5,180L162.5,206L151.5,214L142.5,206L145.5,180Z M163,150L185,150L193.5,180L191.7,206L182.3,214L171.7,206L171.5,180Z M185,150L207,150L220,180L221.8,206L214.2,214L201.8,206L198,180Z",
  "🦋": "M126,86L100,50L60,36L30,52L34,86L66,104L104,100Z M130,86L156,50L196,36L226,52L222,86L190,104L152,100Z M126,100L96,116L58,120L34,148L48,178L84,178L112,150Z M130,100L160,116L198,120L222,148L208,178L172,178L144,150Z M122,50L108,26L116,24L126,46Z M134,50L148,26L140,24L130,46Z M138,116A10,62 0 1 1 118,116A10,62 0 1 1 138,116Z",
  "🐝": "M100,64L58,42L30,58L38,86L78,92L104,78Z M156,64L198,42L226,58L218,86L178,92L152,78Z M186,138A58,60 0 1 1 70,138A58,60 0 1 1 186,138Z M76,108L76,124L180,124L180,108Z M72,148L72,164L184,164L184,148Z M119,92A7,7 0 1 0 105,92A7,7 0 1 0 119,92Z M151,92A7,7 0 1 0 137,92A7,7 0 1 0 151,92Z M122,198L134,198L128,214Z",
  "🦅": "M176,128A58,58 0 1 1 60,128A58,58 0 1 1 176,128Z M88,76L152,64L148,88Z M168,118L218,132L194,148L206,162L166,150Z M70,80L46,60L82,72Z M132,122A8,8 0 1 0 116,122A8,8 0 1 0 132,122Z",
  "🧪": "M98,28L158,28L158,42L148,42L148,150L146,170L138,190L128,200L118,190L110,170L108,150L108,42L98,42Z M92,26L164,26L164,40L92,40Z M112,150L144,150L144,168L136,184L128,192L120,184L112,168Z M126,140A4,4 0 1 0 118,140A4,4 0 1 0 126,140Z M137,158A3,3 0 1 0 131,158A3,3 0 1 0 137,158Z",
  "🐺": "M192,140A64,64 0 1 1 64,140A64,64 0 1 1 192,140Z M77.57,100.6L79,55.13L119.09,76.62Z M136.91,76.62L177,55.13L178.43,100.6Z M162,190A34,26 0 1 1 94,190A34,26 0 1 1 162,190Z M114,132A8,8 0 1 0 98,132A8,8 0 1 0 114,132Z M158,132A8,8 0 1 0 142,132A8,8 0 1 0 158,132Z M118,198L138,198L128,214Z",
  "🦉": "M196,140A68,72 0 1 1 60,140A68,72 0 1 1 196,140Z M82,78L72,54L102,66Z M174,78L184,54L154,66Z M130,122A34,34 0 1 1 62,122A34,34 0 1 1 130,122Z M194,122A34,34 0 1 1 126,122A34,34 0 1 1 194,122Z M120,204L136,204L128,222Z M111,122A15,15 0 1 0 81,122A15,15 0 1 0 111,122Z M175,122A15,15 0 1 0 145,122A15,15 0 1 0 175,122Z",
  "🐢": "M210,142A82,60 0 1 1 46,142A82,60 0 1 1 210,142Z M154,68A26,26 0 1 1 102,68A26,26 0 1 1 154,68Z M74,166A20,13 0 1 1 34,166A20,13 0 1 1 74,166Z M222,166A20,13 0 1 1 182,166A20,13 0 1 1 222,166Z M93,204A17,12 0 1 1 59,204A17,12 0 1 1 93,204Z M197,204A17,12 0 1 1 163,204A17,12 0 1 1 197,204Z M120,62A6,6 0 1 0 108,62A6,6 0 1 0 120,62Z M148,62A6,6 0 1 0 136,62A6,6 0 1 0 148,62Z M84.76,134.19L91.24,141.81L131.24,107.81L124.76,100.19Z M95.18,183.32L104.82,180.68L92.82,136.68L83.18,139.32Z M156,187L156,177L100,177L100,187Z M172.82,139.32L163.18,136.68L151.18,180.68L160.82,183.32Z M131.24,100.19L124.76,107.81L164.76,141.81L171.24,134.19Z M126.5,142L129.5,142L133,104L123,104Z M127.85,143.49L128.15,140.51L88.5,133.02L87.5,142.98Z M129.23,142.86L126.77,141.14L95.9,179.13L104.1,184.87Z M129.23,141.14L126.77,142.86L151.9,184.87L160.1,179.13Z M127.85,140.51L128.15,143.49L168.5,142.98L167.5,133.02Z",
  "🦁": "M186,128A58,58 0 1 1 70,128A58,58 0 1 1 186,128Z M243,128A27,27 0 1 1 189,128A27,27 0 1 1 243,128Z M231.21,172A27,27 0 1 1 177.21,172A27,27 0 1 1 231.21,172Z M199,204.21A27,27 0 1 1 145,204.21A27,27 0 1 1 199,204.21Z M155,216A27,27 0 1 1 101,216A27,27 0 1 1 155,216Z M111,204.21A27,27 0 1 1 57,204.21A27,27 0 1 1 111,204.21Z M78.79,172A27,27 0 1 1 24.79,172A27,27 0 1 1 78.79,172Z M67,128A27,27 0 1 1 13,128A27,27 0 1 1 67,128Z M78.79,84A27,27 0 1 1 24.79,84A27,27 0 1 1 78.79,84Z M111,51.79A27,27 0 1 1 57,51.79A27,27 0 1 1 111,51.79Z M155,40A27,27 0 1 1 101,40A27,27 0 1 1 155,40Z M199,51.79A27,27 0 1 1 145,51.79A27,27 0 1 1 199,51.79Z M231.21,84A27,27 0 1 1 177.21,84A27,27 0 1 1 231.21,84Z M117,124A7,7 0 1 0 103,124A7,7 0 1 0 117,124Z M153,124A7,7 0 1 0 139,124A7,7 0 1 0 153,124Z M120,146L136,146L128,158Z",
  "🐯": "M188,134A60,60 0 1 1 68,134A60,60 0 1 1 188,134Z M78.85,99.59L76.38,60.28L112.47,76.04Z M143.53,76.04L179.62,60.28L177.15,99.59Z M114,128A8,8 0 1 0 98,128A8,8 0 1 0 114,128Z M158,128A8,8 0 1 0 142,128A8,8 0 1 0 158,128Z M118,152L138,152L128,166Z M64,144L84,136L78,154Z M192,144L172,136L178,154Z",
  "🐼": "M192,132A64,64 0 1 1 64,132A64,64 0 1 1 192,132Z M108,86A30,30 0 1 1 48,86A30,30 0 1 1 108,86Z M208,86A30,30 0 1 1 148,86A30,30 0 1 1 208,86Z M91,86A13,13 0 1 0 65,86A13,13 0 1 0 91,86Z M191,86A13,13 0 1 0 165,86A13,13 0 1 0 191,86Z M120,128A16,16 0 1 0 88,128A16,16 0 1 0 120,128Z M168,128A16,16 0 1 0 136,128A16,16 0 1 0 168,128Z M110,130A6,6 0 1 1 98,130A6,6 0 1 1 110,130Z M158,130A6,6 0 1 1 146,130A6,6 0 1 1 158,130Z M141,156A13,9 0 1 0 115,156A13,9 0 1 0 141,156Z",
  "🦄": "M96,40L112,58L132,50L162,64L194,90L184,106L198,118L172,134L162,154L150,192L140,218L84,218L92,190L80,172L80,172L67.14,162.57L82.29,153.14L69.43,143.71L84.57,134.29L71.71,124.86L86.86,115.43L74,106L89.14,96.57L76.29,87.14L91.43,77.71L78.57,68.29L93.71,58.86L80.86,49.43Z M124,52L140,2L150,60Z M158,88A8,8 0 1 0 142,88A8,8 0 1 0 158,88Z",
  "🐸": "M120,80A28,28 0 1 1 64,80A28,28 0 1 1 120,80Z M192,80A28,28 0 1 1 136,80A28,28 0 1 1 192,80Z M104,80A12,12 0 1 0 80,80A12,12 0 1 0 104,80Z M176,80A12,12 0 1 0 152,80A12,12 0 1 0 176,80Z M200,150A72,58 0 1 1 56,150A72,58 0 1 1 200,150Z M72,180A24,15 0 1 1 24,180A24,15 0 1 1 72,180Z M232,180A24,15 0 1 1 184,180A24,15 0 1 1 232,180Z M116,144A8,8 0 1 0 100,144A8,8 0 1 0 116,144Z M156,144A8,8 0 1 0 140,144A8,8 0 1 0 156,144Z",
  "🦖": "M10,172L50,158L90,132L130,100L168,72L190,80L206,92L216,86L232,98L250,112L228,120L250,130L214,134L200,150L184,164L150,168L160,182L148,190L150,198L168,204L176,238L150,242L144,224L122,228L100,240L82,238L90,202L74,176L30,172Z M241,100A7,7 0 1 0 227,100A7,7 0 1 0 241,100Z",
  "🐳": "M208,140A88,56 0 1 1 32,140A88,56 0 1 1 208,140Z M36,124L6,104L14,132Z M36,156L8,168L16,140Z M96,88L90,58L102,60L104,88Z M112,86L112,54L124,58L120,86Z M96,168L112,196L140,180L116,172Z M185,124A7,7 0 1 0 171,124A7,7 0 1 0 185,124Z",
  "🦑": "M104,36L128,28L152,36L166,66L170,106L160,146L128,176L96,146L86,106L90,66Z M90,80L56,66L62,96L94,104Z M166,80L200,66L194,96L162,104Z M122,96A8,8 0 1 0 106,96A8,8 0 1 0 122,96Z M150,96A8,8 0 1 0 134,96A8,8 0 1 0 150,96Z M89,172L107,172L101.8,202L82.7,230L77.7,230L81.8,202Z M104,172L122,172L120.8,202L106.2,230L101.2,230L100.8,202Z M119,172L137,172L139,202L128,230L123,230L119,202Z M134,172L152,172L157.2,202L149.8,230L144.8,230L137.2,202Z M149,172L167,172L176.2,202L173.3,230L168.3,230L156.2,202Z",
  "🦩": "M186,124A46,38 0 1 1 94,124A46,38 0 1 1 186,124Z M102,120L92,96L96,70L112,50L128,38L120,58L108,78L112,100L122,116Z M138,50A16,16 0 1 1 106,50A16,16 0 1 1 138,50Z M134,42L160,30L152,50L134,54Z M126,158L134,158L130,198L122,236L114,236L122,198Z M96,236L150,236L150,244L96,244Z M131,46A5,5 0 1 0 121,46A5,5 0 1 0 131,46Z",
  "🦔": "M194,142A74,54 0 1 1 46,142A74,54 0 1 1 194,142Z M45,104L56,74L67,104Z M61,104L72,74L83,104Z M77,104L88,58L99,104Z M93,104L104,58L115,104Z M109,104L120,58L131,104Z M125,104L136,58L147,104Z M141,104L152,58L163,104Z M157,104L168,74L179,104Z M173,104L184,74L195,104Z M190,120L214,112L214,128Z M192,120A6,6 0 1 0 180,120A6,6 0 1 0 192,120Z",
  "🐨": "M116,96A40,40 0 1 1 36,96A40,40 0 1 1 116,96Z M220,96A40,40 0 1 1 140,96A40,40 0 1 1 220,96Z M94,96A18,18 0 1 0 58,96A18,18 0 1 0 94,96Z M198,96A18,18 0 1 0 162,96A18,18 0 1 0 198,96Z M192,138A64,64 0 1 1 64,138A64,64 0 1 1 192,138Z M118,132A8,8 0 1 0 102,132A8,8 0 1 0 118,132Z M154,132A8,8 0 1 0 138,132A8,8 0 1 0 154,132Z M143,158A15,11 0 1 0 113,158A15,11 0 1 0 143,158Z",
  "🐧": "M128,40L154,44L176,66L188,100L194,140L192,176L176,200L150,214L128,216L106,214L80,200L64,176L62,140L68,100L80,66L102,44Z M160,148A32,54 0 1 0 96,148A32,54 0 1 0 160,148Z M73,140A15,32 0 1 1 43,140A15,32 0 1 1 73,140Z M213,140A15,32 0 1 1 183,140A15,32 0 1 1 213,140Z M124,222A16,9 0 1 1 92,222A16,9 0 1 1 124,222Z M164,222A16,9 0 1 1 132,222A16,9 0 1 1 164,222Z M114,102L142,102L128,118Z M111,88A7,7 0 1 0 97,88A7,7 0 1 0 111,88Z M159,88A7,7 0 1 0 145,88A7,7 0 1 0 159,88Z",
  "🦆": "M178,158A66,46 0 1 1 46,158A66,46 0 1 1 178,158Z M192,96A42,42 0 1 1 108,96A42,42 0 1 1 192,96Z M188,88L226,78L224,102L190,106Z M52,148L24,140L16,158L38,168L58,162Z M171,84A7,7 0 1 0 157,84A7,7 0 1 0 171,84Z",
  "🦜": "M104,48L120,28L140,36L126,54Z M172,78A38,38 0 1 1 96,78A38,38 0 1 1 172,78Z M170,80L206,66L202,92L172,96Z M108,104L88,130L84,160L96,190L118,210L140,204L124,192L114,176L140,182L168,176L180,158L200,164L214,178L216,158L200,142L196,124L168,104Z M155,70A7,7 0 1 0 141,70A7,7 0 1 0 155,70Z",
  "🐬": "M26.63,112.38L36.38,92.25L49.99,74.51L66.91,59.89L86.43,49L107.76,42.27L130,40L152.24,42.27L173.57,49L193.09,59.89L210.01,74.51L223.62,92.25L233.37,112.38L199.54,124.69L192.98,111.15L183.83,99.22L172.44,89.38L159.31,82.05L144.96,77.53L130,76L115.04,77.53L100.69,82.05L87.56,89.38L76.17,99.22L67.02,111.15L60.46,124.69Z M214,86L240,74L230,98Z M146,44L168,14L178,52Z M46,150L14,132L30,160Z M46,150L18,168L34,180Z M213,92A7,7 0 1 0 199,92A7,7 0 1 0 213,92Z",
}

/** A character's chosen animal as a solid circular badge — colored circle
 *  (their saved `color`) + a white glyph on top. Replaces bare emoji
 *  everywhere a character avatar shows up. */
export function CharacterIcon({ emoji, color, size = 24, className }: CharacterIconProps) {
  const d = CHARACTER_ICON_PATHS[emoji]
  return (
    <span
      className={`char-icon${className ? ` ${className}` : ''}`}
      style={{ background: color, width: size, height: size }}
    >
      <svg viewBox="0 0 256 256" width={size * 0.62} height={size * 0.62}>
        {d ? <path fill="#fff" fillRule="nonzero" d={d} /> : <circle cx="128" cy="128" r="90" fill="#fff" />}
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

export function ChatIcon({ size = 22, className }: UIIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...strokeProps}>
      <path d="M4 12.5 C4 7.8 7.8 4.5 12.5 4.5 C17.2 4.5 20.5 7.8 20.5 12 C20.5 16.2 17.2 19.2 12.5 19.2 C11.3 19.2 10.2 19 9.2 18.6 L5 20 L6.1 16.5 C4.8 15.3 4 13.9 4 12.5 Z" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12.7" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
