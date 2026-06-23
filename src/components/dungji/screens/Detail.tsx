'use client'
import { useState, useEffect } from 'react'
import { useStore, DB, RTMS, Trade } from '../store'
import { T, won, Icon, Tag, Delta, Ph, Seg, LineChart, Chip, Button } from '../ds'
import NaverPanorama from '../NaverPanorama'
import type { Complex } from '../store'

function DCard({ children, p = 24, style }: { children: React.ReactNode; p?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.card, borderRadius: T.rCard, border: `1px solid ${T.line}`, padding: p, ...style }}>
      {children}
    </div>
  )
}

function DHead({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: T.ink3 }}>{sub}</div>}
    </div>
  )
}

function KV({ k, v, strong, last }: { k: string; v: React.ReactNode; strong?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: last ? 0 : 12, marginBottom: last ? 0 : 12,
      borderBottom: last ? 'none' : `1px solid ${T.lineSoft}` }}>
      <span style={{ fontSize: 14, color: T.ink3 }}>{k}</span>
      <span style={{ fontSize: 14, fontWeight: strong ? 700 : 500, color: T.ink }}>{v}</span>
    </div>
  )
}

function BellBtn({ id }: { id: string }) {
  const { state, toggleAlarm } = useStore()
  const on = state.alarms.includes(id)
  return (
    <button onClick={() => toggleAlarm(id)} style={{
      display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 18px',
      borderRadius: T.rBtn, border: `1px solid ${on ? T.primary : T.line}`,
      background: on ? T.primarySoft : '#fff', color: on ? T.primary : T.ink2,
      fontFamily: T.font, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    }}>
      <Icon name="bell" size={16} stroke={2.2} color={on ? T.primary : T.ink2} />
      {on ? '알림 설정됨' : '알림'}
    </button>
  )
}

const DEAL_TABS = ['전체', '매매', '전세']
const PERIOD_SEGS = ['3개월', '6개월', '1년']
const CHART_LABELS = [
  ['3개월전', '2개월전', '현재'],
  ['6개월전', '3개월전', '현재'],
  ['1월', '4월', '7월', '10월', '현재'],
]

function genTrades(c: typeof DB.complexes[0]): Trade[] {
  const DATES = ['2026.05.28','2026.05.14','2026.04.30','2026.04.15','2026.04.02','2026.03.18','2026.03.05']
  const FLOORS = [15, 7, 22, 9, 18, 4, 12]
  const VARIANCES = [1, 0.99, 0.98, 0.97, 1.01, 0.995, 0.985]
  return DATES.map((date, i) => {
    const a = c.areas[i % c.areas.length]
    const isSale = i !== 2 && i !== 5
    const base = isSale ? a.sale : a.jeonse
    const price = Math.round(base * VARIANCES[i] / 500) * 500
    return { date, ex: a.ex, py: a.py, floor: FLOORS[i], price, deal: isSale ? '매매' as const : '전세' as const, tag: i === 0 ? '신고가' : '' }
  })
}

export function Detail() {
  const { state, nav, back, seen, toggleFav } = useStore()
  const id = state.route.params?.id
  const fallback = DB.complexes.find((x) => x.id === id) || DB.complexes[0]
  const [c, setC] = useState<Complex>(fallback)
  const [trades, setTrades] = useState<Trade[]>([])
  const [areaIdx, setAreaIdx] = useState(0)
  const [period, setPeriod] = useState(1)
  const [tradeTab, setTradeTab] = useState(0)
  const isFav = state.favs.includes(c.id)

  useEffect(() => {
    if (!id) return
    RTMS.getComplex(id).then((complex) => {
      if (complex) setC(complex)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    seen(c.id)
    RTMS.getTrades(c.id).then((t) => {
      setTrades(t.length ? t : genTrades(c))
    })
  }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const area = c.areas[areaIdx] || c.areas[0]
  const filteredTrades = tradeTab === 0 ? trades : trades.filter((t) => t.deal === DEAL_TABS[tradeTab])
  const seriesLen = period === 0 ? 3 : period === 1 ? 6 : 12
  const baseArea = c.areas[Math.min(1, c.areas.length - 1)]
  const rawSeries = c.series.slice(-seriesLen)
  const series = rawSeries.map(v => parseFloat((v * area.sale / baseArea.sale).toFixed(1)))
  const seriesMax = Math.max(...series)
  const nearby = DB.complexes.filter((x) => x.gu === c.gu && x.id !== c.id).slice(0, 3)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* back bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px' }}>
        <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginLeft: -6, display: 'flex', alignItems: 'center' }}>
          <Icon name="chevL" size={24} color={T.ink} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: T.ink, flex: 1 }}>{c.name}</span>
        <button onClick={() => toggleFav(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
          <Icon name="heart" size={22} color={isFav ? T.up : T.ink3} fill={isFav ? T.up : 'none'} />
        </button>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* hero */}
        <DCard p={0} style={{ overflow: 'hidden' }}>
          {c.xy !== null
            ? <NaverPanorama lat={c.xy[0]} lng={c.xy[1]} h={200} />
            : <Ph h={200} label={c.name} style={{ borderRadius: 0 }} />}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <Tag bg={T.silSoft} color={T.sil}>실거래가</Tag>
              {c.hot && <Tag bg={T.hotSoft} color={T.hot}>HOT</Tag>}
              <Tag>{c.type}</Tag>
              <Tag>{c.gu} · {c.dong}</Tag>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 14, color: T.ink3, marginBottom: 16 }}>
              {c.gu} {c.dong} · {c.built}년{c.hh != null ? ` · ${c.hh.toLocaleString()}세대` : ''}
            </div>
            {/* area chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {c.areas.map((a, i) => (
                <Chip key={i} active={i === areaIdx} onClick={() => setAreaIdx(i)}>{a.py}평</Chip>
              ))}
            </div>
            {/* price */}
            <div style={{ display: 'flex', gap: 24, paddingBottom: 20, borderBottom: `1px solid ${T.line}` }}>
              <div>
                <div style={{ fontSize: 12, color: T.ink3, marginBottom: 2 }}>매매</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.ink }}>{won(area.sale)}</div>
                <Delta pct={area.d} size={13} />
              </div>
              {area.jeonse > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: T.ink3, marginBottom: 2 }}>전세</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: T.ink2 }}>{won(area.jeonse)}</div>
                </div>
              )}
            </div>
            {/* actions */}
            <div style={{ display: 'flex', gap: 8, padding: '16px 0' }}>
              <BellBtn id={c.id} />
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 18px',
                borderRadius: T.rBtn, border: `1px solid ${T.line}`, background: '#fff', color: T.ink2,
                fontFamily: T.font, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Icon name="map" size={16} stroke={2.2} />지도 보기
              </button>
            </div>
          </div>
        </DCard>

        {/* price chart */}
        <DCard>
          <DHead sub={`최고 ${won(Math.round(seriesMax * 10000))}`}>시세 추이</DHead>
          <div style={{ marginBottom: 12 }}>
            <Seg items={PERIOD_SEGS} active={period} onSel={setPeriod} size="sm" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <LineChart data={series} w={560} h={180} color={T.primary} labels={CHART_LABELS[period]} />
          </div>
        </DCard>

        {/* trade history */}
        <DCard>
          <DHead>실거래가 내역</DHead>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {DEAL_TABS.map((t, i) => (
              <Chip key={i} active={i === tradeTab} onClick={() => setTradeTab(i)} color={T.sil}>{t}</Chip>
            ))}
          </div>
          {filteredTrades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: T.ink3, fontSize: 14 }}>데이터가 없습니다</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '88px 52px 48px 1fr 52px', padding: '8px 0',
                borderBottom: `1px solid ${T.line}`, marginBottom: 4 }}>
                {['날짜', '면적', '층', '거래가', '구분'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.ink3 }}>{h}</span>
                ))}
              </div>
              {filteredTrades.map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '88px 52px 48px 1fr 52px',
                  padding: '10px 0', borderBottom: i < filteredTrades.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                  alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.ink3 }}>{t.date}</span>
                  <span style={{ fontSize: 13, color: T.ink2 }}>{t.py}평</span>
                  <span style={{ fontSize: 13, color: T.ink2 }}>{t.floor}층</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>
                    {won(t.price)}
                    {t.tag && <span style={{ marginLeft: 4, fontSize: 11, color: T.up, fontWeight: 700 }}>{t.tag}</span>}
                  </span>
                  <Tag bg={t.deal === '매매' ? T.silSoft : T.primarySoft} color={t.deal === '매매' ? T.sil : T.primary}>
                    {t.deal}
                  </Tag>
                </div>
              ))}
            </>
          )}
        </DCard>

        {/* area price table */}
        <DCard>
          <DHead>면적별 시세</DHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 64px', padding: '8px 0',
            borderBottom: `1px solid ${T.line}`, marginBottom: 4 }}>
            {['면적', '매매가', '전세가', '변동'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.ink3 }}>{h}</span>
            ))}
          </div>
          {c.areas.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 64px',
              padding: '12px 8px', margin: '0 -8px',
              borderRadius: 8, alignItems: 'center',
              background: i === areaIdx ? T.primarySoft : 'transparent',
              borderBottom: i < c.areas.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{a.py}평 ({a.ex}㎡)</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{won(a.sale)}</span>
              <span style={{ fontSize: 14, color: T.ink2 }}>{won(a.jeonse)}</span>
              <Delta pct={a.d} size={12} />
            </div>
          ))}
        </DCard>

        {/* complex info */}
        <DCard>
          <DHead>단지 정보</DHead>
          <KV k="단지명" v={c.name} />
          <KV k="소재지" v={`서울특별시 ${c.gu} ${c.dong}`} />
          <KV k="사용승인" v={`${c.built}년`} />
          <KV k="총 세대수" v={c.hh != null ? `${c.hh.toLocaleString()}세대` : '-'} />
          <KV k="유형" v={c.type} />
          <KV k="건물 코드" v={c.code} last />
        </DCard>

        {/* nearby */}
        {nearby.length > 0 && (
          <DCard>
            <DHead>주변 단지</DHead>
            {nearby.map((nc, i) => (
              <div key={nc.id} onClick={() => nav('detail', { id: nc.id })}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', cursor: 'pointer',
                  borderBottom: i < nearby.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{nc.name}</div>
                  <div style={{ fontSize: 13, color: T.ink3 }}>{nc.gu} · {nc.built}년</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{won(nc.areas[0]?.sale)}</div>
                  <Delta pct={nc.d1} size={12} />
                </div>
              </div>
            ))}
          </DCard>
        )}
      </div>
    </div>
  )
}
