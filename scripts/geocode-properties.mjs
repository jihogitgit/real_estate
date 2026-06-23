// scripts/geocode-properties.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONCURRENCY = 5
const GEOCODE_URL = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode'

async function geocode(property) {
  const query = [property.name, property.umd_nm].filter(Boolean).join(' ')
  const url = `${GEOCODE_URL}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
      'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for "${query}"`)
  const data = await res.json()
  const addr = data.addresses?.[0]
  return addr ? { lat: parseFloat(addr.y), lng: parseFloat(addr.x) } : null
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

  if (resetId) {
    const { error } = await supabase
      .from('properties')
      .update({ geocoded_at: null, lat: null, lng: null })
      .eq('id', resetId)
    if (error) throw error
    console.log(`Reset geocoded_at for id=${resetId}`)
    return
  }

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, name, umd_nm')
    .is('geocoded_at', null)
    .order('id')

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
