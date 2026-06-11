import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q      = searchParams.get('q')?.trim()
  const lawdCd = searchParams.get('lawd_cd')
  const type   = searchParams.get('type')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'q must be at least 2 characters' }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select('id, name, type, lawd_cd, umd_nm, build_year, apt_seq')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(limit)

  if (lawdCd) query = query.eq('lawd_cd', lawdCd)
  if (type)   query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ results: data ?? [] })
}
