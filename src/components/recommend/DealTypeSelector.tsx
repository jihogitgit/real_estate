'use client'
import { Seg } from '@/components/dungji/ds'
import type { DealType } from '@/lib/recommend/age-defaults'

interface Props {
  value: DealType
  onChange: (v: DealType) => void
}

export function DealTypeSelector({ value, onChange }: Props) {
  return (
    <Seg
      items={['매매', '전세']}
      active={value === 'trade' ? 0 : 1}
      onSel={(i) => onChange(i === 0 ? 'trade' : 'jeonse')}
    />
  )
}
