'use client'
import { useState, useEffect, useRef } from 'react'
import { T } from '@/components/dungji/ds'
import { AGE_DEFAULTS } from '@/lib/recommend/age-defaults'
import type { AgeGroup, DealType, RegionStat } from '@/lib/recommend/age-defaults'
import { AgeGroupSelector } from './AgeGroupSelector'
import { DealTypeSelector } from './DealTypeSelector'
import { BudgetInputs } from './BudgetInputs'
import { LoanCalculatorModal } from './LoanCalculatorModal'
import { RegionResultTabs } from './RegionResultTabs'

export function RecommendSection() {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('3040')
  const [dealType, setDealType] = useState<DealType>('trade')
  const [savings, setSavings] = useState(AGE_DEFAULTS['3040'].savings)
  const [loan, setLoan] = useState(AGE_DEFAULTS['3040'].loan)
  const [stats, setStats] = useState<RegionStat[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleAgeChange = (age: AgeGroup) => {
    setAgeGroup(age)
    setSavings(AGE_DEFAULTS[age].savings)
    setLoan(AGE_DEFAULTS[age].loan)
  }

  useEffect(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)

    fetch(`/api/recommend/region-stats?type=${dealType}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((data: RegionStat[]) => { setStats(data); setLoading(false) })
      .catch(err => { if (err.name !== 'AbortError') setLoading(false) })

    return () => ctrl.abort()
  }, [dealType])

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: -0.7, marginBottom: 4 }}>
          내 예산으로 살 수 있는 지역
        </div>
        <div style={{ fontSize: 14, color: T.ink3, fontWeight: 500 }}>
          연령대와 예산을 입력하면 실거래가 기반으로 맞는 지역을 찾아드려요
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, padding: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink3, marginBottom: 8 }}>연령대</div>
            <AgeGroupSelector value={ageGroup} onChange={handleAgeChange} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink3, marginBottom: 8 }}>거래 유형</div>
            <DealTypeSelector value={dealType} onChange={setDealType} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink3, marginBottom: 8 }}>예산 입력</div>
          <BudgetInputs
            savings={savings}
            loan={loan}
            onSavingsChange={setSavings}
            onLoanChange={setLoan}
            onOpenLoanModal={() => setShowModal(true)}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: T.ink3, lineHeight: 1.6 }}>
            ⚠️ 기본값은 통계 기반 참고값입니다. 실제 본인의 보유 자산과 대출 가능 금액에 맞게 수정하세요.
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: T.ink3 }}>
            지역 정보를 불러오는 중...
          </div>
        ) : (
          <RegionResultTabs stats={stats} budget={savings + loan} dealType={dealType} />
        )}
      </div>

      {showModal && (
        <LoanCalculatorModal
          dealType={dealType}
          onApply={(v) => { setLoan(v); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
