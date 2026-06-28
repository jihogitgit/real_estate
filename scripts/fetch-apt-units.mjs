// scripts/fetch-apt-units.mjs
// AptBasisInfoServiceV4/getAphusDtlInfoV4 를 사용해 세대수(total_units)를 수집합니다.
//
// 사전 준비:
//   1. scripts/fetch-kapt-codes.mjs 를 먼저 실행해 properties.kapt_code 를 채우세요.
//   2. data.go.kr → "전국공동주택표준데이터" (서비스ID: 15096285) 활용신청 → 승인 후 실행하세요.
//      (동일한 CHEONGAHK_API_KEY 에 권한이 추가됩니다.)
//
// 실행:
//   env $(cat .env.local | grep -v '^#' | xargs) node scripts/fetch-apt-units.mjs

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const API_KEY = process.env.CHEONGAHK_API_KEY

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CHEONGAHK_API_KEY')
  process.exit(1)
}

const CONCURRENCY = 3
const DELAY_MS = 300

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchUnits(kaptCode) {
  const url = new URL('https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4')
  url.searchParams.set('serviceKey', API_KEY)
  url.searchParams.set('kaptCode', kaptCode)
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (res.status === 403) throw new Error('403 Forbidden — "전국공동주택표준데이터" 서비스 활용신청이 필요합니다.')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  const item = data?.response?.body?.item
  if (!item) return null

  // hoCnt = 총 세대수
  const raw = item.hoCnt ?? null
  return raw ? parseInt(String(raw).replace(/,/g, ''), 10) : null
}

async function processChunk(chunk) {
  for (const row of chunk) {
    try {
      const units = await fetchUnits(row.kapt_code)
      if (units === null) {
        console.log(`  SKIP  ${row.name} (${row.kapt_code}) — 데이터 없음`)
        continue
      }
      const { error } = await supabase
        .from('properties')
        .update({ total_units: units })
        .eq('id', row.id)
      if (error) throw error
      console.log(`  OK    ${row.name} (${row.kapt_code}) → ${units.toLocaleString()}세대`)
    } catch (err) {
      console.error(`  ERR   ${row.name} (${row.kapt_code}): ${err.message}`)
      if (err.message.includes('403')) process.exit(1)
    }
    await sleep(DELAY_MS)
  }
}

async function fetchAllProps() {
  const all = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, kapt_code')
      .not('kapt_code', 'is', null)
      .is('total_units', null)
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) { console.error(error.message); process.exit(1) }
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  process.stdout.write('수집 대상 조회 중...\r')
  const rows = await fetchAllProps()

  if (!rows.length) { console.log('수집할 단지가 없습니다. 먼저 fetch-kapt-codes.mjs 를 실행하세요.'); return }

  console.log(`총 ${rows.length}개 단지 세대수 수집 시작...`)

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY)
    await processChunk(chunk)
    process.stdout.write(`진행: ${Math.min(i + CONCURRENCY, rows.length)}/${rows.length}\r`)
  }

  console.log('\n완료!')
}

main()
