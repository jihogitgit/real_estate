'use client'
import { useState } from 'react'
import { T, Icon, Logo, Tag, won } from '../ds'
import { useStore, DB } from '../store'
import type { Complex } from '../store'
import NaverPanorama from '../NaverPanorama'

const NAVS = [
  { k: 'home', label: '홈' },
  { k: 'sil', label: '실거래가' },
  { k: 'map', label: '지도매물' },
]

const NAV_KEY_MAP: Record<string, string> = {
  home: 'home', search: 'home', sil: 'sil', detail: 'sil',
  map: 'map', mypage: 'home', login: 'home',
}

export function AppBar() {
  const { state, nav, home, back, setSearch } = useStore()
  const active = state.route.screen
  const navKey = NAV_KEY_MAP[active] || ''
  const [q, setQ] = useState('')
  const canBack = state.stack.length > 0

  return (
    <div style={{ height: 64, background: '#fff', borderBottom: `1px solid ${T.line}`, display: 'flex',
      alignItems: 'center', gap: 20, padding: '0 28px', position: 'sticky', top: 0, zIndex: 50 }}>
      {canBack && (
        <button onClick={back} title="뒤로" style={{ width: 38, height: 38, borderRadius: 10, border: 'none',
          background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: -6 }}>
          <Icon name="chevL" size={20} color={T.ink2} />
        </button>
      )}
      <div onClick={home} style={{ cursor: 'pointer' }}><Logo size={25} /></div>
      <nav style={{ display: 'flex', gap: 2 }}>
        {NAVS.map((n) => (
          <a key={n.k} onClick={() => nav(n.k)} style={{ padding: '0 13px', height: 38, display: 'flex', alignItems: 'center',
            borderRadius: 9, fontSize: 15, fontWeight: navKey === n.k ? 800 : 600, color: navKey === n.k ? T.ink : T.ink2,
            background: navKey === n.k ? T.bg : 'transparent', cursor: 'pointer', letterSpacing: -0.3, whiteSpace: 'nowrap' }}>
            {n.label}
          </a>
        ))}
      </nav>
      <form onSubmit={(e) => { e.preventDefault(); setSearch(q); nav('search', { q }) }}
        style={{ flex: 1, maxWidth: 340, marginLeft: 'auto', height: 42, background: T.bg, borderRadius: 11,
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
        <Icon name="search" size={19} color={T.ink3} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="아파트 · 지역 검색"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: T.font, fontSize: 14.5, fontWeight: 500, color: T.ink }} />
      </form>
      <button onClick={() => nav('mypage')} title="알림" style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        <Icon name="bell" size={20} color={T.ink2} />
        {state.alarms.length > 0 && <span style={{ position: 'absolute', top: 8, right: 8, minWidth: 7, height: 7, borderRadius: 4, background: T.up }} />}
      </button>
      <button onClick={() => nav(state.auth.in ? 'mypage' : 'login')} style={{ height: 40, padding: '0 13px 0 9px', borderRadius: 10,
        border: `1px solid ${T.line}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <span style={{ width: 26, height: 26, borderRadius: 13, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="user" size={16} color={T.primary} />
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap' }}>{state.auth.in ? state.auth.name : '로그인'}</span>
      </button>
    </div>
  )
}

export function FavBtn({ id, size = 34, float }: { id: string; size?: number; float?: boolean }) {
  const { state, toggleFav } = useStore()
  const on = state.favs.includes(id)
  return (
    <button onClick={(e) => { e.stopPropagation(); toggleFav(id) }} title={on ? '찜 해제' : '찜하기'}
      style={{ width: size, height: size, borderRadius: size / 2, border: float ? 'none' : `1px solid ${T.line}`,
        background: float ? 'rgba(255,255,255,.94)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, boxShadow: float ? T.shadowSm : 'none', transition: 'transform .1s' }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.88)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
      <Icon name="heart" size={size * 0.56} color={on ? T.up : T.ink3} fill={on ? T.up : 'none'} />
    </button>
  )
}

export function CCard({ c, w = 240 }: { c: Complex; w?: number }) {
  const { nav, seen } = useStore()
  const open = () => { seen(c.id); nav('detail', { id: c.id }) }
  const top = c.areas[1] || c.areas[0]
  return (
    <div onClick={open} style={{ width: w, background: '#fff', borderRadius: 18, border: `1px solid ${T.line}`,
      overflow: 'hidden', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow .15s, transform .12s' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
      <div style={{ position: 'relative', height: 140, background: '#E9EEF3', overflow: 'hidden' }}>
        {c.xy !== null
          ? <NaverPanorama lat={c.xy[0]} lng={c.xy[1]} h={140} />
          : null}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 1 }}>
          <Tag color="#fff" bg="rgba(25,31,40,.62)">{c.type}</Tag>
          {c.rankd > 0 && c.rankd <= 5 && <Tag color="#fff" bg="rgba(240,68,82,.92)">실거래 {c.rankd}위</Tag>}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}><FavBtn id={c.id} float /></div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: T.ink3, fontWeight: 600 }}>{c.gu} {c.dong} · {c.built}년</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: -0.5, marginTop: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: T.ink, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{won(top.sale)}</span>
          <span style={{ fontSize: 12, color: top.d > 0 ? T.up : top.d < 0 ? T.down : T.flat, fontWeight: 700 }}>
            {top.d > 0 ? '▲' : top.d < 0 ? '▼' : '–'}{Math.abs(top.d)}%
          </span>
        </div>
        <div style={{ fontSize: 13, color: T.ink2, fontWeight: 600, marginTop: 4 }}>전세 {won(top.jeonse)} · 전용 {top.ex}㎡</div>
      </div>
    </div>
  )
}

export function Empty({ icon = 'search', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: T.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon name={icon} size={30} color={T.ink4} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.ink2 }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: T.ink3, fontWeight: 500, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
      background: T.ink, color: '#fff', padding: '13px 22px', borderRadius: 12, fontSize: 14.5, fontWeight: 700,
      fontFamily: T.font, boxShadow: T.shadowLg }}>{msg}</div>
  )
}

// 실거래 랭킹 리스트 (홈/Sil 공용)
export function Sil() {
  const { nav, seen } = useStore()
  const ranked = [...DB.complexes]
    .filter((c) => c.rankd > 0)
    .sort((a, b) => a.rankd - b.rankd)
    .slice(0, 8)

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 64px' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, letterSpacing: -1, marginBottom: 6 }}>실거래가 랭킹</div>
      <div style={{ fontSize: 15, color: T.ink3, fontWeight: 500, marginBottom: 28 }}>국토부 실거래가 기준, 최근 30일 거래량 순위예요.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {ranked.map((c) => {
          const top = c.areas[1] || c.areas[0]
          return (
            <div key={c.id} onClick={() => { seen(c.id); nav('detail', { id: c.id }) }}
              style={{ background: '#fff', borderRadius: 18, border: `1px solid ${T.line}`, padding: 20, cursor: 'pointer',
                display: 'flex', gap: 16, alignItems: 'center', transition: 'box-shadow .15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = T.shadow)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: c.rankd === 1 ? T.up : T.primarySoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: c.rankd === 1 ? '#fff' : T.primary }}>{c.rankd}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: T.ink3, fontWeight: 600, marginTop: 2 }}>{c.gu} · {c.type}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{won(top.sale)}</div>
                <div style={{ fontSize: 12, color: c.d1 > 0 ? T.up : c.d1 < 0 ? T.down : T.flat, fontWeight: 700 }}>
                  {c.d1 > 0 ? '▲' : c.d1 < 0 ? '▼' : '–'}{Math.abs(c.d1)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
