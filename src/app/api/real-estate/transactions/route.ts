import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TABLES = new Set([
  'apt_trades', 'apt_rents', 'offi_trades', 'offi_rents', 'multi_trades', 'multi_rents',
])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lawdCd = searchParams.get('lawd_cd')
  const table = searchParams.get('table') ?? 'apt_trades'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  if (!lawdCd) {
    return NextResponse.json({ error: 'lawd_cd is required' }, { status: 400 })
  }
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'invalid table' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('lawd_cd', lawdCd)
    .order('deal_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count, limit, offset })
}
