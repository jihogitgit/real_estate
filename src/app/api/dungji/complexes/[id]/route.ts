// src/app/api/dungji/complexes/[id]/route.ts
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
}

const BUCKETS = [
  { py: 18, ex: 59.9,  min: 0,   max: 65  },
  { py: 25, ex: 84.9,  min: 65,  max: 95  },
  { py: 33, ex: 114.9, min: 95,  max: 120 },
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: p, error: propErr } = await supabase
    .from('properties')
    .select('id, name, type, lawd_cd, umd_nm, build_year, total_units, lat, lng, geocoded_at')
    .eq('id', id)
    .single()

  if (propErr || !p) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const months12 = lastNMonths(12)
  const months13 = lastNMonths(13)
  const cutoff = months13[0] + '01'

  const [{ data: trades }, { data: jeonses }] = await Promise.all([
    supabase
      .from('transactions')
      .select('property_id, area, price, deal_date')
      .eq('property_id', p.id)
      .eq('deal_kind', 'trade')
      .gte('deal_date', cutoff),
    supabase
      .from('transactions')
      .select('property_id, area, deposit, deal_date')
      .eq('property_id', p.id)
      .eq('deal_kind', 'jeonse')
      .gte('deal_date', cutoff),
  ])

  const allTrades = trades ?? []
  const allJeonses = jeonses ?? []

  type BS = { sales: number[]; jeonseAmts: number[] }
  const statsMap = new Map<number, BS>()
  for (const t of allTrades) {
    const b = bucket(Number(t.area ?? 0))
    if (!statsMap.has(b.py)) statsMap.set(b.py, { sales: [], jeonseAmts: [] })
    statsMap.get(b.py)!.sales.push(Number(t.price ?? 0))
  }
  for (const t of allJeonses) {
    const b = bucket(Number(t.area ?? 0))
    if (!statsMap.has(b.py)) statsMap.set(b.py, { sales: [], jeonseAmts: [] })
    statsMap.get(b.py)!.jeonseAmts.push(Number(t.deposit ?? 0))
  }

  const areas = BUCKETS
    .filter((b) => statsMap.has(b.py))
    .map((b) => {
      const s = statsMap.get(b.py)!
      return { ex: b.ex, py: b.py, sale: avg(s.sales), jeonse: avg(s.jeonseAmts), d: 0 }
    })
  if (!areas.length) areas.push({ ex: 84.9, py: 25, sale: 0, jeonse: 0, d: 0 })

  const mainPy = areas[Math.min(1, areas.length - 1)].py
  const monthly = new Map<string, number[]>()
  for (const t of allTrades) {
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

  const monthsWithData = months12.filter((mk) => (monthly.get(mk)?.length ?? 0) > 0)
  let d1 = 0
  if (monthsWithData.length >= 2) {
    const prev = avg(monthly.get(monthsWithData[monthsWithData.length - 2])!)
    const cur = avg(monthly.get(monthsWithData[monthsWithData.length - 1])!)
    d1 = prev > 0 ? (parseFloat(((cur - prev) / prev * 100).toFixed(1)) || 0) : 0
  }

  const guKey = String(p.lawd_cd ?? '').slice(0, 5)

  return NextResponse.json({
    id: String(p.id),
    name: String(p.name ?? ''),
    gu: GU_MAP[guKey] ?? guKey,
    dong: String(p.umd_nm ?? ''),
    code: String(p.lawd_cd ?? ''),
    built: Number(p.build_year ?? 0),
    hh: (p as Record<string, unknown>).total_units != null ? Number((p as Record<string, unknown>).total_units) : null,
    type: String(p.type ?? '아파트'),
    d1,
    rankd: -1,
    hot: false,
    xy: (p.geocoded_at && p.lat != null && p.lng != null)
      ? [Number(p.lat), Number(p.lng)] as [number, number]
      : null,
    areas,
    spark: series.slice(-7),
    series,
  })
}
