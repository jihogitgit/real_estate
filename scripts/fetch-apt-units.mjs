// scripts/fetch-apt-units.mjs
// 공공데이터포털 "아파트 기본정보 제공 서비스" (AptBasisInfoService1)를 사용해
// properties.apt_seq 기준으로 총 세대수(total_units)를 수집합니다.
//
// 사전 준비:
//   data.go.kr → "아파트 기본정보 제공 서비스" 검색 → 활용신청
//   (동일한 CHEONGAHK_API_KEY에 권한이 추가됩니다. 승인 후 실행하세요.)
//
// 실행:
//   node --env-file=.env.local scripts/fetch-apt-units.mjs

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

async function fetchUnits(aptSeq) {
  const url = new URL('https://apis.data.go.kr/1613000/AptBasisInfoService1/getAptBasisInfo1')
  url.searchParams.set('serviceKey', API_KEY)
  url.searchParams.set('kaptCode', aptSeq)
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  const item = data?.response?.body?.item
  if (!item) return null

  // kaptFacelt = 단지 전체 세대수
  const units = item.kaptFacelt ?? item.kaptMajunho ?? null
  return units ? parseInt(String(units).replace(/,/g, ''), 10) : null
}

async function processChunk(chunk) {
  for (const row of chunk) {
    try {
      const units = await fetchUnits(row.apt_seq)
      if (units === null) {
        console.log(`  SKIP  ${row.name} (${row.apt_seq}) — 데이터 없음`)
        continue
      }
      const { error } = await supabase
        .from('properties')
        .update({ total_units: units })
        .eq('id', row.id)
      if (error) throw error
      console.log(`  OK    ${row.name} (${row.apt_seq}) → ${units.toLocaleString()}세대`)
    } catch (err) {
      console.error(`  ERR   ${row.name} (${row.apt_seq}): ${err.message}`)
    }
    await sleep(DELAY_MS)
  }
}

async function main() {
  // total_units 없는 단지만 처리
  const { data: rows, error } = await supabase
    .from('properties')
    .select('id, name, apt_seq')
    .not('apt_seq', 'is', null)
    .is('total_units', null)
    .order('id')

  if (error) { console.error(error.message); process.exit(1) }
  if (!rows?.length) { console.log('수집할 단지가 없습니다.'); return }

  console.log(`총 ${rows.length}개 단지 세대수 수집 시작...`)

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY)
    await processChunk(chunk)
    console.log(`진행: ${Math.min(i + CONCURRENCY, rows.length)}/${rows.length}`)
  }

  console.log('완료!')
}

main()
