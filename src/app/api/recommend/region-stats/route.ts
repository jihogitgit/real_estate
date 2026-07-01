import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getLawdName } from '@/lib/lawd-names'
import type { RegionStat } from '@/lib/recommend/age-defaults'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function cutoff(): string {
  const now = new Date()
  // UTC arithmetic matches toISOString() output; avoids KST+9 date-slip on local setFullYear
  return new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

type AggRow = { lawd_cd: string; avg_price: number; cnt: number }
type TradeRow = { lawd_cd: string; apt_nm: string | null; area: number | null; price: number; deal_date: string }
type RentRow  = { lawd_cd: string; apt_nm: string | null; area: number | null; deposit: number; deal_date: string }

// 6 trades per region × up to 50 regions = 300 outer limit covers all buckets without over-fetching
function groupByRegion<T extends { lawd_cd: string }>(rows: T[], cds: string[]): Map<string, T[]> {
  const map = new Map<string, T[]>(cds.map(cd => [cd, []]))
  for (const row of rows) {
    const list = map.get(row.lawd_cd)
    if (list && list.length < 6) list.push(row)
  }
  return map
}

const fetchTradeStats = async (): Promise<RegionStat[]> => {
  const client = sb()
  const cut = cutoff()

  const { data: agg, error: aggErr } = await client.rpc('get_region_trade_stats')
  if (aggErr) throw new Error(aggErr.message)

  const rows = agg as AggRow[]
  const cds = rows.map(r => r.lawd_cd)

  const { data: trades, error: tradeErr } = await client
    .from('apt_trades')
    .select('lawd_cd, apt_nm, area, price, deal_date')
    .in('lawd_cd', cds)
    .gte('deal_date', cut)
    .order('deal_date', { ascending: false })
    .limit(300)
  if (tradeErr) throw new Error(tradeErr.message)

  const byRegion = groupByRegion(trades as TradeRow[], cds)

  return rows.map(r => ({
    lawd_cd: r.lawd_cd,
    name: getLawdName(r.lawd_cd),
    avg_price: Math.round(r.avg_price),
    count: Number(r.cnt),
    recent_trades: (byRegion.get(r.lawd_cd) ?? []).map(t => ({
      apt_nm: t.apt_nm ?? '-',
      area: t.area ?? 0,
      price: t.price,
      deal_date: t.deal_date,
    })),
  }))
}

const fetchJeonseStats = async (): Promise<RegionStat[]> => {
  const client = sb()
  const cut = cutoff()

  const { data: agg, error: aggErr } = await client.rpc('get_region_jeonse_stats')
  if (aggErr) throw new Error(aggErr.message)

  const rows = agg as AggRow[]
  const cds = rows.map(r => r.lawd_cd)

  const { data: rents, error: rentErr } = await client
    .from('apt_rents')
    .select('lawd_cd, apt_nm, area, deposit, deal_date')
    .in('lawd_cd', cds)
    .gte('deal_date', cut)
    .order('deal_date', { ascending: false })
    .limit(300)
  if (rentErr) throw new Error(rentErr.message)

  const byRegion = groupByRegion(rents as RentRow[], cds)

  return rows.map(r => ({
    lawd_cd: r.lawd_cd,
    name: getLawdName(r.lawd_cd),
    avg_price: Math.round(r.avg_price),
    count: Number(r.cnt),
    recent_trades: (byRegion.get(r.lawd_cd) ?? []).map(t => ({
      apt_nm: t.apt_nm ?? '-',
      area: t.area ?? 0,
      price: t.deposit,
      deal_date: t.deal_date,
    })),
  }))
}

const getTradeStats  = unstable_cache(fetchTradeStats,  ['region-trade-stats'],  { revalidate: 86400 })
const getJeonseStats = unstable_cache(fetchJeonseStats, ['region-jeonse-stats'], { revalidate: 86400 })

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  if (type !== 'trade' && type !== 'jeonse') {
    return NextResponse.json({ error: "type must be 'trade' or 'jeonse'" }, { status: 400 })
  }
  try {
    const stats = type === 'trade' ? await getTradeStats() : await getJeonseStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[region-stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
