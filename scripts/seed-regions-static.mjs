import { createClient } from '@supabase/supabase-js'
import { REGIONS } from '../data/regions-static.mjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('필수 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const BATCH = 100

async function main() {
  console.log(`총 ${REGIONS.length}개 시군구 코드 업서트 시작`)

  let inserted = 0
  for (let i = 0; i < REGIONS.length; i += BATCH) {
    const batch = REGIONS.slice(i, i + BATCH)
    const { error } = await supabase
      .from('regions')
      .upsert(batch, { onConflict: 'lawd_cd' })

    if (error) {
      console.error(`배치 ${i}~${i + batch.length - 1} 실패:`, error.message)
      process.exit(1)
    }
    inserted += batch.length
    process.stdout.write(`\r진행: ${inserted}/${REGIONS.length}`)
  }

  console.log(`\n완료: ${REGIONS.length}개 regions 업서트`)
}

main().catch(err => { console.error(err); process.exit(1) })
