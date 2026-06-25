# 둥지 부동산 — Naver 로드뷰 + Supabase 실데이터 연동 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase `properties`/`transactions` 실데이터를 API 라우트로 제공하고, Naver Geocoding으로 좌표를 채운 뒤, Detail 화면 히어로에 로드뷰 파노라마를 표시한다. 동시에 청약·토지·경매 메뉴를 홈/내비에서 숨긴다.

**Architecture:** Next.js API 라우트(서버사이드)가 Supabase `properties` + `transactions`를 집계해 `Complex[]`·`Trade[]` 형태로 반환한다. 좌표는 GitHub Actions 수동 워크플로우로 Naver Geocoding API를 일괄 호출해 `properties.lat/lng`에 저장하고, `geocoded_at` 플래그로 중복 호출을 방지한다. 클라이언트는 기존 `RTMS.*` 메서드를 통해 API를 호출하며 실패 시 mock DB로 폴백한다.

**Tech Stack:** Next.js 15 App Router, Supabase JS v2, Naver Maps JS API (panorama submodule), Naver Geocoding REST API, GitHub Actions

---

## File Map

| 파일 | 변경 |
|------|------|
| `properties` Supabase 테이블 | ALTER TABLE — lat, lng, geocoded_at 추가 |
| `src/components/dungji/store.tsx` | Complex.xy nullable, Complex.hh nullable, mock DB xy→null |
| `scripts/geocode-properties.mjs` | 신규 — Naver Geocoding 일괄 처리 |
| `.github/workflows/geocode-properties.yml` | 신규 — 수동 트리거 워크플로우 |
| `src/app/api/dungji/complexes/route.ts` | 신규 — properties 조회 + transactions 집계 |
| `src/app/api/dungji/complexes/[id]/route.ts` | 신규 — 단건 complex 조회 |
| `src/app/api/dungji/trades/route.ts` | 신규 — 거래 내역 |
| `src/components/dungji/NaverPanorama.tsx` | 신규 — Naver Panorama React 래퍼 |
| `src/app/layout.tsx` | Naver Maps SDK `<Script>` 추가 |
| `src/components/dungji/screens/Detail.tsx` | RTMS.getComplex 사용, hh nullable, 히어로 교체 |
| `src/components/dungji/screens/Nav.tsx` | 청약·토지·경매 메뉴 제거 |
| `src/components/dungji/screens/Home.tsx` | CatTile·탭·청약 섹션 제거 |

---

## Task 1: DB 마이그레이션

**Files:**
- Supabase 대시보드 SQL Editor

- [ ] **Step 1: Supabase 대시보드 → SQL Editor에서 실행**

```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS lat         NUMERIC,
  ADD COLUMN IF NOT EXISTS lng         NUMERIC,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
```

- [ ] **Step 2: 실행 확인**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('lat', 'lng', 'geocoded_at');
```

Expected: 3행 반환 (`lat numeric`, `lng numeric`, `geocoded_at timestamp with time zone`)

- [ ] **Step 3: `.env.local`에 서버사이드 환경변수 추가**

```
SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드 Settings > API에서 복사>
NAVER_CLIENT_ID=ckd59ofa78
NAVER_CLIENT_SECRET=FHipt6Rl6liUSG9l13QWY0zNcSLqWBaOxmniVACn
```

⚠️ `NAVER_CLIENT_SECRET`은 절대 `NEXT_PUBLIC_` 접두사 금지. 서버사이드 전용.

---

## Task 2: TypeScript 타입 업데이트

**Files:**
- Modify: `src/components/dungji/store.tsx`

- [ ] **Step 1: Complex 인터페이스에서 xy와 hh를 nullable로 변경**

`store.tsx` 6-10줄의 `Complex` 인터페이스:

```typescript
// 기존
export interface Complex {
  id: string; name: string; gu: string; dong: string; code: string
  built: number; hh: number; type: string; d1: number; rankd: number; hot: boolean
  xy: [number, number]; areas: Area[]; spark: number[]; series: number[]
}

// 변경
export interface Complex {
  id: string; name: string; gu: string; dong: string; code: string
  built: number; hh: number | null; type: string; d1: number; rankd: number; hot: boolean
  xy: [number, number] | null; areas: Area[]; spark: number[]; series: number[]
}
```

- [ ] **Step 2: mock DB의 xy를 null로 변경 (pixel 좌표는 GPS가 아님)**

`store.tsx` 42-65줄에서 각 complex의 `xy: [숫자, 숫자] as [number,number]`를 모두 `xy: null`로 변경:

```typescript
{ id: 'c1', name: '래미안 원베일리', gu: '서초구', dong: '반포동', code: '11650', built: 2023, hh: 2990, type: '아파트', d1: 3.2, rankd: 2, hot: true, xy: null,
```

(c1~c8 전부 `xy: null`로, `as [number,number]` 캐스트 제거)

- [ ] **Step 3: mock DB의 `as Complex[]` 캐스트 확인**

66줄의 `] as Complex[]` — 타입이 맞으므로 유지.

- [ ] **Step 4: TypeScript 검사**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: `store.tsx` 관련 오류 없음 (Detail.tsx에서 `c.hh.toLocaleString()` 오류가 나오면 Task 8에서 수정)

- [ ] **Step 5: Commit**

```bash
git add src/components/dungji/store.tsx
git commit -m "types: make Complex.xy and Complex.hh nullable"
```

---

## Task 3: Geocoding 배치 스크립트

**Files:**
- Create: `scripts/geocode-properties.mjs`

- [ ] **Step 1: 스크립트 작성**

```javascript
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
```

- [ ] **Step 2: 로컬 실행 테스트 (소규모 확인)**

```bash
node scripts/geocode-properties.mjs
```

Expected: `Found N ungeocoded properties` 후 진행 (N=실제 properties 수)
`not_found` 건은 정상 — Naver 지오코딩으로 못 찾는 단지 이름은 좌표 없이 `geocoded_at`만 기록됨

- [ ] **Step 3: Supabase에서 결과 확인**

```sql
SELECT
  COUNT(*) FILTER (WHERE geocoded_at IS NOT NULL) AS processed,
  COUNT(*) FILTER (WHERE lat IS NOT NULL)          AS with_coords,
  COUNT(*) FILTER (WHERE geocoded_at IS NULL)      AS remaining
FROM properties;
```

- [ ] **Step 4: Commit**

```bash
git add scripts/geocode-properties.mjs
git commit -m "feat: add geocode-properties batch script"
```

---

## Task 4: GitHub Actions 워크플로우 (Geocoding)

**Files:**
- Create: `.github/workflows/geocode-properties.yml`

- [ ] **Step 1: 워크플로우 파일 작성**

```yaml
name: Geocode Properties

on:
  workflow_dispatch:
    inputs:
      reset_id:
        description: '특정 property id의 geocoded_at 초기화 (선택)'
        required: false
        default: ''

concurrency:
  group: geocode-properties
  cancel-in-progress: false

jobs:
  geocode:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Run geocoding
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NAVER_CLIENT_ID: ${{ secrets.NAVER_CLIENT_ID }}
          NAVER_CLIENT_SECRET: ${{ secrets.NAVER_CLIENT_SECRET }}
        run: |
          if [ -n "${{ github.event.inputs.reset_id }}" ]; then
            node scripts/geocode-properties.mjs --reset-id=${{ github.event.inputs.reset_id }}
          else
            node scripts/geocode-properties.mjs
          fi
```

- [ ] **Step 2: GitHub Secrets 등록 확인**

GitHub 리포지토리 → Settings → Secrets and variables → Actions에서 확인:
- `NEXT_PUBLIC_SUPABASE_URL` ✓ (sync-transactions에서 이미 있을 것)
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `NAVER_CLIENT_ID` — 없으면 추가: `ckd59ofa78`
- `NAVER_CLIENT_SECRET` — 없으면 추가 (값은 .env.local의 것과 동일)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/geocode-properties.yml
git commit -m "ci: add geocode-properties workflow"
```

---

## Task 5: /api/dungji/complexes 라우트

**Files:**
- Create: `src/app/api/dungji/complexes/route.ts`

- [ ] **Step 1: 라우트 파일 작성**

```typescript
// src/app/api/dungji/complexes/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const GU_MAP: Record<string, string> = {
  '11110': '종로구', '11140': '중구', '11170': '용산구', '11200': '성동구',
  '11215': '광진구', '11230': '동대문구', '11260': '중랑구', '11290': '성북구',
  '11305': '강북구', '11320': '도봉구', '11350': '노원구', '11380': '은평구',
  '11410': '서대문구', '11440': '마포구', '11470': '양천구', '11500': '강서구',
  '11530': '구로구', '11545': '금천구', '11560': '영등포구', '11590': '동작구',
  '11620': '관악구', '11650': '서초구', '11680': '강남구', '11710': '송파구',
  '11740': '강동구',
  '28110': '중구', '28140': '동구', '28177': '미추홀구', '28185': '연수구',
  '28200': '남동구', '28237': '부평구', '28245': '계양구', '28260': '서구',
  '41': '경기', // fallback prefix
}

const BUCKETS = [
  { py: 18, ex: 59.9, min: 0,   max: 65  },
  { py: 25, ex: 84.9, min: 65,  max: 95  },
  { py: 33, ex: 114.9, min: 95, max: 120 },
  { py: 39, ex: 129.9, min: 120, max: Infinity },
]

function bucket(area: number) {
  return BUCKETS.find((b) => area >= b.min && area < b.max) ?? BUCKETS[1]
}

function monthKey(dateStr: string): string {
  return dateStr.replace(/-/g, '').slice(0, 6) // YYYYMM — handles both YYYYMMDD and YYYY-MM-DD
}

function lastNMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((s, v) => s + v, 0) / nums.length)
}

function guName(lawdCd: string | number | null): string {
  const s = String(lawdCd ?? '').slice(0, 5)
  return GU_MAP[s] ?? s
}

function buildComplex(
  p: Record<string, unknown>,
  trades: Record<string, unknown>[],
  jeonses: Record<string, unknown>[],
  rankd: number,
  months12: string[],
) {
  // area stats per bucket
  type BucketStats = { sales: number[]; jeonseAmts: number[] }
  const stats = new Map<number, BucketStats>()

  for (const t of trades) {
    const b = bucket(Number(t.area ?? 0))
    if (!stats.has(b.py)) stats.set(b.py, { sales: [], jeonseAmts: [] })
    stats.get(b.py)!.sales.push(Number(t.price ?? 0))
  }
  for (const t of jeonses) {
    const b = bucket(Number(t.area ?? 0))
    if (!stats.has(b.py)) stats.set(b.py, { sales: [], jeonseAmts: [] })
    stats.get(b.py)!.jeonseAmts.push(Number(t.deposit ?? 0))
  }

  const areas = BUCKETS
    .filter((b) => stats.has(b.py))
    .map((b) => {
      const s = stats.get(b.py)!
      return { ex: b.ex, py: b.py, sale: avg(s.sales), jeonse: avg(s.jeonseAmts), d: 0 }
    })

  if (!areas.length) areas.push({ ex: 84.9, py: 25, sale: 0, jeonse: 0, d: 0 })

  // monthly series for main area bucket (25평 or first available)
  const mainPy = areas[Math.min(1, areas.length - 1)].py
  const monthly = new Map<string, number[]>()
  for (const t of trades) {
    if (bucket(Number(t.area ?? 0)).py !== mainPy) continue
    const mk = monthKey(String(t.deal_date ?? ''))
    if (!mk || mk.length < 6) continue
    if (!monthly.has(mk)) monthly.set(mk, [])
    monthly.get(mk)!.push(Number(t.price ?? 0))
  }

  let lastVal = 0
  const series = months12.map((mk) => {
    const prices = monthly.get(mk)
    if (prices?.length) { lastVal = avg(prices); return lastVal }
    return lastVal // forward-fill gaps
  })

  const d1 = series[series.length - 2] > 0
    ? parseFloat(((series[series.length - 1] - series[series.length - 2]) / series[series.length - 2] * 100).toFixed(1))
    : 0

  // areas price-change vs prev month
  const areasWithDelta = areas.map((a) => {
    const prevMonthBucketKey = months12[months12.length - 2]
    const curMonthBucketKey = months12[months12.length - 1]
    const byBucket = new Map<number, number[]>()
    for (const t of trades) {
      const b = bucket(Number(t.area ?? 0))
      const mk = monthKey(String(t.deal_date ?? ''))
      if (!byBucket.has(b.py)) byBucket.set(b.py, [])
      if ([prevMonthBucketKey, curMonthBucketKey].includes(mk)) {
        // We'll re-compute per-bucket monthly avg below
      }
    }
    // Per-bucket delta
    const prevPrices: number[] = [], curPrices: number[] = []
    for (const t of trades) {
      const b = bucket(Number(t.area ?? 0))
      if (b.py !== a.py) continue
      const mk = monthKey(String(t.deal_date ?? ''))
      if (mk === prevMonthBucketKey) prevPrices.push(Number(t.price ?? 0))
      if (mk === curMonthBucketKey) curPrices.push(Number(t.price ?? 0))
    }
    const prevAvg = avg(prevPrices), curAvg = avg(curPrices)
    const d = (prevAvg > 0 && curAvg > 0)
      ? parseFloat(((curAvg - prevAvg) / prevAvg * 100).toFixed(1))
      : 0
    return { ...a, d }
  })

  return {
    id: String(p.id),
    name: String(p.name ?? ''),
    gu: guName(p.lawd_cd as string | number | null),
    dong: String(p.umd_nm ?? ''),
    code: String(p.lawd_cd ?? ''),
    built: Number(p.build_year ?? 0),
    hh: null,
    type: String(p.type ?? '아파트'),
    d1,
    rankd,
    hot: rankd > 0 && rankd <= 3,
    xy: (p.geocoded_at && p.lat != null && p.lng != null)
      ? [Number(p.lat), Number(p.lng)] as [number, number]
      : null,
    areas: areasWithDelta,
    spark: series.slice(-7),
    series,
  }
}

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const q      = searchParams.get('q') ?? ''

  const supabase = makeSupabase()

  let propQ = supabase
    .from('properties')
    .select('id, name, type, lawd_cd, umd_nm, build_year, lat, lng, geocoded_at')
    .range(offset, offset + limit - 1)

  if (q) propQ = propQ.ilike('name', `%${q}%`)

  const { data: properties, error: propErr } = await propQ
  if (propErr) return NextResponse.json({ error: propErr.message }, { status: 500 })
  if (!properties?.length) return NextResponse.json([])

  const ids = properties.map((p) => p.id)
  const months12 = lastNMonths(12)
  const months13 = lastNMonths(13)
  const cutoff = months13[0] + '01' // YYYYMMDD — earliest date to include

  const [{ data: trades }, { data: jeonses }] = await Promise.all([
    supabase
      .from('transactions')
      .select('property_id, area, price, deal_date')
      .in('property_id', ids)
      .eq('deal_kind', 'trade')
      .gte('deal_date', cutoff),
    supabase
      .from('transactions')
      .select('property_id, area, deposit, deal_date')
      .in('property_id', ids)
      .eq('deal_kind', 'jeonse')
      .gte('deal_date', cutoff),
  ])

  // trade volume in last 30 days for rankd
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff30 = monthKey(thirtyDaysAgo.toISOString()) // YYYYMM

  const tradesByProp = new Map<number, typeof trades>()
  for (const t of trades ?? []) {
    if (!tradesByProp.has(t.property_id)) tradesByProp.set(t.property_id, [])
    tradesByProp.get(t.property_id)!.push(t)
  }
  const jeonsesByProp = new Map<number, typeof jeonses>()
  for (const t of jeonses ?? []) {
    if (!jeonsesByProp.has(t.property_id)) jeonsesByProp.set(t.property_id, [])
    jeonsesByProp.get(t.property_id)!.push(t)
  }

  // rank by 30-day trade count
  const counts = properties
    .map((p) => ({
      id: p.id,
      count: (tradesByProp.get(p.id) ?? [])
        .filter((t) => monthKey(String(t.deal_date)) >= cutoff30).length,
    }))
    .sort((a, b) => b.count - a.count)

  const rankMap = new Map<number, number>()
  counts.slice(0, 10).forEach((e, i) => rankMap.set(e.id, i + 1))

  const complexes = properties.map((p) =>
    buildComplex(
      p,
      tradesByProp.get(p.id) ?? [],
      jeonsesByProp.get(p.id) ?? [],
      rankMap.get(p.id) ?? -1,
      months12,
    )
  )

  return NextResponse.json(complexes)
}
```

- [ ] **Step 2: 로컬에서 테스트**

```bash
# dev 서버 실행 중일 때
curl "http://localhost:3000/api/dungji/complexes?limit=3" | jq '.[0] | {id, name, gu, dong, areas: (.areas | length), xy}'
```

Expected: `name`, `gu`, `areas` 등 필드 포함 JSON 반환. `xy`는 geocoding 완료 전까지 `null`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/dungji/complexes/route.ts
git commit -m "feat: add /api/dungji/complexes route with Supabase aggregation"
```

---

## Task 6: /api/dungji/complexes/[id] 라우트

**Files:**
- Create: `src/app/api/dungji/complexes/[id]/route.ts`

- [ ] **Step 1: 디렉토리 확인**

```bash
ls src/app/api/dungji/complexes/
```

Expected: `route.ts` (Task 5에서 생성)

- [ ] **Step 2: 단건 라우트 작성**

```typescript
// src/app/api/dungji/complexes/[id]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 같은 집계 로직을 재사용하기 위해 복사 (buildComplex, helpers)
// — 두 라우트가 같은 파일을 import하면 번들 복잡도 상승 없이 공유 가능하지만,
//   현재 코드량이 작으므로 인라인으로 유지한다.

const GU_MAP: Record<string, string> = {
  '11110': '종로구', '11140': '중구', '11170': '용산구', '11200': '성동구',
  '11215': '광진구', '11230': '동대문구', '11260': '중랑구', '11290': '성북구',
  '11305': '강북구', '11320': '도봉구', '11350': '노원구', '11380': '은평구',
  '11410': '서대문구', '11440': '마포구', '11470': '양천구', '11500': '강서구',
  '11530': '구로구', '11545': '금천구', '11560': '영등포구', '11590': '동작구',
  '11620': '관악구', '11650': '서초구', '11680': '강남구', '11710': '송파구',
  '11740': '강동구',
}

const BUCKETS = [
  { py: 18, ex: 59.9,  min: 0,   max: 65  },
  { py: 25, ex: 84.9,  min: 65,  max: 95  },
  { py: 33, ex: 114.9, min: 95,  max: 120 },
  { py: 39, ex: 129.9, min: 120, max: Infinity },
]

function bucket(area: number) {
  return BUCKETS.find((b) => area >= b.min && area < b.max) ?? BUCKETS[1]
}

function monthKey(dateStr: string): string {
  return dateStr.replace(/-/g, '').slice(0, 6)
}

function lastNMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((s, v) => s + v, 0) / nums.length)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: p, error: propErr } = await supabase
    .from('properties')
    .select('id, name, type, lawd_cd, umd_nm, build_year, lat, lng, geocoded_at')
    .eq('id', id)
    .single()

  if (propErr || !p) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const months12 = lastNMonths(12)
  const months13 = lastNMonths(13)
  const cutoff = months13[0] + '01'

  const [{ data: trades }, { data: jeonses }] = await Promise.all([
    supabase
      .from('transactions')
      .select('property_id, area, price, deal_date')
      .eq('property_id', p.id)
      .eq('deal_kind', 'trade')
      .gte('deal_date', cutoff),
    supabase
      .from('transactions')
      .select('property_id, area, deposit, deal_date')
      .eq('property_id', p.id)
      .eq('deal_kind', 'jeonse')
      .gte('deal_date', cutoff),
  ])

  const allTrades = trades ?? []
  const allJeonses = jeonses ?? []

  // Build areas
  type BS = { sales: number[]; jeonseAmts: number[] }
  const statsMap = new Map<number, BS>()
  for (const t of allTrades) {
    const b = bucket(Number(t.area ?? 0))
    if (!statsMap.has(b.py)) statsMap.set(b.py, { sales: [], jeonseAmts: [] })
    statsMap.get(b.py)!.sales.push(Number(t.price ?? 0))
  }
  for (const t of allJeonses) {
    const b = bucket(Number(t.area ?? 0))
    if (!statsMap.has(b.py)) statsMap.set(b.py, { sales: [], jeonseAmts: [] })
    statsMap.get(b.py)!.jeonseAmts.push(Number(t.deposit ?? 0))
  }

  const areas = BUCKETS
    .filter((b) => statsMap.has(b.py))
    .map((b) => {
      const s = statsMap.get(b.py)!
      return { ex: b.ex, py: b.py, sale: avg(s.sales), jeonse: avg(s.jeonseAmts), d: 0 }
    })
  if (!areas.length) areas.push({ ex: 84.9, py: 25, sale: 0, jeonse: 0, d: 0 })

  const mainPy = areas[Math.min(1, areas.length - 1)].py
  const monthly = new Map<string, number[]>()
  for (const t of allTrades) {
    if (bucket(Number(t.area ?? 0)).py !== mainPy) continue
    const mk = monthKey(String(t.deal_date ?? ''))
    if (!mk || mk.length < 6) continue
    if (!monthly.has(mk)) monthly.set(mk, [])
    monthly.get(mk)!.push(Number(t.price ?? 0))
  }

  let lastVal = 0
  const series = months12.map((mk) => {
    const prices = monthly.get(mk)
    if (prices?.length) { lastVal = avg(prices); return lastVal }
    return lastVal
  })

  const d1 = series[series.length - 2] > 0
    ? parseFloat(((series[series.length - 1] - series[series.length - 2]) / series[series.length - 2] * 100).toFixed(1))
    : 0

  const guKey = String(p.lawd_cd ?? '').slice(0, 5)

  return NextResponse.json({
    id: String(p.id),
    name: String(p.name ?? ''),
    gu: GU_MAP[guKey] ?? guKey,
    dong: String(p.umd_nm ?? ''),
    code: String(p.lawd_cd ?? ''),
    built: Number(p.build_year ?? 0),
    hh: null,
    type: String(p.type ?? '아파트'),
    d1,
    rankd: -1,
    hot: false,
    xy: (p.geocoded_at && p.lat != null && p.lng != null)
      ? [Number(p.lat), Number(p.lng)] as [number, number]
      : null,
    areas,
    spark: series.slice(-7),
    series,
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/dungji/complexes/[id]/route.ts
git commit -m "feat: add /api/dungji/complexes/[id] route"
```

---

## Task 7: /api/dungji/trades 라우트

**Files:**
- Create: `src/app/api/dungji/trades/route.ts`

- [ ] **Step 1: 라우트 작성**

```typescript
// src/app/api/dungji/trades/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getAreaPy(area: number): number {
  if (area < 65)  return 18
  if (area < 95)  return 25
  if (area < 120) return 33
  return 39
}

function formatDate(dateStr: string): string {
  const s = String(dateStr ?? '').replace(/-/g, '')
  if (s.length >= 8) return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`
  if (s.length >= 6) return `${s.slice(0, 4)}.${s.slice(4, 6)}`
  return dateStr
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: txns, error } = await supabase
    .from('transactions')
    .select('deal_kind, area, price, deposit, floor, deal_date')
    .eq('property_id', id)
    .in('deal_kind', ['trade', 'jeonse'])
    .order('deal_date', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!txns?.length) return NextResponse.json([])

  // 최근 3개월 최고가 → 신고가 태그
  const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  const recentByBucket = new Map<number, { price: number; idx: number }>()
  txns.forEach((t, idx) => {
    if (t.deal_kind !== 'trade') return
    const dateStr = String(t.deal_date ?? '').replace(/-/g, '')
    if (dateStr < cutoff) return
    const py = getAreaPy(Number(t.area ?? 0))
    const price = Number(t.price ?? 0)
    const cur = recentByBucket.get(py)
    if (!cur || price > cur.price) recentByBucket.set(py, { price, idx })
  })

  const highIdxes = new Set([...recentByBucket.values()].map((v) => v.idx))

  const trades = txns.map((t, idx) => ({
    date: formatDate(String(t.deal_date ?? '')),
    ex: Number(t.area ?? 0),
    py: getAreaPy(Number(t.area ?? 0)),
    floor: Number(t.floor ?? 0),
    price: t.deal_kind === 'trade' ? Number(t.price ?? 0) : Number(t.deposit ?? 0),
    deal: t.deal_kind === 'trade' ? '매매' : '전세',
    tag: highIdxes.has(idx) ? '신고가' : '',
  }))

  return NextResponse.json(trades)
}
```

- [ ] **Step 2: 테스트**

```bash
# 실제 property id는 /api/dungji/complexes 응답에서 가져옴
curl "http://localhost:3000/api/dungji/trades?id=<property_id>" | jq '.[0]'
```

Expected: `{ date: "2026.03.15", ex: 84.9, py: 25, floor: 7, price: 120000, deal: "매매", tag: "" }` 형태

- [ ] **Step 3: Commit**

```bash
git add src/app/api/dungji/trades/route.ts
git commit -m "feat: add /api/dungji/trades route"
```

---

## Task 8: NaverPanorama 컴포넌트

**Files:**
- Create: `src/components/dungji/NaverPanorama.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/components/dungji/NaverPanorama.tsx
'use client'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    naver?: {
      maps?: {
        LatLng: new (lat: number, lng: number) => object
        Panorama: new (
          el: HTMLElement,
          opts: { position: object; pov: { pan: number; tilt: number; zoom: number } }
        ) => { destroy?: () => void }
      }
    }
  }
}

interface Props {
  lat: number
  lng: number
  h?: number
}

export default function NaverPanorama({ lat, lng, h = 200 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const panoRef = useRef<{ destroy?: () => void } | null>(null)

  useEffect(() => {
    let attempts = 0
    const tryInit = () => {
      if (!ref.current) return
      if (!window.naver?.maps?.Panorama) {
        if (++attempts < 20) setTimeout(tryInit, 500) // max 10초 대기
        return
      }
      try {
        panoRef.current = new window.naver.maps.Panorama(ref.current, {
          position: new window.naver.maps.LatLng(lat, lng),
          pov: { pan: 0, tilt: 0, zoom: 1 },
        })
      } catch {
        // 해당 좌표에 로드뷰 없음 — 배경색만 표시
      }
    }
    tryInit()
    return () => {
      panoRef.current?.destroy?.()
      panoRef.current = null
    }
  }, [lat, lng])

  return (
    <div
      ref={ref}
      style={{ width: '100%', height: h, background: '#d1d9e0' }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dungji/NaverPanorama.tsx
git commit -m "feat: add NaverPanorama component"
```

---

## Task 9: layout.tsx에 Naver Maps SDK 추가

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Kakao Maps Script 태그 바로 아래에 Naver Maps Script 추가**

`layout.tsx` 37-40줄의 Kakao Script 태그 직후:

```tsx
{/* 기존 Kakao Maps Script 아래에 추가 */}
<Script
  src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=ckd59ofa78&submodules=panorama"
  strategy="afterInteractive"
/>
```

전체 변경 위치 (`src/app/layout.tsx` 37-41줄 기준):

```tsx
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />
        <Script
          src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=ckd59ofa78&submodules=panorama"
          strategy="afterInteractive"
        />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Naver Maps SDK with panorama submodule"
```

---

## Task 10: Detail.tsx 업데이트

**Files:**
- Modify: `src/components/dungji/screens/Detail.tsx`

- [ ] **Step 1: NaverPanorama import 추가 + 실데이터 complex 로드**

`Detail.tsx` 1-4줄의 import 영역에 추가:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useStore, DB, RTMS, Trade } from '../store'
import { T, won, Icon, Tag, Delta, Ph, Seg, LineChart, Chip, Button } from '../ds'
import NaverPanorama from '../NaverPanorama'
import type { Complex } from '../store'
```

- [ ] **Step 2: Detail 함수 내 complex 로드를 RTMS.getComplex로 변경**

`Detail.tsx` 71-79줄의 함수 시작 부분을:

```typescript
export function Detail() {
  const { state, nav, back, seen, toggleFav } = useStore()
  const id = state.route.params?.id
  const c = DB.complexes.find((x) => x.id === id) || DB.complexes[0]
  const [trades, setTrades] = useState<Trade[]>([])
  const [areaIdx, setAreaIdx] = useState(0)
  const [period, setPeriod] = useState(1)
  const [tradeTab, setTradeTab] = useState(0)
  const isFav = state.favs.includes(c.id)
```

다음으로 변경:

```typescript
export function Detail() {
  const { state, nav, back, seen, toggleFav } = useStore()
  const id = state.route.params?.id
  const fallback = DB.complexes.find((x) => x.id === id) || DB.complexes[0]
  const [c, setC] = useState<Complex>(fallback)
  const [trades, setTrades] = useState<Trade[]>([])
  const [areaIdx, setAreaIdx] = useState(0)
  const [period, setPeriod] = useState(1)
  const [tradeTab, setTradeTab] = useState(0)
  const isFav = state.favs.includes(c.id)
```

- [ ] **Step 3: useEffect에서 RTMS.getComplex 호출 추가**

`Detail.tsx` 81-88줄의 useEffect를:

```typescript
  useEffect(() => {
    seen(c.id)
    if (DB.trades[c.id]) {
      RTMS.getTrades(c.id).then(setTrades)
    } else {
      setTrades(genTrades(c))
    }
  }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps
```

다음으로 변경:

```typescript
  useEffect(() => {
    if (!id) return
    RTMS.getComplex(id).then((complex) => {
      if (complex) setC(complex)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    seen(c.id)
    RTMS.getTrades(c.id).then((t) => {
      setTrades(t.length ? t : genTrades(c))
    })
  }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: 히어로 영역에서 `<Ph>` → NaverPanorama 조건 교체**

`Detail.tsx` 115줄:

```typescript
// 기존
          <Ph h={200} label={c.name} style={{ borderRadius: 0 }} />

// 변경
          {c.xy !== null
            ? <NaverPanorama lat={c.xy[0]} lng={c.xy[1]} h={200} />
            : <Ph h={200} label={c.name} style={{ borderRadius: 0 }} />}
```

- [ ] **Step 5: hh nullable 처리 (2곳)**

125줄:
```typescript
// 기존
              {c.gu} {c.dong} · {c.built}년 · {c.hh.toLocaleString()}세대

// 변경
              {c.gu} {c.dong} · {c.built}년{c.hh != null ? ` · ${c.hh.toLocaleString()}세대` : ''}
```

237줄:
```typescript
// 기존
          <KV k="총 세대수" v={`${c.hh.toLocaleString()}세대`} />

// 변경
          <KV k="총 세대수" v={c.hh != null ? `${c.hh.toLocaleString()}세대` : '-'} />
```

- [ ] **Step 6: TypeScript 검사**

```bash
npx tsc --noEmit 2>&1 | grep Detail
```

Expected: 오류 없음

- [ ] **Step 7: Commit**

```bash
git add src/components/dungji/screens/Detail.tsx
git commit -m "feat: Detail uses real complex data + NaverPanorama hero"
```

---

## Task 11: 메뉴 숨김 (Nav.tsx + Home.tsx)

**Files:**
- Modify: `src/components/dungji/screens/Nav.tsx`
- Modify: `src/components/dungji/screens/Home.tsx`

### Nav.tsx

- [ ] **Step 1: NAVS에서 cheong, land, auc 제거**

`Nav.tsx` 7-14줄:

```typescript
// 기존
const NAVS = [
  { k: 'home', label: '홈' },
  { k: 'sil', label: '실거래가' },
  { k: 'map', label: '지도매물' },
  { k: 'cheong', label: '청약' },
  { k: 'land', label: '토지' },
  { k: 'auc', label: '경매' },
]

// 변경
const NAVS = [
  { k: 'home', label: '홈' },
  { k: 'sil', label: '실거래가' },
  { k: 'map', label: '지도매물' },
]
```

- [ ] **Step 2: NAV_KEY_MAP에서 청약·토지·경매 키 제거**

`Nav.tsx` 16-20줄:

```typescript
// 기존
const NAV_KEY_MAP: Record<string, string> = {
  home: 'home', search: 'home', sil: 'sil', detail: 'sil',
  map: 'map', cheong: 'cheong', land: 'land', landDetail: 'land',
  auc: 'auc', aucDetail: 'auc', mypage: 'home', login: 'home',
}

// 변경
const NAV_KEY_MAP: Record<string, string> = {
  home: 'home', search: 'home', sil: 'sil', detail: 'sil',
  map: 'map', mypage: 'home', login: 'home',
}
```

### Home.tsx

- [ ] **Step 3: 80줄의 cheong 변수 제거**

```typescript
// 기존 (80줄)
  const cheong = DB.cheong.slice(0, 3)

// 삭제 (해당 줄 전체 제거)
```

- [ ] **Step 4: 89줄 히어로 subtitle 수정**

```typescript
// 기존
          <div style={{ fontSize: 16.5, color: 'rgba(255,255,255,.86)', fontWeight: 500, marginTop: 10, marginBottom: 26 }}>실거래가 · 청약 · 토지 · 경매까지 — 흩어진 부동산 정보를 한 곳에서</div>

// 변경
          <div style={{ fontSize: 16.5, color: 'rgba(255,255,255,.86)', fontWeight: 500, marginTop: 10, marginBottom: 26 }}>실거래가 — 단지별 시세와 실거래 내역을 한눈에</div>
```

- [ ] **Step 5: 91-94줄 검색 필터 탭에서 청약·경매·토지 제거**

```typescript
// 기존
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([['통합검색', ''], ['실거래가', 'sil'], ['청약', 'cheong'], ['경매', 'auc'], ['토지', 'land']] as [string, string][]).map(([t, scr], i) => (
              <span key={t} onClick={() => i > 0 && nav(scr)} style={{ padding: '7px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: i === 0 ? 'rgba(255,255,255,.22)' : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,.72)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</span>
            ))}
          </div>

// 변경
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([['통합검색', ''], ['실거래가', 'sil']] as [string, string][]).map(([t, scr], i) => (
              <span key={t} onClick={() => i > 0 && nav(scr)} style={{ padding: '7px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: i === 0 ? 'rgba(255,255,255,.22)' : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,.72)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</span>
            ))}
          </div>
```

- [ ] **Step 6: 115-121줄 카테고리 타일에서 청약·토지·경매 제거**

```typescript
// 기존
        <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
          <CatTile icon="chart" label="실거래가" sub="매매·전월세 시세" color={T.sil} soft={T.silSoft} onClick={() => nav('sil')} />
          <CatTile icon="doc" label="청약" sub="분양·경쟁률·일정" color={T.cheong} soft={T.cheongSoft} onClick={() => nav('cheong')} />
          <CatTile icon="layers" label="토지매매" sub="지목·공시지가" color={T.land} soft={T.landSoft} onClick={() => nav('land')} />
          <CatTile icon="gavel" label="경매" sub="법원·감정가" color={T.auc} soft={T.aucSoft} onClick={() => nav('auc')} />
          <CatTile icon="map" label="지도매물" sub="지도로 둘러보기" color={T.primary} soft={T.primarySoft} onClick={() => nav('map')} />
        </div>

// 변경
        <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
          <CatTile icon="chart" label="실거래가" sub="매매·전월세 시세" color={T.sil} soft={T.silSoft} onClick={() => nav('sil')} />
          <CatTile icon="map" label="지도매물" sub="지도로 둘러보기" color={T.primary} soft={T.primarySoft} onClick={() => nav('map')} />
        </div>
```

- [ ] **Step 7: 144-171줄 실거래 HOT + 청약 그리드에서 청약 패널 제거**

```typescript
// 기존
        {/* 실거래 HOT + 청약 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.5 }}>🔥 이번 주 실거래 HOT</div>
              <Seg items={['매매', '전세']} active={deal} onSel={setDeal} size="sm" />
            </div>
            {ranked.map((c, i) => <RankRow key={c.id} i={i + 1} c={c} />)}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, padding: 24 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.5, marginBottom: 16 }}>📅 다가오는 청약</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cheong.map((a) => (
                <div key={a.id} onClick={() => nav('cheong')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.cardAlt, borderRadius: 14, cursor: 'pointer' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: a.dday <= 2 ? T.up : T.cheong, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{a.when}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                    <div style={{ fontSize: 12.5, color: T.ink3, fontWeight: 500, marginTop: 2 }}>{a.loc} · {a.type} · {a.py}</div>
                  </div>
                  <Tag color={a.status === '접수중' ? T.sil : T.ink3} bg={a.status === '접수중' ? T.silSoft : T.lineSoft}>{a.status}</Tag>
                </div>
              ))}
            </div>
            <button onClick={() => nav('cheong')} style={{ width: '100%', height: 46, marginTop: 16, borderRadius: 12, border: 'none', background: T.bg, color: T.ink2, fontFamily: T.font, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>청약 캘린더 전체보기</button>
          </div>
        </div>

// 변경 (단일 컬럼)
        {/* 실거래 HOT */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.5 }}>🔥 이번 주 실거래 HOT</div>
            <Seg items={['매매', '전세']} active={deal} onSel={setDeal} size="sm" />
          </div>
          {ranked.map((c, i) => <RankRow key={c.id} i={i + 1} c={c} />)}
        </div>
```

- [ ] **Step 8: Home.tsx의 ranked를 실거래 실데이터에서 가져오도록 변경**

79줄:
```typescript
// 기존
  const ranked = [...DB.complexes].sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1)).slice(0, 5)

// 변경 (RTMS에서 받아온 실데이터 list 기준)
  const ranked = [...list].sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1)).slice(0, 5)
```

- [ ] **Step 9: TypeScript 검사 및 미사용 import 정리**

```bash
npx tsc --noEmit 2>&1 | grep -E "Home|Nav"
```

`Home.tsx`에서 `Cheong` 타입이 더 이상 사용되지 않으면 import에서 제거:
```typescript
import { useStore, DB, RTMS } from '../store'
// Cheong import 없으면 그대로 ok
```

- [ ] **Step 10: Commit**

```bash
git add src/components/dungji/screens/Nav.tsx src/components/dungji/screens/Home.tsx
git commit -m "feat: hide 청약·토지·경매 from nav and home"
```

---

## Task 12: 최종 검증

- [ ] **Step 1: 전체 TypeScript 검사**

```bash
npx tsc --noEmit 2>&1
```

Expected: 오류 0건

- [ ] **Step 2: 빌드 검사**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` (또는 Route 목록 출력)

- [ ] **Step 3: 개발 서버에서 기능 확인**

```bash
npm run dev
```

확인 체크리스트:
- [ ] 홈 화면: 내비에 홈·실거래가·지도매물 3개만 표시
- [ ] 홈 화면: 카테고리 타일 2개(실거래가·지도매물)만 표시
- [ ] 홈 화면: 청약 캘린더 패널 없음
- [ ] 홈 화면: 실거래 HOT 랭킹에 Supabase 실데이터 로드됨
- [ ] 단지 클릭 → Detail: 히어로 영역에 `<Ph>` 플레이스홀더 표시 (geocoding 전)
- [ ] Geocoding 실행 후 Detail: NaverPanorama 로드뷰 표시 (좌표 있는 단지)

- [ ] **Step 4: 최종 Commit**

```bash
git add -A
git commit -m "feat: Supabase real data + Naver roadview + menu cleanup — complete"
```

---

## 참고: deal_date 형식 불일치 시 대응

`transactions.deal_date`가 `YYYYMMDD` 텍스트가 아닌 `YYYY-MM-DD` 날짜 형식으로 저장된 경우, `cutoff` 비교가 달라진다. 다음 쿼리로 실제 형식 확인:

```sql
SELECT deal_date FROM transactions LIMIT 3;
```

- `20260101` 형태 → 현재 코드 그대로 사용
- `2026-01-01` 형태 → Task 5·7의 cutoff 계산을:
  ```typescript
  // YYYYMMDD 대신
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 13)
  const cutoffStr = cutoff.toISOString().slice(0, 10) // '2025-05-01'
  ```
  로 변경하고, `monthKey()` 함수는 두 형식 모두 `.replace(/-/g, '')` 처리하므로 그대로 사용 가능.
