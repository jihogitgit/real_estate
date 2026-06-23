'use client'
import { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react'

// ─── types ───────────────────────────────────────────────────
export interface Area { ex: number; py: number; sale: number; jeonse: number; d: number }
export interface Complex {
  id: string; name: string; gu: string; dong: string; code: string
  built: number; hh: number | null; type: string; d1: number; rankd: number; hot: boolean
  xy: [number, number] | null; areas: Area[]; spark: number[]; series: number[]
}
export interface Trade {
  date: string; ex: number; py: number; floor: number; price: number; deal: string; tag: string
}
export interface Cheong {
  id: string; name: string; loc: string; sido: string; type: string
  when: string; dday: number; cmp: number; py: string; price: string; status: string
}
export interface Auction {
  id: string; name: string; court: string; caseNo: string; type: string
  appr: number; low: number; rate: number; when: string; dday: number
  tries: number; ex: number | string; floor: string; built: number | string
}
export interface Land {
  id: string; name: string; gu: string; dong: string; jimok: string
  area: number; py: number; use: string; price: number; gongsi: number
  road: string; shape: string; gongsiSeries: number[]
}
export interface Auth { in: boolean; name: string; gajeom: number; noHouse: number; depend: number; period: number }
export interface Filters { deal: string; sort: string; priceMax: number | null; areaType: string; regions: string[] }
export interface Route { screen: string; params: Record<string, string> }
export interface AppState {
  route: Route; stack: Route[]
  favs: string[]; recent: string[]; alarms: string[]
  auth: Auth
  settings: { priceAlert: boolean; cheongAlert: boolean; aucAlert: false; weekly: boolean }
  filters: Filters; search: string
}

// ─── mock fallback data ───────────────────────────────────────
export const DB = {
  complexes: [
    { id: 'c1', name: '래미안 원베일리', gu: '서초구', dong: '반포동', code: '11650', built: 2023, hh: 2990, type: '아파트', d1: 3.2, rankd: 2, hot: true, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 318000, jeonse: 178000, d: 2.1 }, { ex: 84.9, py: 25, sale: 420000, jeonse: 230000, d: 3.2 }, { ex: 114.9, py: 35, sale: 560000, jeonse: 300000, d: 1.4 }],
      spark: [38,39,40.5,41,40,41.5,42], series: [33.8,34.5,35.2,36.8,37.1,38.5,39.2,38.8,40.1,41.0,41.5,42.0] },
    { id: 'c2', name: '헬리오시티', gu: '송파구', dong: '가락동', code: '11710', built: 2018, hh: 9510, type: '아파트', d1: -1.1, rankd: -1, hot: true, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 168000, jeonse: 92000, d: -0.4 }, { ex: 84.9, py: 25, sale: 232000, jeonse: 125000, d: -1.1 }, { ex: 110.0, py: 33, sale: 310000, jeonse: 160000, d: -0.8 }],
      spark: [25,24.6,24,23.7,23.5,23.2,23.2], series: [26,25.8,25.4,25,24.6,24.2,24,23.8,23.6,23.4,23.3,23.2] },
    { id: 'c3', name: '마포래미안푸르지오', gu: '마포구', dong: '아현동', code: '11440', built: 2014, hh: 3885, type: '아파트', d1: 0.8, rankd: 1, hot: true, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 142000, jeonse: 86000, d: 0.6 }, { ex: 84.9, py: 25, sale: 188000, jeonse: 108000, d: 0.8 }],
      spark: [18,18.2,18.5,18.4,18.6,18.7,18.8], series: [17,17.2,17.5,17.7,18,18.1,18.3,18.4,18.5,18.6,18.7,18.8] },
    { id: 'c4', name: '아크로리버파크', gu: '서초구', dong: '반포동', code: '11650', built: 2016, hh: 1612, type: '아파트', d1: 2.4, rankd: 3, hot: true, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 360000, jeonse: 200000, d: 2.0 }, { ex: 84.9, py: 25, sale: 480000, jeonse: 240000, d: 2.4 }, { ex: 129.9, py: 39, sale: 720000, jeonse: 360000, d: 1.8 }],
      spark: [44,45,46,46.5,47,47.5,48], series: [42,43,44,44.5,45,45.5,46,46.5,47,47.5,47.8,48] },
    { id: 'c5', name: '잠실엘스', gu: '송파구', dong: '잠실동', code: '11710', built: 2008, hh: 5678, type: '아파트', d1: -0.4, rankd: -2, hot: false, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 195000, jeonse: 105000, d: -0.2 }, { ex: 84.8, py: 25, sale: 268000, jeonse: 142000, d: -0.4 }],
      spark: [27.5,27.3,27,26.9,26.8,26.8,26.8], series: [28,27.8,27.5,27.3,27,26.9,26.8,26.8,26.8,26.8,26.8,26.8] },
    { id: 'c6', name: 'DMC파크뷰자이', gu: '서대문구', dong: '남가좌동', code: '11410', built: 2015, hh: 4300, type: '아파트', d1: 1.6, rankd: 5, hot: false, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 102000, jeonse: 64000, d: 1.2 }, { ex: 84.9, py: 25, sale: 142000, jeonse: 86000, d: 1.6 }],
      spark: [13.4,13.6,13.8,14,14,14.1,14.2], series: [12.8,13,13.2,13.4,13.6,13.7,13.9,14,14.05,14.1,14.15,14.2] },
    { id: 'c7', name: '고덕 그라시움', gu: '강동구', dong: '고덕동', code: '11740', built: 2019, hh: 4932, type: '아파트', d1: 1.1, rankd: 8, hot: false, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 118000, jeonse: 72000, d: 0.9 }, { ex: 84.9, py: 25, sale: 158000, jeonse: 95000, d: 1.1 }],
      spark: [15,15.2,15.4,15.5,15.6,15.7,15.8], series: [14.4,14.6,14.8,15,15.2,15.3,15.5,15.6,15.65,15.7,15.75,15.8] },
    { id: 'c8', name: '경희궁자이', gu: '종로구', dong: '홍파동', code: '11110', built: 2017, hh: 2533, type: '아파트', d1: 2.0, rankd: 6, hot: false, xy: null,
      areas: [{ ex: 59.9, py: 18, sale: 168000, jeonse: 98000, d: 1.6 }, { ex: 84.9, py: 25, sale: 228000, jeonse: 128000, d: 2.0 }],
      spark: [21,21.4,21.8,22,22.3,22.6,22.8], series: [20,20.4,20.8,21.2,21.5,21.8,22,22.2,22.4,22.6,22.7,22.8] },
  ] as Complex[],
  trades: {
    c1: [
      { date: '2026.05.28', ex: 84.9, py: 25, floor: 18, price: 420000, deal: '매매', tag: '' },
      { date: '2026.05.21', ex: 84.9, py: 25, floor: 7, price: 412000, deal: '매매', tag: '' },
      { date: '2026.05.14', ex: 59.9, py: 18, floor: 24, price: 318000, deal: '매매', tag: '신고가' },
      { date: '2026.05.09', ex: 84.9, py: 25, floor: 12, price: 230000, deal: '전세', tag: '' },
      { date: '2026.04.30', ex: 84.9, py: 25, floor: 3, price: 405000, deal: '매매', tag: '' },
      { date: '2026.04.22', ex: 114.9, py: 35, floor: 31, price: 560000, deal: '매매', tag: '' },
      { date: '2026.04.15', ex: 59.9, py: 18, floor: 9, price: 178000, deal: '전세', tag: '' },
    ],
  } as Record<string, Trade[]>,
  cheong: [
    { id: 'h1', name: '동탄2신도시 A-103', loc: '경기 화성시', sido: '경기', type: '민영', when: 'D-2', dday: 2, cmp: 48.3, py: '59~84㎡', price: '5.2억~', status: '접수중' },
    { id: 'h2', name: '올림픽파크 포레온', loc: '서울 강동구', sido: '서울', type: '민영', when: 'D-5', dday: 5, cmp: 132.7, py: '84㎡', price: '13.4억~', status: '예정' },
    { id: 'h3', name: '검단신도시 AB14', loc: '인천 서구', sido: '인천', type: '공공', when: 'D-9', dday: 9, cmp: 12.1, py: '74~84㎡', price: '4.1억~', status: '예정' },
    { id: 'h4', name: '북위례 sH 무순위', loc: '경기 하남시', sido: '경기', type: '공공', when: 'D-1', dday: 1, cmp: 211.0, py: '59㎡', price: '6.8억~', status: '접수중' },
    { id: 'h5', name: '청량리 롯데캐슬', loc: '서울 동대문구', sido: '서울', type: '민영', when: 'D-12', dday: 12, cmp: 64.5, py: '59~84㎡', price: '9.8억~', status: '예정' },
  ] as Cheong[],
  auction: [
    { id: 'a1', name: '성남시 분당구 정자동 아파트', court: '수원지방법원', caseNo: '2025타경34521', type: '아파트', appr: 380000, low: 186200, rate: 49, when: 'D-2', dday: 2, tries: 2, ex: 84.9, floor: '12/25', built: 2009 },
    { id: 'a2', name: '강남구 역삼동 오피스텔', court: '서울중앙지법', caseNo: '2025타경11203', type: '오피스텔', appr: 38000, low: 26600, rate: 70, when: 'D-3', dday: 3, tries: 1, ex: 29.7, floor: '8/15', built: 2016 },
    { id: 'a3', name: '용인시 처인구 토지', court: '수원지법 용인', caseNo: '2025타경8842', type: '토지', appr: 145000, low: 71050, rate: 49, when: 'D-6', dday: 6, tries: 2, ex: 661, floor: '-', built: '-' },
  ] as Auction[],
  land: [
    { id: 'l1', name: '능원리 산 24-7 농지', gu: '용인시 처인구', dong: '모현읍', jimok: '전', area: 992, py: 300, use: '계획관리지역', price: 38500, gongsi: 28960, road: '8m', shape: '정방형·평지', gongsiSeries: [186,192,205,218,224,235,248,256,262,271,280,292] },
    { id: 'l2', name: '도척면 대지 501', gu: '광주시', dong: '도척면', jimok: '대', area: 330, py: 100, use: '계획관리지역', price: 14500, gongsi: 11200, road: '6m', shape: '세장형·평지', gongsiSeries: [98,102,108,115,120,128,135,140,145,150,158,165] },
  ] as Land[],
}

export const REGIONS = ['강남구', '서초구', '송파구', '마포구', '서대문구', '강동구', '종로구']

// ─── data adapter (replace internals with real fetch when DB populated) ───
function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

export const RTMS = {
  async getComplexes({ regions }: { regions?: string[] } = {}): Promise<Complex[]> {
    try {
      const res = await fetch(`/api/dungji/complexes${regions?.length ? `?regions=${regions.join(',')}` : ''}`)
      if (res.ok) { const d = await res.json(); if (d?.length) return d }
    } catch {}
    await wait(80)
    if (!regions?.length) return DB.complexes
    return DB.complexes.filter((c) => regions.includes(c.gu))
  },
  async getComplex(id: string): Promise<Complex | undefined> {
    try {
      const res = await fetch(`/api/dungji/complexes/${id}`)
      if (res.ok) { const d = await res.json(); if (d?.id) return d }
    } catch {}
    await wait(60)
    return DB.complexes.find((c) => c.id === id)
  },
  async getTrades(id: string): Promise<Trade[]> {
    try {
      const res = await fetch(`/api/dungji/trades?id=${id}`)
      if (res.ok) { const d = await res.json(); if (d?.length) return d }
    } catch {}
    await wait(80)
    return DB.trades[id] || DB.trades.c1
  },
  async getCheong(): Promise<Cheong[]> {
    try {
      const res = await fetch('/api/dungji/cheong')
      if (res.ok) { const d = await res.json(); if (d?.length) return d }
    } catch {}
    await wait(60)
    return DB.cheong
  },
  async getAuctions(): Promise<Auction[]> {
    await wait(60); return DB.auction
  },
  async getLand(id: string): Promise<Land> {
    await wait(60); return DB.land.find((l) => l.id === id) || DB.land[0]
  },
  async search(q: string): Promise<Complex[]> {
    const k = q.trim(); if (!k) return []
    try {
      const res = await fetch(`/api/dungji/complexes?q=${encodeURIComponent(k)}`)
      if (res.ok) { const d = await res.json(); if (d?.length) return d }
    } catch {}
    await wait(40)
    return DB.complexes.filter((c) => (c.name + c.gu + c.dong).includes(k))
  },
}

// ─── reducer ─────────────────────────────────────────────────
type Action =
  | { type: 'NAV'; screen: string; params?: Record<string, string> }
  | { type: 'BACK' } | { type: 'HOME' }
  | { type: 'TOGGLE_FAV'; id: string } | { type: 'SEEN'; id: string }
  | { type: 'TOGGLE_ALARM'; id: string }
  | { type: 'LOGIN'; name?: string } | { type: 'LOGOUT' }
  | { type: 'SET_GAJEOM'; patch: Partial<Auth> }
  | { type: 'SET_SETTING'; key: string; val: boolean }
  | { type: 'SET_FILTER'; patch: Partial<Filters> }
  | { type: 'SEARCH'; q: string }

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'NAV': {
      if (s.route.screen === a.screen && JSON.stringify(s.route.params) === JSON.stringify(a.params || {})) return s
      return { ...s, stack: [...s.stack, s.route], route: { screen: a.screen, params: a.params || {} } }
    }
    case 'BACK': {
      if (!s.stack.length) return { ...s, route: { screen: 'home', params: {} } }
      const stack = [...s.stack]; const prev = stack.pop()!
      return { ...s, stack, route: prev }
    }
    case 'HOME': return { ...s, stack: [], route: { screen: 'home', params: {} } }
    case 'TOGGLE_FAV': {
      const has = s.favs.includes(a.id)
      return { ...s, favs: has ? s.favs.filter((x) => x !== a.id) : [a.id, ...s.favs] }
    }
    case 'SEEN': return { ...s, recent: [a.id, ...s.recent.filter((x) => x !== a.id)].slice(0, 12) }
    case 'TOGGLE_ALARM': {
      const has = s.alarms.includes(a.id)
      return { ...s, alarms: has ? s.alarms.filter((x) => x !== a.id) : [a.id, ...s.alarms] }
    }
    case 'LOGIN': return { ...s, auth: { ...s.auth, in: true, name: a.name || '김둥지' } }
    case 'LOGOUT': return { ...s, auth: { ...s.auth, in: false } }
    case 'SET_GAJEOM': return { ...s, auth: { ...s.auth, ...a.patch } }
    case 'SET_SETTING': return { ...s, settings: { ...s.settings, [a.key]: a.val } }
    case 'SET_FILTER': return { ...s, filters: { ...s.filters, ...a.patch } }
    case 'SEARCH': return { ...s, search: a.q }
    default: return s
  }
}

// ─── store context ────────────────────────────────────────────
const LS_KEY = 'dungji_v1'
function loadPersist(): Partial<AppState> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {} } catch { return {} }
}
function savePersist(p: object) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch {}
}

function makeInitial(): AppState {
  const p = loadPersist()
  return {
    route: { screen: 'home', params: {} },
    stack: [],
    favs: (p.favs as string[]) || [],
    recent: (p.recent as string[]) || [],
    alarms: (p.alarms as string[]) || [],
    auth: (p.auth as Auth) || { in: false, name: '', gajeom: 64, noHouse: 12, depend: 2, period: 15 },
    settings: (p.settings as AppState['settings']) || { priceAlert: true, cheongAlert: true, aucAlert: false, weekly: true },
    filters: { deal: 'sale', sort: 'rtms', priceMax: null, areaType: 'all', regions: ['강남구', '서초구', '송파구'] },
    search: '',
  }
}

interface StoreAPI {
  state: AppState
  scroller: React.RefObject<HTMLDivElement | null>
  nav: (screen: string, params?: Record<string, string>) => void
  back: () => void
  home: () => void
  toggleFav: (id: string) => void
  seen: (id: string) => void
  toggleAlarm: (id: string) => void
  login: (name?: string) => void
  logout: () => void
  setGajeom: (patch: Partial<Auth>) => void
  setSetting: (key: string, val: boolean) => void
  setFilter: (patch: Partial<Filters>) => void
  setSearch: (q: string) => void
}

const StoreCtx = createContext<StoreAPI | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitial)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    savePersist({ favs: state.favs, recent: state.recent, alarms: state.alarms, auth: state.auth, settings: state.settings })
  }, [state.favs, state.recent, state.alarms, state.auth, state.settings])

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
  }, [state.route])

  const api = useMemo<StoreAPI>(() => ({
    state,
    scroller,
    nav: (screen, params) => dispatch({ type: 'NAV', screen, params }),
    back: () => dispatch({ type: 'BACK' }),
    home: () => dispatch({ type: 'HOME' }),
    toggleFav: (id) => dispatch({ type: 'TOGGLE_FAV', id }),
    seen: (id) => dispatch({ type: 'SEEN', id }),
    toggleAlarm: (id) => dispatch({ type: 'TOGGLE_ALARM', id }),
    login: (name) => dispatch({ type: 'LOGIN', name }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    setGajeom: (patch) => dispatch({ type: 'SET_GAJEOM', patch }),
    setSetting: (key, val) => dispatch({ type: 'SET_SETTING', key, val }),
    setFilter: (patch) => dispatch({ type: 'SET_FILTER', patch }),
    setSearch: (q) => dispatch({ type: 'SEARCH', q }),
  }), [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
