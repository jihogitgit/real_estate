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

const PAGE_SIZE = 100
const DELAY_MS = 200

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// 이름 정규화: 공백·특수문자 제거, 소문자, "단지" 접미사 제거
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

async function fetchPage(pageNo) {
  const url = new URL('https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3')
  url.searchParams.set('serviceKey', API_KEY)
  url.searchParams.set('pageNo', pageNo)
  url.searchParams.set('numOfRows', PAGE_SIZE)
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const body = json?.response?.body
  return { items: body?.items ?? [], total: body?.totalCount ?? 0 }
}

async function downloadAllKapt() {
  console.log('K-APT 전국 단지 목록 다운로드 중...')
  const { items: first, total } = await fetchPage(1)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  console.log(`총 ${total.toLocaleString()}개 단지, ${totalPages}페이지`)

  const all = [...first]
  for (let p = 2; p <= totalPages; p++) {
    await sleep(DELAY_MS)
    const { items } = await fetchPage(p)
    all.push(...items)
    if (p % 20 === 0) process.stdout.write(`  ${p}/${totalPages} (${all.length}건)\r`)
  }
  console.log(`\n다운로드 완료: ${all.length}건`)
  return all
}

async function main() {
  // 1. K-APT 전국 목록 다운로드
  const kaptList = await downloadAllKapt()

  // 2. 시군구코드(5자리) 기준 인덱스 생성
  // bjdCode는 10자리 법정동코드, 앞 5자리가 시군구코드
  const byGu = new Map()
  for (const k of kaptList) {
    const guCode = String(k.bjdCode ?? '').slice(0, 5)
    if (!byGu.has(guCode)) byGu.set(guCode, [])
    byGu.get(guCode).push(k)
  }

  // 3. DB 단지 목록 조회 (kapt_code 없는 것만)
  const { data: props, error } = await supabase
    .from('properties')
    .select('id, name, lawd_cd')
    .is('kapt_code', null)
    .not('lawd_cd', 'is', null)
    .order('id')

  if (error) { console.error(error.message); process.exit(1) }
  if (!props?.length) { console.log('매핑할 단지가 없습니다.'); return }

  console.log(`\nDB 단지 ${props.length}개 매핑 시작...`)

  let matched = 0, skipped = 0, ambiguous = 0

  for (const prop of props) {
    const guCode = String(prop.lawd_cd ?? '').slice(0, 5)
    const candidates = byGu.get(guCode) ?? []

    const hits = candidates.filter(k => isSimilar(prop.name, k.kaptName))

    if (hits.length === 0) {
      console.log(`  MISS  ${prop.name} (${guCode}) — 매칭 없음`)
      skipped++
      continue
    }

    if (hits.length > 1) {
      // 완전 일치 우선
      const exact = hits.find(k => norm(k.kaptName) === norm(prop.name))
      if (exact) {
        hits.splice(0, hits.length, exact)
      } else {
        console.log(`  AMB   ${prop.name} (${guCode}) — ${hits.length}개 후보: ${hits.map(h => h.kaptName).join(', ')}`)
        ambiguous++
        continue
      }
    }

    const { kaptCode, kaptName } = hits[0]
    const { error: upErr } = await supabase
      .from('properties')
      .update({ kapt_code: kaptCode })
      .eq('id', prop.id)

    if (upErr) {
      console.error(`  ERR   ${prop.name}: ${upErr.message}`)
    } else {
      console.log(`  OK    ${prop.name} → ${kaptCode} (${kaptName})`)
      matched++
    }
  }

  console.log(`\n완료: 매칭 ${matched}건 / 미매칭 ${skipped}건 / 모호 ${ambiguous}건`)
  console.log('세대수 수집은 AptBasisInfoServiceV4 승인 후 fetch-apt-units.mjs 를 실행하세요.')
}

main()
