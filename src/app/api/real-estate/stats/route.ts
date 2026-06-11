import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('property_id')
  const dealKind   = searchParams.get('deal_kind') ?? 'trade'
  const months     = Math.min(parseInt(searchParams.get('months') ?? '12', 10), 24)

  if (!propertyId) {
    return NextResponse.json({ error: 'property_id is required' }, { status: 400 })
  }

  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('deal_date, area, floor, price, deposit, monthly_rent')
    .eq('property_id', propertyId)
    .eq('deal_kind', dealKind)
    .gte('deal_date', since.toISOString().slice(0, 10))
    .order('deal_date', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  if (rows.length === 0) return NextResponse.json({ count: 0, stats: null, recent: [] })

  const amounts = dealKind === 'trade'
    ? rows.map(r => r.price as number)
    : rows.map(r => r.deposit as number)

  const valid  = amounts.filter(Boolean)
  const avg    = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
  const min    = valid.length ? Math.min(...valid) : 0
  const max    = valid.length ? Math.max(...valid) : 0

  return NextResponse.json({
    count: rows.length,
    stats: { avg, min, max },
    recent: rows.slice(0, 10),
  })
}
