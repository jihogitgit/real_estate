// src/app/api/dungji/trades/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getAreaPy(area: number): number {
  if (area < 65)  return 18
  if (area < 95)  return 25
  if (area < 120) return 33
  return 39
}

function formatDate(dateStr: string): string {
  const s = String(dateStr ?? '').replace(/-/g, '')
  if (s.length >= 8) return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`
  if (s.length >= 6) return `${s.slice(0, 4)}.${s.slice(4, 6)}`
  return dateStr
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: txns, error } = await supabase
    .from('transactions')
    .select('deal_kind, area, price, deposit, floor, deal_date')
    .eq('property_id', id)
    .in('deal_kind', ['trade', 'jeonse'])
    .order('deal_date', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!txns?.length) return NextResponse.json([])

  const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10).replace(/-/g, '')

  const recentByBucket = new Map<number, { price: number; idx: number }>()
  txns.forEach((t, idx) => {
    if (t.deal_kind !== 'trade') return
    const dateStr = String(t.deal_date ?? '').replace(/-/g, '')
    if (dateStr < cutoff) return
    const py = getAreaPy(Number(t.area ?? 0))
    const price = Number(t.price ?? 0)
    const cur = recentByBucket.get(py)
    if (!cur || price > cur.price) recentByBucket.set(py, { price, idx })
  })

  const highIdxes = new Set([...recentByBucket.values()].map((v) => v.idx))

  const trades = txns.map((t, idx) => ({
    date: formatDate(String(t.deal_date ?? '')),
    ex: Number(t.area ?? 0),
    py: getAreaPy(Number(t.area ?? 0)),
    floor: Number(t.floor ?? 0),
    price: t.deal_kind === 'trade' ? Number(t.price ?? 0) : Number(t.deposit ?? 0),
    deal: t.deal_kind === 'trade' ? '매매' : '전세',
    tag: highIdxes.has(idx) ? '신고가' : '',
  }))

  return NextResponse.json(trades)
}
