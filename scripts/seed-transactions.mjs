import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiKey = process.env.CHEONGAHK_API_KEY

if (!supabaseUrl || !serviceRoleKey || !apiKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CHEONGAHK_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvc'

const SERVICES = [
  { service: 'getRTMSDataSvcAptTradeDev',   table: 'apt_trades' },
  { service: 'getRTMSDataSvcAptRent',        table: 'apt_rents' },
  { service: 'getRTMSDataSvcOffiTrade',      table: 'offi_trades' },
  { service: 'getRTMSDataSvcOffiRent',       table: 'offi_rents' },
  { service: 'getRTMSDataSvcRHDwelling',     table: 'multi_trades' },
  { service: 'getRTMSDataSvcRHDwellingRent', table: 'multi_rents' },
]

function getRecentMonths(n) {
  const months = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(ym)
  }
  return months
}

// Returns all months from startYm (e.g. '202501') up to last month (current month API returns 500)
function getMonthsFrom(startYm) {
  const months = []
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  let cur = new Date(parseInt(startYm.slice(0, 4)), parseInt(startYm.slice(4, 6)) - 1, 1)
  while (cur <= lastMonth) {
    months.push(`${cur.getFullYear()}${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return months
}

function extractItems(data) {
  const items = data?.response?.body?.items
  if (!items || typeof items === 'string') return []
  const item = items.item
  if (!item) return []
  if (Array.isArray(item)) return item
  return [item]
}

async function withRetry(fn, retries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try { return await fn() }
    catch (err) {
      if (attempt === retries - 1) throw err
      await new Promise(r => setTimeout(r, baseDelay * 2 ** attempt))
    }
  }
}

async function runWithConcurrency(taskFns, limit) {
  const queue = [...taskFns]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const task = queue.shift()
      if (task) await task()
    }
  })
  await Promise.all(workers)
}

function parsePrice(val) {
  if (!val) return 0
  const n = parseInt(val.replace(/,/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function makeDealDate(year, month, day) {
  return `${year}-${(month ?? '').padStart(2, '0')}-${(day ?? '').padStart(2, '0')}`
}

function makeHash(parts) {
  return createHash('md5').update(parts.join('|')).digest('hex')
}

function normalizeItem(item, lawdCd, requestYm, service, table) {
  const dealDate = makeDealDate(item['년'], item['월'], item['일'])

  if (table === 'apt_trades') {
    const price = parsePrice(item['거래금액'])
    const area = item['전용면적'] ? String(parseFloat(item['전용면적'])) : ''
    return {
      lawd_cd: lawdCd, request_ym: requestYm,
      umd_nm: item['법정동'] ?? null, apt_nm: item['아파트'] ?? null,
      apt_seq: item['단지코드'] ?? null,
      build_year: item['건축년도'] ? parseInt(item['건축년도']) : null,
      area: item['전용면적'] ? parseFloat(item['전용면적']) : null,
      floor: item['층'] ? parseInt(item['층']) : null,
      price, deal_date: dealDate,
      bonbun: item['법정동본번코드'] ?? null, bubun: item['법정동부번코드'] ?? null,
      dealing_gbn: item['거래유형'] ?? null, rgst_date: item['등기일자'] ?? null,
      buyer_gbn: item['매수자'] ?? null, seller_gbn: item['매도자'] ?? null,
      source_api: service, raw_item: item,
      source_hash: makeHash([lawdCd, dealDate, item['아파트'] ?? '', area, item['층'] ?? '', String(price), item['법정동본번코드'] ?? '']),
    }
  }

  if (table === 'apt_rents') {
    const deposit = parsePrice(item['보증금액'])
    const monthly = parsePrice(item['월세금액'])
    const area = item['전용면적'] ? String(parseFloat(item['전용면적'])) : ''
    return {
      lawd_cd: lawdCd, request_ym: requestYm,
      umd_nm: item['법정동'] ?? null, apt_nm: item['아파트'] ?? null,
      apt_seq: item['단지코드'] ?? null,
      build_year: item['건축년도'] ? parseInt(item['건축년도']) : null,
      area: item['전용면적'] ? parseFloat(item['전용면적']) : null,
      floor: item['층'] ? parseInt(item['층']) : null,
      deposit, monthly_rent: monthly, deal_date: dealDate,
      contract_type: item['계약구분'] ?? null, contract_term: item['계약기간'] ?? null,
      use_rr_right: item['갱신요구권사용'] ?? null,
      prev_deposit: item['종전계약보증금'] ? parsePrice(item['종전계약보증금']) : null,
      prev_monthly_rent: item['종전계약월세'] ? parsePrice(item['종전계약월세']) : null,
      source_api: service, raw_item: item,
      source_hash: makeHash([lawdCd, dealDate, item['아파트'] ?? '', area, item['층'] ?? '', String(deposit), String(monthly)]),
    }
  }

  if (table === 'offi_trades') {
    const price = parsePrice(item['거래금액'])
    const area = item['전용면적'] ? String(parseFloat(item['전용면적'])) : ''
    return {
      lawd_cd: lawdCd, request_ym: requestYm,
      umd_nm: item['법정동'] ?? null, jibun: item['지번'] ?? null,
      offi_nm: item['단지명'] ?? null,
      build_year: item['건축년도'] ? parseInt(item['건축년도']) : null,
      area: item['전용면적'] ? parseFloat(item['전용면적']) : null,
      floor: item['층'] ? parseInt(item['층']) : null,
      price, deal_date: dealDate, dealing_gbn: item['거래유형'] ?? null,
      source_api: service, raw_item: item,
      source_hash: makeHash([lawdCd, dealDate, item['단지명'] ?? '', area, item['층'] ?? '', String(price), item['지번'] ?? '']),
    }
  }

  if (table === 'offi_rents') {
    const deposit = parsePrice(item['보증금'])
    const monthly = parsePrice(item['월세'])
    const area = item['전용면적'] ? String(parseFloat(item['전용면적'])) : ''
    return {
      lawd_cd: lawdCd, request_ym: requestYm,
      umd_nm: item['법정동'] ?? null, jibun: item['지번'] ?? null,
      offi_nm: item['단지명'] ?? null,
      build_year: item['건축년도'] ? parseInt(item['건축년도']) : null,
      area: item['전용면적'] ? parseFloat(item['전용면적']) : null,
      floor: item['층'] ? parseInt(item['층']) : null,
      deposit, monthly_rent: monthly, deal_date: dealDate,
      contract_type: item['계약구분'] ?? null, contract_term: item['계약기간'] ?? null,
      use_rr_right: item['갱신요구권사용'] ?? null,
      prev_deposit: item['종전계약보증금'] ? parsePrice(item['종전계약보증금']) : null,
      prev_monthly_rent: item['종전계약월세'] ? parsePrice(item['종전계약월세']) : null,
      source_api: service, raw_item: item,
      source_hash: makeHash([lawdCd, dealDate, item['단지명'] ?? '', area, item['층'] ?? '', String(deposit), String(monthly)]),
    }
  }

  if (table === 'multi_trades') {
    const price = parsePrice(item['거래금액'])
    const area = item['전용면적'] ? String(parseFloat(item['전용면적'])) : ''
    return {
      lawd_cd: lawdCd, request_ym: requestYm,
      umd_nm: item['법정동'] ?? null, jibun: item['지번'] ?? null,
      house_nm: item['연립다세대'] ?? null,
      build_year: item['건축년도'] ? parseInt(item['건축년도']) : null,
      area: item['전용면적'] ? parseFloat(item['전용면적']) : null,
      floor: item['층'] ? parseInt(item['층']) : null,
      price, deal_date: dealDate, dealing_gbn: item['거래유형'] ?? null,
      rgst_date: item['등기일자'] ?? null,
      buyer_gbn: item['매수자'] ?? null, seller_gbn: item['매도자'] ?? null,
      source_api: service, raw_item: item,
      source_hash: makeHash([lawdCd, dealDate, item['연립다세대'] ?? '', area, item['층'] ?? '', String(price), item['지번'] ?? '']),
    }
  }

  // multi_rents
  const deposit = parsePrice(item['보증금액'])
  const monthly = parsePrice(item['월세금액'])
  const area = item['전용면적'] ? String(parseFloat(item['전용면적'])) : ''
  return {
    lawd_cd: lawdCd, request_ym: requestYm,
    umd_nm: item['법정동'] ?? null, jibun: item['지번'] ?? null,
    house_nm: item['연립다세대'] ?? null,
    build_year: item['건축년도'] ? parseInt(item['건축년도']) : null,
    area: item['전용면적'] ? parseFloat(item['전용면적']) : null,
    floor: item['층'] ? parseInt(item['층']) : null,
    deposit, monthly_rent: monthly, deal_date: dealDate,
    contract_type: item['계약구분'] ?? null, contract_term: item['계약기간'] ?? null,
    use_rr_right: item['갱신요구권사용'] ?? null,
    prev_deposit: item['종전계약보증금'] ? parsePrice(item['종전계약보증금']) : null,
    prev_monthly_rent: item['종전계약월세'] ? parsePrice(item['종전계약월세']) : null,
    source_api: service, raw_item: item,
    source_hash: makeHash([lawdCd, dealDate, item['연립다세대'] ?? '', area, item['층'] ?? '', String(deposit), String(monthly)]),
  }
}

async function fetchAllPages(service, lawdCd, dealYmd) {
  const all = []
  let pageNo = 1

  while (true) {
    const url = new URL(`${BASE_URL}/${service}`)
    url.searchParams.set('serviceKey', apiKey)
    url.searchParams.set('LAWD_CD', lawdCd)
    url.searchParams.set('DEAL_YMD', dealYmd)
    url.searchParams.set('pageNo', String(pageNo))
    url.searchParams.set('numOfRows', '1000')
    url.searchParams.set('_type', 'json')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`RTMS API error: ${res.status} [${service}/${lawdCd}/${dealYmd}]`)
    const data = await res.json()
    const items = extractItems(data)
    all.push(...items)
    if (items.length < 1000) break
    pageNo++
  }

  return all
}

async function upsertBatch(table, rows) {
  if (rows.length === 0) return
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'source_api,source_hash', ignoreDuplicates: true })
  if (error) throw new Error(`Upsert error on ${table}: ${error.message}`)
}

async function main() {
  const months = process.env.SEED_FROM
    ? getMonthsFrom(process.env.SEED_FROM)
    : getRecentMonths(3)
  console.log(`Syncing months: ${months.join(', ')} (total: ${months.length})`)

  const { data: regions, error: regErr } = await supabase.from('regions').select('lawd_cd')
  if (regErr) { console.error(regErr.message); process.exit(1) }

  const lawdCds = regions.map(r => r.lawd_cd)
  console.log(`Found ${lawdCds.length} regions`)

  const tasks = []
  let totalInserted = 0

  for (const { service, table } of SERVICES) {
    for (const ym of months) {
      for (const lawdCd of lawdCds) {
        tasks.push(async () => {
          try {
            const items = await withRetry(() => fetchAllPages(service, lawdCd, ym))
            if (items.length === 0) return

            const rows = items.map(item => normalizeItem(item, lawdCd, ym, service, table))
            await upsertBatch(table, rows)
            totalInserted += rows.length

            if (rows.length > 0) {
              process.stdout.write(`\r[${service}] ${ym}/${lawdCd}: +${rows.length} (total ${totalInserted})`)
            }
          } catch (err) {
            console.error(`\nFailed ${service}/${ym}/${lawdCd}: ${err.message}`)
          }
        })
      }
    }
  }

  console.log(`\nTotal tasks: ${tasks.length}`)
  await runWithConcurrency(tasks, 10)
  console.log(`\nDone. Total rows inserted: ${totalInserted}`)
}

main()
