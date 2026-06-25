// scripts/geocode-properties.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONCURRENCY = 5
const GEOCODE_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'

async function geocode(property) {
  const query = [property.name, property.umd_nm].filter(Boolean).join(' ')
  const url = `${GEOCODE_URL}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for "${query}"`)
  const data = await res.json()
  const doc = data.documents?.[0]
  return doc ? { lat: parseFloat(doc.y), lng: parseFloat(doc.x) } : null
}

async function processChunk(chunk) {
  return Promise.all(
    chunk.map(async (property) => {
      try {
        const coords = await geocode(property)
        const patch = coords
          ? { lat: coords.lat, lng: coords.lng, geocoded_at: new Date().toISOString() }
          : { geocoded_at: new Date().toISOString() }
        const { error } = await supabase.from('properties').update(patch).eq('id', property.id)
        if (error) throw error
        return coords ? 'geocoded' : 'not_found'
      } catch (err) {
        console.error(`  ✗ [${property.id}] ${property.name}: ${err.message}`)
        return 'error'
      }
    })
  )
}

async function main() {
  const resetId = process.argv.find((a) => a.startsWith('--reset-id='))?.split('=')[1]
  const lawdCdArg = process.argv.find((a) => a.startsWith('--lawd-cd='))?.split('=')[1]

  if (resetId) {
    const { error } = await supabase
      .from('properties')
      .update({ geocoded_at: null, lat: null, lng: null })
      .eq('id', resetId)
    if (error) throw error
    console.log(`Reset geocoded_at for id=${resetId}`)
    return
  }

  const PAGE = 1000
  let all = []
  let from = 0
  const codes = lawdCdArg ? lawdCdArg.split(',').map((s) => s.trim()) : null
  if (codes) console.log(`Filtering by lawd_cd: ${codes.join(', ')}`)

  while (true) {
    let q = supabase
      .from('properties')
      .select('id, name, umd_nm')
      .is('geocoded_at', null)
      .order('id')
      .range(from, from + PAGE - 1)
    if (codes) q = q.in('lawd_cd', codes)
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const properties = all
  const error = null

  if (error) throw error
  console.log(`Found ${properties.length} ungeocoded properties`)

  let geocoded = 0, not_found = 0, errors = 0

  for (let i = 0; i < properties.length; i += CONCURRENCY) {
    const chunk = properties.slice(i, i + CONCURRENCY)
    const results = await processChunk(chunk)
    for (const r of results) {
      if (r === 'geocoded') geocoded++
      else if (r === 'not_found') not_found++
      else errors++
    }
    const done = Math.min(i + CONCURRENCY, properties.length)
    process.stdout.write(`\r  Progress: ${done}/${properties.length}`)
  }

  console.log(`\nDone. geocoded=${geocoded} not_found=${not_found} errors=${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
