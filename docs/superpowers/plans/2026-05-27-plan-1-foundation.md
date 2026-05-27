# Real Estate Portal — Plan 1: Foundation & Data Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 15 프로젝트 초기화, Supabase 스키마, 공공 API 클라이언트, Redis 캐시, Cron 데이터 동기화 라우트까지 데이터 레이어 완성.

**Architecture:** Next.js App Router + TypeScript 기반. 공공 API(청약홈, 한국부동산원)는 Vercel Cron이 매일 새벽 Supabase에 upsert. API Routes는 Upstash Redis를 우선 조회 후 Supabase fallback. 사용자 요청에는 공공 API를 직접 호출하지 않음.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, @supabase/ssr, @upstash/redis, Vitest, React Testing Library

---

## 파일 구조

```
real_estate/
├── src/
│   ├── types/
│   │   └── index.ts              # 전체 도메인 타입 정의
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # 브라우저용 Supabase 클라이언트
│   │   │   └── server.ts         # 서버용 Supabase 클라이언트 (cookies)
│   │   ├── redis.ts              # Upstash Redis 클라이언트 + 캐시 키/TTL
│   │   └── api/
│   │       ├── cheongahk.ts      # 청약홈 공공 API 클라이언트
│   │       └── __tests__/
│   │           └── cheongahk.test.ts
│   └── app/
│       └── api/
│           └── cron/
│               └── sync/
│                   └── route.ts  # Vercel Cron 데이터 동기화 엔드포인트
├── supabase/
│   └── migrations/
│       └── 001_initial.sql       # 전체 스키마 마이그레이션
├── .env.local.example
├── vitest.config.ts
└── next.config.ts
```

---

## Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json` (자동 생성)
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: 프로젝트 디렉토리로 이동 후 Next.js 초기화**

```bash
cd /Users/mw/prodect/real_estate
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbo --yes
```

Expected: `Success! Created your app in /Users/mw/prodect/real_estate`

- [ ] **Step 2: 의존성 추가 설치**

```bash
npm install @supabase/ssr @supabase/supabase-js @upstash/redis
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom @vitest/coverage-v8
```

- [ ] **Step 3: shadcn/ui 초기화**

```bash
npx shadcn@latest init --yes --base-color slate
npx shadcn@latest add button card badge skeleton
```

- [ ] **Step 4: next.config.ts 작성**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.kakaocdn.net' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 5: vitest.config.ts 작성**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 6: package.json에 test 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 7: .env.local.example 작성**

```bash
# .env.local.example
# Supabase (https://supabase.com → 프로젝트 Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Upstash Redis (https://console.upstash.com → Redis → REST API)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# 공공데이터포털 API (https://www.data.go.kr → 마이페이지 → 인증키)
CHEONGAHK_API_KEY=your-api-key

# 카카오 (https://developers.kakao.com → 앱 키)
NEXT_PUBLIC_KAKAO_MAP_KEY=your-kakao-map-key
KAKAO_CLIENT_ID=your-kakao-oauth-client-id

# Cron 보안 시크릿 (openssl rand -base64 32 으로 생성)
CRON_SECRET=random-secret-string
```

- [ ] **Step 8: .env.local 생성 (실제 키 입력)**

```bash
cp .env.local.example .env.local
# .env.local을 열어 실제 키 값 입력
```

- [ ] **Step 9: 초기 커밋**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with TypeScript, Tailwind, shadcn/ui, Vitest"
```

---

## Task 2: 도메인 타입 정의

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 타입 파일 작성**

```typescript
// src/types/index.ts

export interface Apartment {
  id: string
  name: string
  region: string
  district: string | null
  address: string | null
  lat: number | null
  lng: number | null
  supply_date: string | null
  apply_start: string | null
  apply_end: string | null
  total_units: number | null
  min_price: number | null
  max_price: number | null
  source_id: string
  created_at: string
  updated_at: string
}

// 청약홈 공공 API 응답 원본 필드
export interface CheongahkItem {
  pblancNo: string       // 공고번호
  pblancNm: string       // 공고명
  rceptBgnde: string     // 접수 시작일 (YYYYMMDD)
  rceptEndde: string     // 접수 종료일 (YYYYMMDD)
  suplyRgnde: string     // 공급 지역 (예: "서울 강남구")
  totSuplyHshldco: number // 총 공급 세대수
  mnareaExcludePrivateRoadar?: number // 전용면적
}

export interface NormalizedApartment
  extends Omit<Apartment, 'id' | 'lat' | 'lng' | 'supply_date' | 'min_price' | 'max_price' | 'created_at' | 'updated_at'> {}

export interface Article {
  id: string
  slug: string
  title: string
  summary: string | null
  body: string | null
  category: 'news' | 'guide'
  published_at: string
  updated_at: string
}

export interface AlertRecord {
  id: string
  user_id: string
  apartment_id: string
  alert_days_before: number
  is_active: boolean
}

export interface SavedApartment {
  user_id: string
  apartment_id: string
  created_at: string
  apartment?: Apartment
}

export type Region =
  | '서울' | '경기' | '인천' | '부산' | '대구' | '대전'
  | '광주' | '울산' | '세종' | '강원' | '충북' | '충남'
  | '전북' | '전남' | '경북' | '경남' | '제주'

export const ALL_REGIONS: Region[] = [
  '서울', '경기', '인천', '부산', '대구', '대전',
  '광주', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat: add domain type definitions"
```

---

## Task 3: Supabase 스키마 + 클라이언트

**Files:**
- Create: `supabase/migrations/001_initial.sql`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- supabase/migrations/001_initial.sql
create extension if not exists "uuid-ossp";

create table apartments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  region text not null,
  district text,
  address text,
  lat double precision,
  lng double precision,
  supply_date date,
  apply_start date,
  apply_end date,
  total_units integer,
  min_price integer,
  max_price integer,
  source_id text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table articles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,
  category text not null check (category in ('news', 'guide')),
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  push_token text,
  created_at timestamptz default now()
);

create table saved_apartments (
  user_id uuid references users(id) on delete cascade,
  apartment_id uuid references apartments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, apartment_id)
);

create table alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  apartment_id uuid references apartments(id) on delete cascade,
  alert_days_before integer not null default 1,
  is_active boolean not null default true,
  unique (user_id, apartment_id, alert_days_before)
);

-- 성능 인덱스
create index idx_apartments_region on apartments(region);
create index idx_apartments_apply_start on apartments(apply_start);
create index idx_apartments_apply_end on apartments(apply_end);
create index idx_articles_category on articles(category);
create index idx_articles_published_at on articles(published_at desc);
create index idx_alerts_user_id on alerts(user_id);
create index idx_alerts_active on alerts(is_active) where is_active = true;

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger apartments_updated_at
  before update on apartments
  for each row execute function update_updated_at();

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();
```

- [ ] **Step 2: Supabase 대시보드에서 SQL 실행**

Supabase 프로젝트 → SQL Editor → 위 SQL 전체 붙여넣기 → Run

Expected: "Success. No rows returned"

- [ ] **Step 3: 브라우저 클라이언트 작성**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: 서버 클라이언트 작성**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  )
}
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add supabase/ src/lib/supabase/
git commit -m "feat: add Supabase schema migration and client setup"
```

---

## Task 4: Upstash Redis 클라이언트

**Files:**
- Create: `src/lib/redis.ts`

- [ ] **Step 1: redis.ts 작성**

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const CACHE_KEYS = {
  apartmentsList: (region: string) => `apartments:list:${region}`,
  apartmentsDetail: (id: string) => `apartments:detail:${id}`,
  articlesList: () => 'articles:list',
  regionSummary: (name: string) => `region:summary:${name}`,
  allRegions: () => 'apartments:all-regions',
} as const

export const CACHE_TTL = {
  apartmentsList: 3600,    // 1시간
  apartmentsDetail: 21600, // 6시간
  articlesList: 1800,      // 30분
  regionSummary: 7200,     // 2시간
  allRegions: 86400,       // 24시간
} as const

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(fresh))
  return fresh
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/redis.ts
git commit -m "feat: add Upstash Redis client with cache key helpers"
```

---

## Task 5: 청약홈 API 클라이언트

**Files:**
- Create: `src/lib/api/cheongahk.ts`
- Create: `src/lib/api/__tests__/cheongahk.test.ts`

> **참고:** 공공데이터포털(data.go.kr)에서 "청약정보제공시스템" 검색 후 API 신청. 승인 후 서비스키 발급. 실제 API 필드명은 공공 API 문서에서 확인 후 `CheongahkItem` 타입과 맞춰 조정.

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// src/lib/api/__tests__/cheongahk.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchApartmentList, normalizeApartment } from '../cheongahk'
import type { CheongahkItem } from '@/types'

const mockItem: CheongahkItem = {
  pblancNo: 'TEST001',
  pblancNm: '테스트 아파트',
  rceptBgnde: '20250601',
  rceptEndde: '20250605',
  suplyRgnde: '서울 강남구',
  totSuplyHshldco: 100,
}

describe('normalizeApartment', () => {
  it('공공 API 필드를 Apartment 형태로 변환한다', () => {
    const result = normalizeApartment(mockItem)
    expect(result).toEqual({
      source_id: 'TEST001',
      name: '테스트 아파트',
      region: '서울',
      district: '강남구',
      address: null,
      apply_start: '2025-06-01',
      apply_end: '2025-06-05',
      total_units: 100,
    })
  })

  it('지역이 없으면 빈 문자열로 처리한다', () => {
    const result = normalizeApartment({ ...mockItem, suplyRgnde: '' })
    expect(result.region).toBe('')
    expect(result.district).toBe('')
  })

  it('세대수 없으면 0으로 처리한다', () => {
    const result = normalizeApartment({ ...mockItem, totSuplyHshldco: undefined as unknown as number })
    expect(result.total_units).toBe(0)
  })
})

describe('fetchApartmentList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('API 응답에서 items 배열을 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: { body: { items: { item: [mockItem] } } },
      }),
    } as Response)

    const result = await fetchApartmentList()
    expect(result).toHaveLength(1)
    expect(result[0].pblancNo).toBe('TEST001')
  })

  it('items가 없으면 빈 배열을 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: { body: { items: {} } },
      }),
    } as Response)

    const result = await fetchApartmentList()
    expect(result).toEqual([])
  })

  it('HTTP 오류 시 에러를 던진다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    await expect(fetchApartmentList()).rejects.toThrow('청약홈 API error: 500')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm run test:run -- src/lib/api/__tests__/cheongahk.test.ts
```

Expected: FAIL — "Cannot find module '../cheongahk'"

- [ ] **Step 3: 구현 파일 작성**

```typescript
// src/lib/api/cheongahk.ts
import type { CheongahkItem, NormalizedApartment } from '@/types'

const BASE_URL = 'https://apis.data.go.kr/B552555/APTLttotPblancDetail'

function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export function normalizeApartment(item: CheongahkItem): NormalizedApartment {
  const parts = (item.suplyRgnde ?? '').split(' ')
  return {
    source_id: item.pblancNo,
    name: item.pblancNm,
    region: parts[0] ?? '',
    district: parts[1] ?? '',
    address: null,
    apply_start: formatDate(item.rceptBgnde),
    apply_end: formatDate(item.rceptEndde),
    total_units: item.totSuplyHshldco ?? 0,
  }
}

export async function fetchApartmentList(params: {
  pageNo?: number
  numOfRows?: number
} = {}): Promise<CheongahkItem[]> {
  const { pageNo = 1, numOfRows = 100 } = params
  const apiKey = process.env.CHEONGAHK_API_KEY

  const url = new URL(`${BASE_URL}/getLttotPblancSummaryList`)
  url.searchParams.set('serviceKey', apiKey ?? '')
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', String(numOfRows))
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`청약홈 API error: ${res.status}`)

  const data = await res.json()
  return data?.response?.body?.items?.item ?? []
}
```

- [ ] **Step 4: 테스트 재실행 — 통과 확인**

```bash
npm run test:run -- src/lib/api/__tests__/cheongahk.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/api/
git commit -m "feat: add 청약홈 public API client with normalization"
```

---

## Task 6: Cron 데이터 동기화 API Route

**Files:**
- Create: `src/app/api/cron/sync/route.ts`

- [ ] **Step 1: Cron 라우트 작성**

```typescript
// src/app/api/cron/sync/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchApartmentList, normalizeApartment } from '@/lib/api/cheongahk'
import { redis, CACHE_KEYS } from '@/lib/redis'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await fetchApartmentList({ numOfRows: 100 })
    const normalized = items.map(normalizeApartment)

    if (normalized.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No data from API' })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('apartments')
      .upsert(normalized, { onConflict: 'source_id', ignoreDuplicates: false })

    if (error) throw error

    // 변경된 지역의 Redis 캐시 무효화
    const regions = [...new Set(normalized.map((a) => a.region).filter(Boolean))]
    await Promise.all([
      ...regions.map((r) => redis.del(CACHE_KEYS.apartmentsList(r))),
      redis.del(CACHE_KEYS.allRegions()),
    ])

    return NextResponse.json({ synced: normalized.length, regions })
  } catch (err) {
    console.error('[cron/sync] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 2: vercel.json에 Cron 스케줄 등록**

프로젝트 루트에 `vercel.json` 생성:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 18 * * *"
    }
  ]
}
```

> `0 18 * * *` = UTC 18:00 = 한국시간 새벽 3:00

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 개발 서버에서 수동 테스트**

```bash
npm run dev
```

새 터미널에서:

```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/cron/sync
```

Expected: `{"synced": N, "regions": ["서울", ...]}` (API 키가 유효한 경우)

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/cron/ vercel.json
git commit -m "feat: add Vercel Cron sync route for 청약홈 data"
```

---

## Plan 1 완료 체크리스트

- [ ] `npm run test:run` — 전체 테스트 통과
- [ ] `npx tsc --noEmit` — TypeScript 에러 없음
- [ ] `npm run build` — 빌드 성공
- [ ] Supabase 대시보드에서 테이블 생성 확인
- [ ] `.env.local`에 모든 키 입력 완료

완료 후 → **Plan 2: Core Pages & SEO** 로 진행
