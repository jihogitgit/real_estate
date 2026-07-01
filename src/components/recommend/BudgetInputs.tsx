'use client'
import { T, won } from '@/components/dungji/ds'

interface Props {
  savings: number
  loan: number
  onSavingsChange: (v: number) => void
  onLoanChange: (v: number) => void
  onOpenLoanModal: () => void
}

const inputStyle = {
  width: 160, height: 44, padding: '0 14px',
  borderRadius: 12, border: `1.5px solid ${T.line}`,
  fontFamily: T.font, fontSize: 15, fontWeight: 700,
  color: T.ink, outline: 'none', background: '#fff',
} satisfies React.CSSProperties

export function BudgetInputs({ savings, loan, onSavingsChange, onLoanChange, onOpenLoanModal }: Props) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: T.ink3, fontFamily: T.font }}>
          보유금액 (만원)
        </label>
        <input
          type="number"
          value={savings}
          min={0}
          step={100}
          onChange={(e) => onSavingsChange(Math.max(0, Number(e.target.value)))}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: T.ink3, fontFamily: T.font }}>
            대출한도 (만원)
          </label>
          <span
            onClick={onOpenLoanModal}
            style={{ fontSize: 12, color: T.primary, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            한도 모르세요? →
          </span>
        </div>
        <input
          type="number"
          value={loan}
          min={0}
          step={100}
          onChange={(e) => onLoanChange(Math.max(0, Number(e.target.value)))}
          style={inputStyle}
        />
      </div>

      <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: T.ink3, fontWeight: 600, fontFamily: T.font, whiteSpace: 'nowrap' }}>
          합계 <b style={{ color: T.ink }}>{won(savings + loan)}</b>
        </span>
      </div>
    </div>
  )
}
