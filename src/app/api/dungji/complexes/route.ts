// src/app/api/dungji/complexes/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const GU_MAP: Record<string, string> = {
  '11110': '종로구', '11140': '중구', '11170': '용산구', '11200': '성동구',
  '11215': '광진구', '11230': '동대문구', '11260': '중랑구', '11290': '성북구',
  '11305': '강북구', '11320': '도봉구', '11350': '노원구', '11380': '은평구',
  '11410': '서대문구', '11440': '마포구', '11470': '양천구', '11500': '강서구',
  '11530': '구로구', '11545': '금천구', '11560': '영등포구', '11590': '동작구',
  '11620': '관악구', '11650': '서초구', '11680': '강남구', '11710': '송파구',
  '11740': '강동구',
  '28110': '중구', '28140': '동구', '28177': '미추홀구', '28185': '연수구',
  '28200': '남동구', '28237': '부평구', '28245': '계양구', '28260': '서구',
  '41': '경기',
}

const BUCKETS = [
  { py: 18, ex: 59.9, min: 0,   max: 65  },
  { py: 25, ex: 84.9, min: 65,  max: 95  },
  { py: 33, ex: 114.9, min: 95, max: 120 },
  { py: 39, ex: 129.9, min: 120, max: Infinity },
]

function bucket(area: number) {
  return BUCKETS.find((b) => area >= b.min && area < b.max) ?? BUCKETS[1]
}

function monthKey(dateStr: string): string {
  return dateStr.replace(/-/g, '').slice(0, 6)
}

function lastNMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((s, v) => s + v, 0) / nums.length)
}

function guName(lawdCd: string | number | null): string {
  const s = String(lawdCd ?? '').slice(0, 5)
  return GU_MAP[s] ?? s
}

function buildComplex(
  p: Record<string, unknown>,
  trades: Record<string, unknown>[],
  jeonses: Record<string, unknown>[],
  rankd: number,
  months12: string[],
) {
  type BucketStats = { sales: number[]; jeonseAmts: number[] }
  const stats = new Map<number, BucketStats>()

  for (const t of trades) {
    const b = bucket(Number(t.area ?? 0))
    if (!stats.has(b.py)) stats.set(b.py, { sales: [], jeonseAmts: [] })
    stats.get(b.py)!.sales.push(Number(t.price ?? 0))
  }
  for (const t of jeonses) {
    const b = bucket(Number(t.area ?? 0))
    if (!stats.has(b.py)) stats.set(b.py, { sales: [], jeonseAmts: [] })
    stats.get(b.py)!.jeonseAmts.push(Number(t.deposit ?? 0))
  }

  const areas = BUCKETS
    .filter((b) => stats.has(b.py))
    .map((b) => {
      const s = stats.get(b.py)!
      return { ex: b.ex, py: b.py, sale: avg(s.sales), jeonse: avg(s.jeonseAmts), d: 0 }
    })

  if (!areas.length) areas.push({ ex: 84.9, py: 25, sale: 0, jeonse: 0, d: 0 })

  const mainPy = areas[Math.min(1, areas.length - 1)].py
  const monthly = new Map<string, number[]>()
  for (const t of trades) {
    if (bucket(Number(t.area ?? 0)).py !== mainPy) continue
    const mk = monthKey(String(t.deal_date ?? ''))
    if (!mk || mk.length < 6) continue
    if (!monthly.has(mk)) monthly.set(mk, [])
    monthly.get(mk)!.push(Number(t.price ?? 0))
  }

  let lastVal = 0
  const series = months12.map((mk) => {
    const prices = monthly.get(mk)
    if (prices?.length) { lastVal = avg(prices); return lastVal }
    return lastVal
  })

  const d1 = series[series.length - 2] > 0
    ? parseFloat(((series[series.length - 1] - series[series.length - 2]) / series[series.length - 2] * 100).toFixed(1))
    : 0

  const areasWithDelta = areas.map((a) => {
    const prevMonthBucketKey = months12[months12.length - 2]
    const curMonthBucketKey = months12[months12.length - 1]
    const prevPrices: number[] = [], curPrices: number[] = []
    for (const t of trades) {
      const b = bucket(Number(t.area ?? 0))
      if (b.py !== a.py) continue
      const mk = monthKey(String(t.deal_date ?? ''))
      if (mk === prevMonthBucketKey) prevPrices.push(Number(t.price ?? 0))
      if (mk === curMonthBucketKey) curPrices.push(Number(t.price ?? 0))
    }
    const prevAvg = avg(prevPrices), curAvg = avg(curPrices)
    const d = (prevAvg > 0 && curAvg > 0)
      ? parseFloat(((curAvg - prevAvg) / prevAvg * 100).toFixed(1))
      : 0
    return { ...a, d }
  })

  return {
    id: String(p.id),
    name: String(p.name ?? ''),
    gu: guName(p.lawd_cd as string | number | null),
    dong: String(p.umd_nm ?? ''),
    code: String(p.lawd_cd ?? ''),
    built: Number(p.build_year ?? 0),
    hh: null,
    type: String(p.type ?? '아파트'),
    d1,
    rankd,
    hot: rankd > 0 && rankd <= 3,
    xy: (p.geocoded_at && p.lat != null && p.lng != null)
      ? [Number(p.lat), Number(p.lng)] as [number, number]
      : null,
    areas: areasWithDelta,
    spark: series.slice(-7),
    series,
  }
}

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const q      = searchParams.get('q') ?? ''

  const supabase = makeSupabase()

  let propQ = supabase
    .from('properties')
    .select('id, name, type, lawd_cd, umd_nm, build_year, lat, lng, geocoded_at')
    .range(offset, offset + limit - 1)

  if (q) propQ = propQ.ilike('name', `%${q}%`)

  const { data: properties, error: propErr } = await propQ
  if (propErr) return NextResponse.json({ error: propErr.message }, { status: 500 })
  if (!properties?.length) return NextResponse.json([])

  const ids = properties.map((p) => p.id)
  const months12 = lastNMonths(12)
  const months13 = lastNMonths(13)
  const cutoff = months13[0] + '01'

  const [{ data: trades }, { data: jeonses }] = await Promise.all([
    supabase
      .from('transactions')
      .select('property_id, area, price, deal_date')
      .in('property_id', ids)
      .eq('deal_kind', 'trade')
      .gte('deal_date', cutoff),
    supabase
      .from('transactions')
      .select('property_id, area, deposit, deal_date')
      .in('property_id', ids)
      .eq('deal_kind', 'jeonse')
      .gte('deal_date', cutoff),
  ])

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff30 = monthKey(thirtyDaysAgo.toISOString())

  const tradesByProp = new Map<number, typeof trades>()
  for (const t of trades ?? []) {
    if (!tradesByProp.has(t.property_id)) tradesByProp.set(t.property_id, [])
    tradesByProp.get(t.property_id)!.push(t)
  }
  const jeonsesByProp = new Map<number, typeof jeonses>()
  for (const t of jeonses ?? []) {
    if (!jeonsesByProp.has(t.property_id)) jeonsesByProp.set(t.property_id, [])
    jeonsesByProp.get(t.property_id)!.push(t)
  }

  const counts = properties
    .map((p) => ({
      id: p.id,
      count: (tradesByProp.get(p.id) ?? [])
        .filter((t) => monthKey(String(t.deal_date)) >= cutoff30).length,
    }))
    .sort((a, b) => b.count - a.count)

  const rankMap = new Map<number, number>()
  counts.slice(0, 10).forEach((e, i) => rankMap.set(e.id, i + 1))

  const complexes = properties.map((p) =>
    buildComplex(
      p,
      tradesByProp.get(p.id) ?? [],
      jeonsesByProp.get(p.id) ?? [],
      rankMap.get(p.id) ?? -1,
      months12,
    )
  )

  return NextResponse.json(complexes)
}
