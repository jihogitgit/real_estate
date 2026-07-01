'use client'
import { T } from '@/components/dungji/ds'
import type { AgeGroup } from '@/lib/recommend/age-defaults'

interface Props {
  value: AgeGroup
  onChange: (v: AgeGroup) => void
}

const AGES: Array<{ key: AgeGroup; label: string }> = [
  { key: '3040', label: '30~40대' },
  { key: '5060', label: '50~60대' },
]

export function AgeGroupSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {AGES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            height: 40, padding: '0 20px', borderRadius: 999,
            border: value === key ? 'none' : `1.5px solid ${T.line}`,
            background: value === key ? T.primary : '#fff',
            color: value === key ? '#fff' : T.ink2,
            fontFamily: T.font, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', transition: 'all .12s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
