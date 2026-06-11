import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRtmsItems } from '@/lib/api/rtms'
import {
  normalizeAptTrade, normalizeAptRent, normalizeOffiTrade, normalizeOffiRent,
  normalizeMultiTrade, normalizeMultiRent,
} from '@/lib/rtms-normalizer'
import { RTMS_SERVICES } from '@/types/rtms'
import type { RtmsServiceName } from '@/types/rtms'

export const runtime = 'nodejs'
export const maxDuration = 300

function getPrevYm(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function runWithConcurrency(taskFns: (() => Promise<void>)[], limit: number) {
  const queue = [...taskFns]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const task = queue.shift()
      if (task) await task()
    }
  })
  await Promise.all(workers)
}

const NORMALIZERS: Record<string, (item: unknown, lawdCd: string, ym: string, service: RtmsServiceName) => unknown> = {
  apt_trades:   (item, lawdCd, ym, service) => normalizeAptTrade(item as never, lawdCd, ym, service),
  apt_rents:    (item, lawdCd, ym, service) => normalizeAptRent(item as never, lawdCd, ym, service),
  offi_trades:  (item, lawdCd, ym, service) => normalizeOffiTrade(item as never, lawdCd, ym, service),
  offi_rents:   (item, lawdCd, ym, service) => normalizeOffiRent(item as never, lawdCd, ym, service),
  multi_trades: (item, lawdCd, ym, service) => normalizeMultiTrade(item as never, lawdCd, ym, service),
  multi_rents:  (item, lawdCd, ym, service) => normalizeMultiRent(item as never, lawdCd, ym, service),
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const ym = url.searchParams.get('ym') ?? getPrevYm()
  const apiKey = process.env.CHEONGAHK_API_KEY ?? ''

  try {
    const supabase = await createClient()
    const { data: regions, error: regErr } = await supabase.from('regions').select('lawd_cd')
    if (regErr) throw new Error(regErr.message)

    const lawdCds = (regions ?? []).map((r: { lawd_cd: string }) => r.lawd_cd)
    let totalSynced = 0

    const tasks: (() => Promise<void>)[] = []

    for (const { service, table } of RTMS_SERVICES) {
      for (const lawdCd of lawdCds) {
        tasks.push(async () => {
          const items = await fetchAllRtmsItems({ service, lawdCd, dealYmd: ym, apiKey })
          if (items.length === 0) return

          const normalizer = NORMALIZERS[table]
          const rows = items.map(item => normalizer(item, lawdCd, ym, service))

          const { error } = await supabase
            .from(table)
            .upsert(rows, { onConflict: 'source_api,source_hash', ignoreDuplicates: true })
          if (error) throw new Error(`${table}: ${error.message}`)
          totalSynced += rows.length
        })
      }
    }

    await runWithConcurrency(tasks, 10)

    return NextResponse.json({ ym, regions: lawdCds.length, totalSynced })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
