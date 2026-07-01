'use client'
import { useState, useEffect, useMemo } from 'react'
import { T, won } from '@/components/dungji/ds'
import type { RegionStat, DealType } from '@/lib/recommend/age-defaults'

interface Props {
  stats: RegionStat[]
  budget: number      // savings + loan (만원)
  dealType: DealType
}

export function RegionResultTabs({ stats, budget, dealType }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  const filtered = useMemo(() =>
    stats
      .filter(s => budget > 0 && s.avg_price <= budget * 1.3)
      .sort((a, b) => a.avg_price - b.avg_price)
      .slice(0, 10),
    [stats, budget]
  )

  // stats 변경 시 (거래 유형 전환) 첫 번째 탭으로 리셋
  useEffect(() => { setActiveTab(0) }, [stats])

  if (budget === 0) return null

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.ink2, marginBottom: 4 }}>
          예산 범위 내 지역이 없어요
        </div>
        <div style={{ fontSize: 14, color: T.ink3 }}>
          보유금액이나 대출한도를 늘려보세요
        </div>
      </div>
    )
  }

  const current = filtered[activeTab] ?? filtered[0]
  const priceLabel = dealType === 'trade' ? '평균 매매가' : '평균 전세가'

  return (
    <div>
      {/* 지역 탭 스크롤: overflow-x auto + scrollbar hidden */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
        {filtered.map((s, i) => (
          <button key={s.lawd_cd} onClick={() => setActiveTab(i)} style={{
            flexShrink: 0, height: 38, padding: '0 16px', borderRadius: 999,
            border: i === activeTab ? 'none' : `1.5px solid ${T.line}`,
            background: i === activeTab ? T.primary : '#fff',
            color: i === activeTab ? '#fff' : T.ink2,
            fontFamily: T.font, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'all .1s',
          }}>
            {s.name}
          </button>
        ))}
      </div>

      {/* 선택 지역 요약 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        padding: '12px 16px', background: T.primarySoft, borderRadius: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.primary }}>{current.name}</span>
          <span style={{ fontSize: 13, color: T.ink3, marginLeft: 10 }}>
            {priceLabel} {won(current.avg_price)} · 최근 12개월 {current.count.toLocaleString()}건
          </span>
        </div>
        <span style={{ flexShrink: 0, fontSize: 12, padding: '4px 10px',
          background: T.primary, color: '#fff', borderRadius: 999, fontWeight: 700 }}>
          예산 적합 ✓
        </span>
      </div>

      {/* 실거래 카드 그리드 */}
      {current.recent_trades.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 14, color: T.ink3 }}>
          최근 실거래 데이터가 없어요
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {current.recent_trades.map((t, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 14, border: `1px solid ${T.line}`,
              background: '#fff', boxShadow: T.shadowSm }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.apt_nm}
              </div>
              <div style={{ fontSize: 12.5, color: T.ink3, marginBottom: 10 }}>
                전용 {t.area}㎡
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
                {won(t.price)}
              </div>
              <div style={{ fontSize: 12, color: T.ink4, marginTop: 4 }}>
                {t.deal_date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
