import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = new Set(['apartment', 'officetel', 'villa'])
const ALLOWED_KINDS = new Set(['trade', 'jeonse', 'monthly_rent'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lawdCd   = searchParams.get('lawd_cd')
  const type     = searchParams.get('type')      // apartment | officetel | villa
  const dealKind = searchParams.get('deal_kind') // trade | jeonse | monthly_rent
  const limit    = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
  const offset   = parseInt(searchParams.get('offset') ?? '0', 10)

  if (!lawdCd) {
    return NextResponse.json({ error: 'lawd_cd is required' }, { status: 400 })
  }
  if (type && !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 })
  }
  if (dealKind && !ALLOWED_KINDS.has(dealKind)) {
    return NextResponse.json({ error: 'invalid deal_kind' }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from('real_estate_transactions')
    .select('*', { count: 'exact' })
    .eq('lawd_cd', lawdCd)
    .order('deal_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type)     query = query.eq('property_type', type)
  if (dealKind) query = query.eq('deal_kind', dealKind)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count, limit, offset })
}
