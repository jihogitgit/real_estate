'use client'
import { useState } from 'react'
import { T, Icon, Button } from '@/components/dungji/ds'
import { calcMaxLoan } from '@/lib/recommend/loan-calc'
import type { DealType } from '@/lib/recommend/age-defaults'

interface Props {
  dealType: DealType
  onApply: (loan: number) => void
  onClose: () => void
}

const NHUF_URL = 'https://nhuf.molit.go.kr'

const ROW_STYLE: React.CSSProperties = {
  display: 'flex', gap: 12, padding: '8px 0',
  borderBottom: `1px solid ${T.lineSoft}`,
}
const KEY_STYLE: React.CSSProperties = {
  flexShrink: 0, width: 88, fontSize: 13, fontWeight: 700, color: T.ink3,
}
const VAL_STYLE: React.CSSProperties = {
  fontSize: 13, color: T.ink, lineHeight: 1.5,
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={ROW_STYLE}>
      <span style={KEY_STYLE}>{k}</span>
      <span style={VAL_STYLE}>{v}</span>
    </div>
  )
}

export function LoanCalculatorModal({ dealType, onApply, onClose }: Props) {
  const [tab, setTab] = useState<'gov' | 'general'>('gov')
  const [income, setIncome] = useState(0)
  const [rate, setRate] = useState(4.0)
  const [term, setTerm] = useState(30)
  const [result, setResult] = useState<number | null>(null)

  const handleCalc = () => setResult(calcMaxLoan(income, rate, term))

  const fieldStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    borderRadius: 12, border: `1.5px solid ${T.line}`,
    fontFamily: T.font, fontSize: 15, fontWeight: 600,
    color: T.ink, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.46)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20,
        padding: 28, boxShadow: T.shadowLg, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: -0.5 }}>
            대출 한도 확인
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: 'none',
            background: T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={16} color={T.ink2} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', gap: 4, background: T.bg, borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {(['gov', 'general'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, height: 36, borderRadius: 7, border: 'none', fontFamily: T.font,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? T.ink : T.ink3,
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}>
              {t === 'gov' ? '정부지원 대출' : '일반 주담대'}
            </button>
          ))}
        </div>

        {tab === 'gov' ? (
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 12 }}>
              {dealType === 'trade' ? '디딤돌대출 (매매)' : '버팀목전세자금대출 (전세)'}
            </div>

            {dealType === 'trade' ? (
              <>
                <InfoRow k="대상" v="무주택 세대주" />
                <InfoRow k="소득 조건" v="부부합산 연 6천만원 이하 (신혼·2자녀 8.5천만원 이하)" />
                <InfoRow k="대출 한도" v="최대 2억원 (신혼·2자녀 이상 3.2억원)" />
                <InfoRow k="기준일" v="2026-07 · nhuf.molit.go.kr 공식 확인" />
              </>
            ) : (
              <>
                <InfoRow k="대상" v="무주택 세대주" />
                <InfoRow k="소득 조건" v="부부합산 연 5천만원 이하 (신혼 7.5천만원 이하)" />
                <InfoRow k="대출 한도" v="수도권 1.2억 / 지방 8천만원" />
                <InfoRow k="기준일" v="2026-07 · nhuf.molit.go.kr 공식 확인" />
              </>
            )}

            <div style={{ marginTop: 14, padding: 12, background: T.lineSoft, borderRadius: 10,
              fontSize: 12.5, color: T.ink3, lineHeight: 1.6 }}>
              ⚠️ 위 조건은 참고용입니다. 실제 한도는 개인 신용·자산·담보에 따라 다릅니다.
            </div>

            <a href={NHUF_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 14 }}>
              <Button kind="ghost" full>주택도시기금 사이트에서 정확한 한도 확인 →</Button>
            </a>

            <div style={{ marginTop: 14, fontSize: 13, color: T.ink3, textAlign: 'center' }}>
              확인 후 대출한도 입력란에 직접 입력하세요
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: T.ink3, marginBottom: 16, lineHeight: 1.6 }}>
              DSR 40% 기준 원리금균등상환으로 계산합니다.
            </div>

            {[
              { label: '연소득 (만원)', key: 'income' as const },
              { label: '금리 (%)',      key: 'rate'   as const },
              { label: '상환기간 (년)', key: 'term'   as const },
            ].map(({ label, key }) => {
              const map = { income: [income, setIncome, 100, 0] as const, rate: [rate, setRate, 0.1, 0.1] as const, term: [term, setTerm, 1, 1] as const }
              const [val, setter, step, min] = map[key]
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.ink3, marginBottom: 6 }}>
                    {label}
                  </label>
                  <input
                    type="number" value={val} min={min} step={step}
                    onChange={(e) => { (setter as (v: number) => void)(Number(e.target.value)); setResult(null) }}
                    style={fieldStyle}
                  />
                </div>
              )
            })}

            <Button kind="line" full onClick={handleCalc}>계산하기</Button>

            {result !== null && (
              <div style={{ marginTop: 18, padding: 18, background: T.primarySoft, borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: T.ink3, marginBottom: 6 }}>최대 대출 한도</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.primary, letterSpacing: -1 }}>
                  {result >= 10000
                    ? `${Math.floor(result / 10000)}억 ${(result % 10000 > 0 ? (result % 10000).toLocaleString() + '만' : '')}`
                    : `${result.toLocaleString()}만원`}
                </div>
                <div style={{ marginTop: 14 }}>
                  <Button kind="primary" full onClick={() => { onApply(result); onClose() }}>
                    이 금액으로 적용
                  </Button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 12, color: T.ink3, lineHeight: 1.6 }}>
              ⚠️ 계산 결과는 참고용이며 실제 한도는 금융기관 심사에 따라 다릅니다.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
