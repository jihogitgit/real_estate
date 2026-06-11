import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RENT_TABLES = new Set(['apt_rents', 'offi_rents', 'multi_rents'])
const NM_COLS: Record<string, string> = {
  apt_trades: 'apt_nm', apt_rents: 'apt_nm',
  offi_trades: 'offi_nm', offi_rents: 'offi_nm',
  multi_trades: 'house_nm', multi_rents: 'house_nm',
}
const ALLOWED_TABLES = new Set(Object.keys(NM_COLS))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lawdCd = searchParams.get('lawd_cd')
  const complexNm = searchParams.get('complex_nm')
  const table = searchParams.get('table') ?? 'apt_trades'
  const months = Math.min(parseInt(searchParams.get('months') ?? '12', 10), 24)

  if (!lawdCd || !complexNm) {
    return NextResponse.json({ error: 'lawd_cd and complex_nm are required' }, { status: 400 })
  }
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'invalid table' }, { status: 400 })
  }

  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceStr = since.toISOString().slice(0, 10)
  const nmCol = NM_COLS[table]

  const supabase = await createClient()
  const { data, error } = await supabase
    .from(table)
    .select('deal_date, area, price, deposit, monthly_rent, floor')
    .eq('lawd_cd', lawdCd)
    .eq(nmCol, complexNm)
    .gte('deal_date', sinceStr)
    .order('deal_date', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  if (rows.length === 0) return NextResponse.json({ count: 0, stats: null, recent: [] })

  const isRent = RENT_TABLES.has(table)
  const amounts = isRent
    ? rows.map(r => r.deposit as number)
    : rows.map(r => r.price as number)

  const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)

  return NextResponse.json({ count: rows.length, stats: { avg, min, max }, recent: rows.slice(0, 10) })
}
