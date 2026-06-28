// scripts/fetch-kapt-codes.mjs
// AptListService3/getTotalAptList3 로 전국 K-APT 단지 목록을 다운로드하고
// 이름 + 시군구 코드 매칭으로 properties.kapt_code 를 채웁니다.
//
// 실행:
//   env $(cat .env.local | grep -v '^#' | xargs) node scripts/fetch-kapt-codes.mjs

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

const KAPT_PAGE_SIZE = 100
const DB_PAGE_SIZE = 1000
const DELAY_MS = 200

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function norm(s) {
  return String(s ?? '')
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .replace(/단지$/, '')
    .toLowerCase()
}

function isSimilar(a, b) {
  const na = norm(a), nb = norm(b)
  if (!na || !nb) return false
  return na === nb || na.startsWith(nb) || nb.startsWith(na) || na.includes(nb) || nb.includes(na)
}

async function fetchKaptPage(pageNo) {
  const url = new URL('https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3')
  url.searchParams.set('serviceKey', API_KEY)
  url.searchParams.set('pageNo', pageNo)
  url.searchParams.set('numOfRows', KAPT_PAGE_SIZE)
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const body = json?.response?.body
  return { items: body?.items ?? [], total: body?.totalCount ?? 0 }
}

async function downloadAllKapt() {
  console.log('K-APT 전국 단지 목록 다운로드 중...')
  const { items: first, total } = await fetchKaptPage(1)
  const totalPages = Math.ceil(total / KAPT_PAGE_SIZE)
  console.log(`총 ${total.toLocaleString()}개 단지, ${totalPages}페이지`)

  const all = [...first]
  for (let p = 2; p <= totalPages; p++) {
    await sleep(DELAY_MS)
    const { items } = await fetchKaptPage(p)
    all.push(...items)
    if (p % 20 === 0) process.stdout.write(`  ${p}/${totalPages} (${all.length}건)\r`)
  }
  console.log(`\n다운로드 완료: ${all.length}건`)
  return all
}

async function fetchAllProps() {
  console.log('DB 단지 목록 전체 조회 중...')
  const all = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, lawd_cd')
      .is('kapt_code', null)
      .not('lawd_cd', 'is', null)
      .order('id')
      .range(from, from + DB_PAGE_SIZE - 1)

    if (error) { console.error(error.message); process.exit(1) }
    if (!data?.length) break
    all.push(...data)
    process.stdout.write(`  ${all.length}건 조회됨\r`)
    if (data.length < DB_PAGE_SIZE) break
    from += DB_PAGE_SIZE
  }

  console.log(`\nDB 단지 총 ${all.length}건`)
  return all
}

async function main() {
  // 1. K-APT 전국 목록 다운로드
  const kaptList = await downloadAllKapt()

  // 2. 시군구코드(5자리) 기준 인덱스
  const byGu = new Map()
  for (const k of kaptList) {
    const guCode = String(k.bjdCode ?? '').slice(0, 5)
    if (!byGu.has(guCode)) byGu.set(guCode, [])
    byGu.get(guCode).push(k)
  }

  // 3. DB 전체 조회 (페이지네이션)
  const props = await fetchAllProps()

  // 4. 인메모리 매칭 — kapt_code별로 id 묶기
  console.log('\n매칭 중...')
  const matchMap = new Map()  // kaptCode → id[]
  let skipped = 0, ambiguous = 0

  for (const prop of props) {
    const guCode = String(prop.lawd_cd ?? '').slice(0, 5)
    const candidates = byGu.get(guCode) ?? []
    const hits = candidates.filter(k => isSimilar(prop.name, k.kaptName))

    if (hits.length === 0) { skipped++; continue }

    if (hits.length > 1) {
      const exact = hits.find(k => norm(k.kaptName) === norm(prop.name))
      if (exact) {
        hits.splice(0, hits.length, exact)
      } else {
        ambiguous++
        continue
      }
    }

    const { kaptCode } = hits[0]
    if (!matchMap.has(kaptCode)) matchMap.set(kaptCode, [])
    matchMap.get(kaptCode).push(prop.id)
  }

  const totalMatched = [...matchMap.values()].reduce((s, ids) => s + ids.length, 0)
  console.log(`매칭 완료: ${totalMatched}건 / 미매칭 ${skipped}건 / 모호 ${ambiguous}건`)
  console.log(`고유 kaptCode: ${matchMap.size}개 → DB 업데이트 시작...`)

  // 5. 배치 업데이트 (kapt_code별로 in() 사용)
  let updated = 0
  const entries = [...matchMap.entries()]
  for (let i = 0; i < entries.length; i++) {
    const [kaptCode, ids] = entries[i]
    const { error } = await supabase
      .from('properties')
      .update({ kapt_code: kaptCode })
      .in('id', ids)

    if (error) {
      console.error(`ERR ${kaptCode}: ${error.message}`)
    } else {
      updated += ids.length
    }

    if ((i + 1) % 100 === 0) process.stdout.write(`  ${i + 1}/${entries.length} kaptCode 처리 (${updated}건 업데이트)\r`)
  }

  console.log(`\n업데이트 완료: ${updated}건`)
  console.log('세대수 수집은 fetch-apt-units.mjs 를 실행하세요.')
}

main()
