import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchResult {
  complex_nm: string
  lawd_cd: string
  table_name: string
  count: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const lawdCd = searchParams.get('lawd_cd')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'q must be at least 2 characters' }, { status: 400 })
  }

  const supabase = await createClient()

  const searches = [
    { table: 'apt_trades', col: 'apt_nm' },
    { table: 'offi_trades', col: 'offi_nm' },
    { table: 'multi_trades', col: 'house_nm' },
  ] as const

  const results: SearchResult[] = []

  await Promise.all(
    searches.map(async ({ table, col }) => {
      let query = supabase
        .from(table)
        .select(`${col}, lawd_cd`, { count: 'exact' })
        .ilike(col, `%${q}%`)
        .limit(limit)

      if (lawdCd) query = query.eq('lawd_cd', lawdCd)

      const { data, error } = await query
      if (error || !data) return

      const seen = new Map<string, number>()
      for (const row of data) {
        const nm = (row as Record<string, unknown>)[col] as string | null
        if (!nm) continue
        const key = `${nm}|${(row as Record<string, unknown>).lawd_cd}`
        seen.set(key, (seen.get(key) ?? 0) + 1)
      }

      for (const [key, count] of seen.entries()) {
        const [complex_nm, lcd] = key.split('|')
        results.push({ complex_nm, lawd_cd: lcd, table_name: table, count })
      }
    })
  )

  results.sort((a, b) => b.count - a.count)

  return NextResponse.json({ results: results.slice(0, limit) })
}
