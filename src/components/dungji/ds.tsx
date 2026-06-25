'use client'
// 둥지 design system — tokens, icons, shared components (Toss/당근-style)

export const T = {
  primary: '#3182F6', primaryDark: '#2272EB', primarySoft: '#EAF2FE',
  ink: '#191F28', ink2: '#4E5968', ink3: '#8B95A1', ink4: '#B0B8C1',
  line: '#E8EBED', lineSoft: '#F1F3F5',
  bg: '#F2F4F6', card: '#FFFFFF', cardAlt: '#F9FAFB',
  up: '#F04452', down: '#3182F6', flat: '#8B95A1',
  cheong: '#3182F6', cheongSoft: '#EAF2FE',
  sil: '#12B886', silSoft: '#E6F7F0',
  land: '#E8920C', landSoft: '#FDF3E2',
  auc: '#7C5CFC', aucSoft: '#EFEBFE',
  hot: '#FF6B35', hotSoft: '#FFEEE6',
  rCard: 20, rBtn: 12, rChip: 999,
  shadow: '0 1px 2px rgba(0,0,0,.04), 0 6px 20px rgba(17,24,39,.06)',
  shadowSm: '0 1px 2px rgba(0,0,0,.05), 0 3px 10px rgba(17,24,39,.05)',
  shadowLg: '0 2px 6px rgba(0,0,0,.05), 0 16px 40px rgba(17,24,39,.10)',
  font: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
} as const

export function won(manwon: number | null | undefined): string {
  if (manwon == null) return '-'
  const eok = Math.floor(manwon / 10000)
  const man = Math.round(manwon % 10000)
  if (eok && man) return `${eok}억 ${man.toLocaleString()}`
  if (eok) return `${eok}억`
  return `${man.toLocaleString()}만`
}

export function pyeong(m2: number): number {
  return Math.round((m2 / 3.305785) * 10) / 10
}

const ICON_PATHS: Record<string, string> = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  map: 'M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3zM9 3v15M15 6v15',
  pin: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z',
  heart: 'M12 20.5C6 16.5 3 13 3 9.2 3 6.6 5 4.7 7.5 4.7c1.6 0 3 .8 3.7 2 .8-1.2 2.2-2 3.8-2C17.5 4.7 19.5 6.6 19.5 9.2c0 3.8-3 7.3-9 11.3z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 20a2.5 2.5 0 0 0 5 0',
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  chart: 'M4 19V5M4 19h16M8 16l3.5-4 3 2.5L20 8',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4',
  gavel: 'M14 3l4 4-3 3-4-4 3-3zM10 7l4 4-6 6-4-4 6-6zM3 21h8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  chevR: 'M9 6l6 6-6 6', chevD: 'M6 9l6 6 6-6', chevL: 'M15 6l-6 6 6 6',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z',
  filter: 'M3 5h18M6 12h12M10 19h4',
  plus: 'M12 5v14M5 12h14',
  train: 'M7 4h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM5 11h14M8 20l-2 2M16 20l2 2',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  check: 'M5 12.5l4.5 4.5L19 7',
  sliders: 'M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M8 14v4',
  arrUp: 'M12 19V5M6 11l6-6 6 6',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  won: 'M5 6l3 9 4-7 4 7 3-9M4 11h16M4 14h16',
  ruler: 'M3 9l6-6 12 12-6 6L3 9zM7 7l2 2M10 10l2 2M13 7l2 2M16 10l2 2',
  road: 'M4 21l3-18M20 21l-3-18M12 4v2M12 10v2M12 16v2',
  shield: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z',
  scale: 'M12 4v16M7 20h10M5 8l-2.5 6h5L5 8zM19 8l-2.5 6h5L19 8zM5 8h14',
  flag: 'M5 3v18M5 4h11l-2 4 2 4H5',
}

interface IconProps {
  name: string
  size?: number
  stroke?: number
  color?: string
  fill?: string
  style?: React.CSSProperties
}
export function Icon({ name, size = 22, stroke = 2, color = 'currentColor', fill = 'none', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={ICON_PATHS[name] || ''} />
    </svg>
  )
}

export function Logo({ size = 26, color = T.ink }: { size?: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.32, background: T.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" />
        </svg>
      </div>
      <span style={{ fontSize: size * 0.82, fontWeight: 800, color, letterSpacing: -1.2, whiteSpace: 'nowrap' }}>둥지</span>
    </div>
  )
}

interface ChipProps {
  children: React.ReactNode
  active?: boolean
  color?: string
  onClick?: () => void
  icon?: string
}
export function Chip({ children, active, color = T.primary, onClick, icon }: ChipProps) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, height: 36, padding: '0 14px',
      borderRadius: T.rChip, border: active ? 'none' : `1px solid ${T.line}`,
      background: active ? color : '#fff', color: active ? '#fff' : T.ink2,
      fontFamily: T.font, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'all .12s' }}>
      {icon && <Icon name={icon} size={15} stroke={2.2} />}
      {children}
    </button>
  )
}

interface ButtonProps {
  children: React.ReactNode
  kind?: 'primary' | 'ghost' | 'line' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  icon?: string
  style?: React.CSSProperties
  onClick?: () => void
}
export function Button({ children, kind = 'primary', size = 'md', full, icon, style, onClick }: ButtonProps) {
  const H = size === 'lg' ? 56 : size === 'sm' ? 38 : 48
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: T.primary, color: '#fff', border: 'none' },
    ghost: { background: T.primarySoft, color: T.primary, border: 'none' },
    line: { background: '#fff', color: T.ink, border: `1px solid ${T.line}` },
    dark: { background: T.ink, color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} style={{ height: H, padding: `0 ${size === 'lg' ? 24 : 18}px`, borderRadius: T.rBtn,
      fontFamily: T.font, fontSize: size === 'lg' ? 17 : 15, fontWeight: 700, cursor: 'pointer',
      width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 7, ...styles[kind], ...style }}>
      {icon && <Icon name={icon} size={18} stroke={2.2} />}{children}
    </button>
  )
}

interface TagProps {
  children: React.ReactNode
  color?: string
  bg?: string
  style?: React.CSSProperties
}
export function Tag({ children, color = T.ink2, bg = T.lineSoft, style }: TagProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px',
      borderRadius: 6, background: bg, color, fontSize: 12, fontWeight: 700, fontFamily: T.font,
      letterSpacing: -0.2, whiteSpace: 'nowrap', ...style }}>{children}</span>
  )
}

interface DeltaProps { pct?: number; abs?: number; size?: number }
export function Delta({ pct = 0, abs, size = 13 }: DeltaProps) {
  const dir = pct > 0 ? 1 : pct < 0 ? -1 : 0
  const c = dir > 0 ? T.up : dir < 0 ? T.down : T.flat
  const arrow = dir > 0 ? '▲' : dir < 0 ? '▼' : '–'
  return (
    <span style={{ color: c, fontSize: size, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: size - 3 }}>{arrow}</span>
      {abs != null ? won(Math.abs(abs)) : `${Math.abs(pct)}%`}
    </span>
  )
}

interface PhProps {
  label?: string
  w?: number | string
  h?: number | string
  r?: number
  tone?: string
  style?: React.CSSProperties
}
let phId = 0
export function Ph({ label, w = '100%', h = 140, r = 14, tone = '#EEF1F4', style }: PhProps) {
  const id = `ph${++phId}`
  return (
    <div style={{ width: w, height: h, borderRadius: r, overflow: 'hidden', position: 'relative',
      background: tone, flexShrink: 0, ...style }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
        <defs>
          <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#fff" strokeWidth="7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      {label && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        fontFamily: T.mono, fontSize: 11, color: T.ink3, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{label}</span>}
    </div>
  )
}

export function Spark({ data, w = 84, h = 28, color = T.primary }: { data: number[]; w?: number; h?: number; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 4) - 2}`).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LineChart({ data, w = 560, h = 200, color = T.primary, pad = 28, labels, areaTone }:
  { data: number[]; w?: number; h?: number; color?: string; pad?: number; labels?: string[]; areaTone?: string }) {
  const max = Math.max(...data), min = Math.min(...data), rng = (max - min) || 1
  const X = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2)
  const Y = (v: number) => pad / 2 + (1 - (v - min) / rng) * (h - pad * 1.8)
  const line = data.map((v, i) => `${X(i)},${Y(v)}`).join(' ')
  const area = `${X(0)},${h - pad} ` + line + ` ${X(data.length - 1)},${h - pad}`
  const n = labels?.length ?? 0
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {[0, 0.5, 1].map((g, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad / 2 + g * (h - pad * 1.8)} y2={pad / 2 + g * (h - pad * 1.8)}
          stroke={T.lineSoft} strokeWidth="1" />
      ))}
      <polygon points={area} fill={areaTone || 'rgba(49,130,246,.07)'} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => i === data.length - 1 && (
        <circle key={i} cx={X(i)} cy={Y(v)} r="4.5" fill="#fff" stroke={color} strokeWidth="2.6" />
      ))}
      {labels && labels.map((l, i) => (
        <text key={i} x={X(i * Math.round((data.length - 1) / (n - 1)))} y={h - 4}
          fontFamily={T.font} fontSize="11" fill={T.ink3}
          textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{l}</text>
      ))}
    </svg>
  )
}

export function Bars({ data, w = 300, h = 120, color = T.primary, labels }:
  { data: number[]; w?: number; h?: number; color?: string; labels?: string[] }) {
  const max = Math.max(...data) || 1; const n = data.length; const bw = (w / n) * 0.5
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = (v / max) * (h - 24); const x = (i + 0.5) * (w / n) - bw / 2
        return (
          <g key={i}>
            <rect x={x} y={h - 20 - bh} width={bw} height={bh} rx="4" fill={i === n - 1 ? color : '#D8E5FB'} />
            {labels && <text x={x + bw / 2} y={h - 4} fontFamily={T.font} fontSize="11" fill={T.ink3} textAnchor="middle">{labels[i]}</text>}
          </g>
        )
      })}
    </svg>
  )
}

export function Seg({ items, active = 0, onSel, size = 'md' }:
  { items: string[]; active?: number; onSel?: (i: number) => void; size?: 'sm' | 'md' }) {
  const H = size === 'sm' ? 34 : 40
  return (
    <div style={{ display: 'inline-flex', background: T.bg, borderRadius: 12, padding: 4, gap: 2 }}>
      {items.map((it, i) => (
        <button key={i} onClick={() => onSel?.(i)} style={{ height: H, padding: '0 16px', border: 'none',
          borderRadius: 9, background: i === active ? '#fff' : 'transparent', color: i === active ? T.ink : T.ink3,
          fontFamily: T.font, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: i === active ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{it}</button>
      ))}
    </div>
  )
}
