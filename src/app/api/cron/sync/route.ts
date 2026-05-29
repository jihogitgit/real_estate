import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchApartmentList, normalizeApartment } from '@/lib/api/cheongahk'
import { redis, CACHE_KEYS } from '@/lib/redis'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await fetchApartmentList({ numOfRows: 100 })
    const normalized = items.map(normalizeApartment)

    if (normalized.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No data from API' })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('apartments')
      .upsert(normalized, { onConflict: 'source_id', ignoreDuplicates: false })

    if (error) throw error

    const regions = [...new Set(normalized.map((a) => a.region).filter(Boolean))]
    if (redis) {
      await Promise.all([
        ...regions.map((r) => redis!.del(CACHE_KEYS.apartmentsList(r))),
        redis.del(CACHE_KEYS.allRegions()),
      ])
    }

    return NextResponse.json({ synced: normalized.length, regions })
  } catch (err) {
    console.error('[cron/sync] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
