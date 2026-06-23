'use client'
import { useState, useEffect } from 'react'
import { T, Icon, Tag, Delta, Spark, Seg, Ph, won } from '../ds'
import { useStore, DB, RTMS } from '../store'
import type { Complex } from '../store'
import { CCard, Empty, FavBtn } from './Nav'

function SectionHead({ title, sub, onAction, action = '전체보기' }: {
  title: string; sub?: string; onAction?: () => void; action?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: -0.7 }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: T.ink3, fontWeight: 500, marginTop: 4 }}>{sub}</div>}
      </div>
      {onAction && (
        <span onClick={onAction} style={{ fontSize: 14, fontWeight: 700, color: T.ink3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
          {action}<Icon name="chevR" size={15} color={T.ink3} />
        </span>
      )}
    </div>
  )
}

function RankRow({ i, c }: { i: number; c: Complex }) {
  const { nav, seen } = useStore()
  const top = c.areas[1] || c.areas[0]
  return (
    <div onClick={() => { seen(c.id); nav('detail', { id: c.id }) }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px', cursor: 'pointer',
        borderBottom: `1px solid ${T.lineSoft}`, borderRadius: 10, transition: 'background .12s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.cardAlt)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      <span style={{ width: 22, textAlign: 'center', fontSize: 16, fontWeight: 800, color: i <= 3 ? T.primary : T.ink3, fontVariantNumeric: 'tabular-nums' }}>{i}</span>
      <Ph label="" w={44} h={44} r={11} tone="#E9EEF3" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: -0.3 }}>{c.name}</div>
        <div style={{ fontSize: 12.5, color: T.ink3, fontWeight: 500 }}>{c.gu} {c.dong} · 전용 {top.ex}㎡</div>
      </div>
      <Spark data={c.spark} color={c.d1 >= 0 ? T.up : T.down} />
      <div style={{ textAlign: 'right', minWidth: 96 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{won(top.sale)}</div>
        <Delta pct={c.d1} size={12} />
      </div>
    </div>
  )
}

function CatTile({ icon, label, color, soft, sub, onClick }: {
  icon: string; label: string; color: string; soft: string; sub: string; onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{ flex: 1, background: '#fff', borderRadius: 18, padding: '20px 18px', cursor: 'pointer',
      border: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform .12s, box-shadow .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadow }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={color} stroke={2.1} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: -0.4 }}>{label}</div>
        <div style={{ fontSize: 13, color: T.ink3, fontWeight: 500, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  )
}

export function Home() {
  const { state, nav, setSearch } = useStore()
  const [q, setQ] = useState('')
  const [deal, setDeal] = useState(0)
  const [list, setList] = useState<Complex[]>(DB.complexes)

  useEffect(() => {
    RTMS.getComplexes({ regions: state.filters.regions }).then(setList)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ranked = [...list].sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1)).slice(0, 5)
  const submit = (e: React.FormEvent) => { e.preventDefault(); setSearch(q); nav('search', { q }) }

  return (
    <div>
      {/* hero */}
      <div style={{ background: 'linear-gradient(160deg,#2A6FE8 0%,#3182F6 60%,#4B92FF 100%)', padding: '52px 0 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1.4, lineHeight: 1.25 }}>내 집 마련, 둥지에서 한눈에</div>
          <div style={{ fontSize: 16.5, color: 'rgba(255,255,255,.86)', fontWeight: 500, marginTop: 10, marginBottom: 26 }}>실거래가 — 단지별 시세와 실거래 내역을 한눈에</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([['통합검색', ''], ['실거래가', 'sil']] as [string, string][]).map(([t, scr], i) => (
              <span key={t} onClick={() => i > 0 && nav(scr)} style={{ padding: '7px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: i === 0 ? 'rgba(255,255,255,.22)' : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,.72)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</span>
            ))}
          </div>
          <form onSubmit={submit} style={{ height: 64, background: '#fff', borderRadius: 16, boxShadow: T.shadowLg,
            display: 'flex', alignItems: 'center', padding: '0 8px 0 22px', gap: 12 }}>
            <Icon name="search" size={24} color={T.ink3} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="아파트 · 지역 · 지하철역으로 검색"
              style={{ flex: 1, border: 'none', outline: 'none', fontFamily: T.font, fontSize: 17, fontWeight: 500, color: T.ink, background: 'transparent' }} />
            <button type="submit" style={{ height: 48, padding: '0 24px', borderRadius: 12, border: 'none', background: T.primary, color: '#fff', fontFamily: T.font, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>검색</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>인기</span>
            {['래미안 원베일리', '헬리오시티', '아크로리버파크', '잠실엘스'].map((k) => (
              <span key={k} onClick={() => { setSearch(k); nav('search', { q: k }) }}
                style={{ padding: '6px 13px', borderRadius: 999, background: 'rgba(255,255,255,.16)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{k}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 32px 64px' }}>
        {/* 카테고리 */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
          <CatTile icon="chart" label="실거래가" sub="매매·전월세 시세" color={T.sil} soft={T.silSoft} onClick={() => nav('sil')} />
          <CatTile icon="map" label="지도매물" sub="지도로 둘러보기" color={T.primary} soft={T.primarySoft} onClick={() => nav('map')} />
        </div>

        {/* 최근 본 단지 */}
        {state.recent.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <SectionHead title="최근 본 단지" />
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {state.recent
                .map((id) => DB.complexes.find((c) => c.id === id))
                .filter((c): c is Complex => !!c)
                .map((c) => <CCard key={c.id} c={c} w={220} />)}
            </div>
          </div>
        )}

        {/* 추천 단지 */}
        <div style={{ marginBottom: 48 }}>
          <SectionHead title="내 관심 지역 추천 단지" sub={state.filters.regions.join(' · ') + ' 기준'} onAction={() => nav('map')} />
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {list.slice(0, 6).map((c) => <CCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* 실거래 HOT */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.5 }}>🔥 이번 주 실거래 HOT</div>
            <Seg items={['매매', '전세']} active={deal} onSel={setDeal} size="sm" />
          </div>
          {ranked.map((c, i) => <RankRow key={c.id} i={i + 1} c={c} />)}
        </div>
      </div>
    </div>
  )
}

export function SearchResults() {
  const { state, nav, seen } = useStore()
  const initialQ = state.route.params.q || state.search || ''
  const [q, setQ] = useState(initialQ)
  const [res, setRes] = useState<Complex[]>([])

  useEffect(() => {
    const t = setTimeout(() => { RTMS.search(q).then(setRes) }, 120)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 64px' }}>
      <div style={{ height: 60, background: '#fff', borderRadius: 16, border: `1.5px solid ${T.primary}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, marginBottom: 24 }}>
        <Icon name="search" size={22} color={T.primary} />
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="아파트 · 지역 검색"
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: T.font, fontSize: 17, fontWeight: 600, color: T.ink, background: 'transparent' }} />
        {q && <button onClick={() => setQ('')} style={{ border: 'none', background: T.bg, width: 28, height: 28, borderRadius: 14, cursor: 'pointer', color: T.ink3, fontSize: 16 }}>✕</button>}
      </div>
      <div style={{ fontSize: 14, color: T.ink3, fontWeight: 600, marginBottom: 14 }}>
        {q ? <span><b style={{ color: T.ink }}>&apos;{q}&apos;</b> 검색결과 {res.length}건</span> : '검색어를 입력하세요'}
      </div>
      {q && res.length === 0 && <Empty title="검색결과가 없어요" sub="단지명이나 지역명으로 다시 검색해보세요" />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {res.map((c) => {
          const top = c.areas[1] || c.areas[0]
          return (
            <div key={c.id} onClick={() => { seen(c.id); nav('detail', { id: c.id }) }}
              style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 16, cursor: 'pointer', border: `1px solid ${T.line}`, background: '#fff', alignItems: 'center' }}>
              <Ph label="" w={64} h={64} r={14} tone="#E9EEF3" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag color={T.ink2} bg={T.lineSoft}>{c.type}</Tag>
                  {c.hot && <Tag color={T.up} bg={T.hotSoft}>HOT</Tag>}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: -0.4, marginTop: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: T.ink3, fontWeight: 500 }}>{c.gu} {c.dong} · {c.built}년{c.hh != null ? ` · ${c.hh.toLocaleString()}세대` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{won(top.sale)}</div>
                <Delta pct={c.d1} />
              </div>
              <FavBtn id={c.id} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
