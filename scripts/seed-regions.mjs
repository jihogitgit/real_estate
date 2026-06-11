import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: node scripts/seed-regions.mjs <path-to-lawdcd.csv>')
  process.exit(1)
}

const regions = []

const rl = createInterface({
  input: createReadStream(path.resolve(csvPath)),
  crlfDelay: Infinity,
})

let isFirstLine = true

for await (const line of rl) {
  if (isFirstLine) { isFirstLine = false; continue }
  const parts = line.split(',')
  if (parts.length < 3) continue

  const code = parts[0].trim()
  const fullNm = parts[1].trim()
  const status = parts[2].trim()

  if (code.length !== 10) continue
  if (code.slice(5) !== '00000') continue
  if (status !== '존재') continue
  if (code.slice(0, 2) === '00') continue

  const lawdCd = code.slice(0, 5)
  const nameParts = fullNm.split(' ')
  const sidoNm = nameParts[0] ?? ''
  const sigunguNm = nameParts.slice(1).join(' ') || sidoNm

  regions.push({ lawd_cd: lawdCd, sido_nm: sidoNm, sigungu_nm: sigunguNm, full_nm: fullNm })
}

console.log(`Parsed ${regions.length} regions`)

const BATCH = 500
let inserted = 0

for (let i = 0; i < regions.length; i += BATCH) {
  const batch = regions.slice(i, i + BATCH)
  const { error } = await supabase
    .from('regions')
    .upsert(batch, { onConflict: 'lawd_cd', ignoreDuplicates: false })
  if (error) { console.error('Insert error:', error.message); process.exit(1) }
  inserted += batch.length
  console.log(`Upserted ${inserted}/${regions.length}`)
}

console.log('Done seeding regions')
