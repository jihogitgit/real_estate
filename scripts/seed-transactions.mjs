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

// service → property type / deal category
const SERVICES = [
  { service: 'getRTMSDataSvcAptTradeDev',   propType: 'apartment', dealCat: 'trade' },
  { service: 'getRTMSDataSvcAptRent',        propType: 'apartment', dealCat: 'rent'  },
  { service: 'getRTMSDataSvcOffiTrade',      propType: 'officetel', dealCat: 'trade' },
  { service: 'getRTMSDataSvcOffiRent',       propType: 'officetel', dealCat: 'rent'  },
  { service: 'getRTMSDataSvcRHDwelling',     propType: 'villa',     dealCat: 'trade' },
  { service: 'getRTMSDataSvcRHDwellingRent', propType: 'villa',     dealCat: 'rent'  },
]

// ── date helpers ────────────────────────────────────────────
function getRecentMonths(n) {
  const months = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

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

// ── RTMS fetch ──────────────────────────────────────────────
function extractItems(data) {
  const items = data?.response?.body?.items
  if (!items || typeof items === 'string') return []
  const item = items.item
  if (!item) return []
  return Array.isArray(item) ? item : [item]
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
    if (res.status === 500) return all  // RTMS returns 500 for empty datasets
    if (!res.ok) throw new Error(`RTMS ${res.status} [${service}/${lawdCd}/${dealYmd}]`)
    const data = await res.json()
    const items = extractItems(data)
    all.push(...items)
    if (items.length < 1000) break
    pageNo++
  }
  return all
}

// ── normalizers ─────────────────────────────────────────────
function parsePrice(val) {
  if (!val) return 0
  const n = parseInt(String(val).replace(/,/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function makeDealDate(year, month, day) {
  return `${year}-${String(month ?? '').padStart(2, '0')}-${String(day ?? '').padStart(2, '0')}`
}

function makeHash(...parts) {
  return createHash('md5').update(parts.join('|')).digest('hex')
}

function propertyKey(lawdCd, name, type, buildYear) {
  return makeHash(lawdCd, name, type, buildYear ?? '')
}

function extractName(item) {
  return (item['아파트'] ?? item['단지명'] ?? item['연립다세대'] ?? '').trim()
}

function toProperty(item, lawdCd, propType) {
  const name = extractName(item)
  const buildYear = item['건축년도'] ? parseInt(item['건축년도']) : null
  return {
    property_key: propertyKey(lawdCd, name, propType, buildYear),
    type: propType,
    name,
    lawd_cd: lawdCd,
    umd_nm:    item['법정동'] ?? null,
    jibun:     item['지번'] ?? null,
    bonbun:    item['법정동본번코드'] ?? null,
    bubun:     item['법정동부번코드'] ?? null,
    road_nm:   item['도로명'] ?? null,
    build_year: buildYear,
    apt_seq:   item['단지코드'] ?? null,
  }
}

function toTransaction(item, lawdCd, requestYm, service, propType, dealCat) {
  const name      = extractName(item)
  const buildYear = item['건축년도'] ? parseInt(item['건축년도']) : null
  const pKey      = propertyKey(lawdCd, name, propType, buildYear)
  const dealDate  = makeDealDate(item['년'], item['월'], item['일'])
  const area      = item['전용면적'] ? parseFloat(item['전용면적']) : null
  const areaStr   = area != null ? String(area) : ''
  const floor     = item['층'] ? parseInt(item['층']) : null

  let deal_kind, price = null, deposit = null, monthly_rent = null

  if (dealCat === 'trade') {
    deal_kind = 'trade'
    price = parsePrice(item['거래금액'])
  } else {
    deposit      = parsePrice(item['보증금액'] ?? item['보증금'] ?? '')
    monthly_rent = parsePrice(item['월세금액'] ?? item['월세'] ?? '')
    deal_kind    = monthly_rent > 0 ? 'monthly_rent' : 'jeonse'
  }

  return {
    _property_key: pKey,  // resolved to property_id before DB insert
    deal_kind,
    area,
    floor,
    deal_date:        dealDate,
    request_ym:       requestYm,
    price,
    deposit,
    monthly_rent,
    dealing_gbn:      item['거래유형'] ?? null,
    contract_type:    item['계약구분'] ?? null,
    contract_term:    item['계약기간'] ?? null,
    use_rr_right:     item['갱신요구권사용'] ?? null,
    prev_deposit:     item['종전계약보증금'] ? parsePrice(item['종전계약보증금']) : null,
    prev_monthly_rent: item['종전계약월세']  ? parsePrice(item['종전계약월세'])  : null,
    rgst_date:        item['등기일자'] ?? null,
    buyer_gbn:        item['매수자'] ?? null,
    seller_gbn:       item['매도자'] ?? null,
    source_api:       service,
    source_hash:      makeHash(lawdCd, dealDate, name, areaStr, String(floor ?? ''),
                               String(price ?? deposit ?? 0),
                               item['지번'] ?? item['법정동본번코드'] ?? ''),
    raw_item:         item,
  }
}

// ── DB helpers ───────────────────────────────────────────────
async function upsertProperties(propRows) {
  if (propRows.length === 0) return new Map()

  const { error } = await supabase
    .from('properties')
    .upsert(propRows, { onConflict: 'property_key' })
  if (error) throw new Error(`properties upsert: ${error.message}`)

  const keys = propRows.map(p => p.property_key)
  const { data, error: fetchErr } = await supabase
    .from('properties')
    .select('id, property_key')
    .in('property_key', keys)
  if (fetchErr) throw new Error(`properties fetch: ${fetchErr.message}`)

  return new Map(data.map(p => [p.property_key, p.id]))
}

async function upsertTransactions(txnRows) {
  if (txnRows.length === 0) return
  const { error } = await supabase
    .from('transactions')
    .upsert(txnRows, { onConflict: 'source_api,source_hash', ignoreDuplicates: true })
  if (error) throw new Error(`transactions upsert: ${error.message}`)
}

// ── concurrency pool ─────────────────────────────────────────
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

// ── main ─────────────────────────────────────────────────────
async function main() {
  const months = process.env.SEED_FROM
    ? getMonthsFrom(process.env.SEED_FROM)
    : getRecentMonths(2)

  console.log(`Months: ${months[0]} → ${months[months.length - 1]} (${months.length}개월)`)

  const { data: regions, error: regErr } = await supabase.from('regions').select('lawd_cd')
  if (regErr) { console.error(regErr.message); process.exit(1) }

  const SIDO = process.env.SEED_SIDO ? process.env.SEED_SIDO.split(',') : null
  const lawdCds = regions
    .map(r => r.lawd_cd)
    .filter(cd => !SIDO || SIDO.some(p => cd.startsWith(p)))

  console.log(`Regions: ${lawdCds.length}${SIDO ? ` (sido: ${SIDO.join(',')})` : ''}`)
  console.log(`Total tasks: ${SERVICES.length} × ${months.length}개월 × ${lawdCds.length}지역 = ${SERVICES.length * months.length * lawdCds.length}`)

  let totalProps = 0
  let totalTxns  = 0

  const tasks = []
  for (const { service, propType, dealCat } of SERVICES) {
    for (const ym of months) {
      for (const lawdCd of lawdCds) {
        tasks.push(async () => {
          try {
            const items = await withRetry(() => fetchAllPages(service, lawdCd, ym))
            if (items.length === 0) return

            // skip rows with no name (can't build a property key)
            const valid = items.filter(i => extractName(i))

            const propMap = new Map()
            const txns = []
            for (const item of valid) {
              const prop = toProperty(item, lawdCd, propType)
              if (!propMap.has(prop.property_key)) propMap.set(prop.property_key, prop)
              txns.push(toTransaction(item, lawdCd, ym, service, propType, dealCat))
            }

            const keyToId = await upsertProperties(Array.from(propMap.values()))
            totalProps += propMap.size

            const txnRows = txns
              .map(({ _property_key, ...rest }) => ({ ...rest, property_id: keyToId.get(_property_key) }))
              .filter(r => r.property_id != null)

            await upsertTransactions(txnRows)
            totalTxns += txnRows.length

            process.stdout.write(
              `\r props ${totalProps.toLocaleString()} | txns ${totalTxns.toLocaleString()}  `
            )
          } catch (err) {
            console.error(`\n[ERR] ${service}/${ym}/${lawdCd}: ${err.message}`)
          }
        })
      }
    }
  }

  const concurrency = Math.min(parseInt(process.env.SEED_CONCURRENCY ?? '8', 10), 15)
  console.log(`\nConcurrency: ${concurrency}`)
  await runWithConcurrency(tasks, concurrency)
  console.log(`\n\nDone. properties: ${totalProps.toLocaleString()}, transactions: ${totalTxns.toLocaleString()}`)
}

main()
