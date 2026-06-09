# Real Estate Transactions (실거래가) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국토교통부 RTMS API에서 아파트·오피스텔·다세대 매매/전세월세 실거래가 데이터를 수집해 Supabase에 저장하고, 청약 단지 상세 페이지에 주변 실거래가 위젯을 추가한다.

**Architecture:** 6개 RTMS 서비스 엔드포인트 → 6개 전용 DB 테이블(apt_trades, apt_rents, offi_trades, offi_rents, multi_trades, multi_rents) + regions 테이블. GitHub Actions 월간 크론이 전국 250개 시군구를 concurrency 10으로 수집하고, Vercel cron이 백업 역할을 한다. MD5 source_hash로 중복 방지, ON CONFLICT DO NOTHING upsert로 멱등성 보장.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL), 국토교통부 RTMS API, GitHub Actions, Vitest, Node.js crypto (MD5)

---

## File Map

| 파일 | 역할 |
|------|------|
| `supabase/migrations/002_real_estate_transactions.sql` | regions + 6 트랜잭션 테이블 DDL |
| `src/types/rtms.ts` | RTMS API 응답 타입 + DB row 타입 |
| `src/lib/api/rtms.ts` | RTMS HTTP 클라이언트 (fetch + pagination) |
| `src/lib/__tests__/rtms.test.ts` | rtms 클라이언트 단위 테스트 |
| `src/lib/rtms-normalizer.ts` | API 응답 → DB row 정규화 |
| `src/lib/__tests__/rtms-normalizer.test.ts` | 정규화 단위 테스트 |
| `scripts/seed-regions.mjs` | 법정동코드 CSV → regions 테이블 로더 |
| `scripts/seed-transactions.mjs` | 최근 3개월 bulk 수집 스크립트 |
| `src/app/api/cron/sync-transactions/route.ts` | 월간 크론 API route |
| `src/app/api/cron/__tests__/sync-transactions.test.ts` | 크론 route 테스트 |
| `src/app/api/real-estate/transactions/route.ts` | 실거래가 목록 API |
| `src/app/api/real-estate/stats/route.ts` | 단지별 통계 API |
| `src/app/api/real-estate/search/route.ts` | 단지명 검색 API |
| `.github/workflows/sync-transactions.yml` | GitHub Actions 크론 워크플로우 |
| `vercel.json` | sync-transactions cron 항목 추가 |
| `src/components/real-estate/NearbyTransactionsWidget.tsx` | 주변 실거래가 위젯 |
| `src/app/apply/[id]/page.tsx` | 위젯 삽입 (수정) |

---

### Task 1: DB Migration — regions + 6 트랜잭션 테이블

**Files:**
- Create: `supabase/migrations/002_real_estate_transactions.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/002_real_estate_transactions.sql

-- pg_trgm extension for fuzzy building name search
create extension if not exists pg_trgm;

-- ============================================================
-- regions (법정동코드 시군구 단위)
-- ============================================================
create table regions (
  lawd_cd   char(5)  primary key,
  sido_nm   text     not null,
  sigungu_nm text    not null,
  full_nm   text     not null
);

-- ============================================================
-- apt_trades (아파트 매매)
-- ============================================================
create table apt_trades (
  id           bigserial    primary key,
  lawd_cd      char(5)      not null references regions(lawd_cd),
  request_ym   char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  apt_dong     text,
  jibun        text,
  bonbun       text,
  bubun        text,
  apt_nm       text,
  apt_seq      text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer      not null check (price >= 0),
  deal_date    date         not null,
  road_nm      text,
  dealing_gbn  text,
  rgst_date    text,
  buyer_gbn    text,
  seller_gbn   text,
  source_api   text         not null,
  source_hash  text         not null,
  raw_item     jsonb,
  fetched_at   timestamptz  default now(),
  updated_at   timestamptz  default now(),
  unique (source_api, source_hash)
);

create index apt_trades_lawd_cd_deal_date on apt_trades (lawd_cd, deal_date desc);
create index apt_trades_apt_nm_trgm on apt_trades using gin (apt_nm gin_trgm_ops);
create index apt_trades_area_date on apt_trades (area, deal_date desc);

create trigger set_apt_trades_updated_at
  before update on apt_trades
  for each row execute function update_updated_at();

-- ============================================================
-- apt_rents (아파트 전월세)
-- ============================================================
create table apt_rents (
  id               bigserial    primary key,
  lawd_cd          char(5)      not null references regions(lawd_cd),
  request_ym       char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm           text,
  apt_dong         text,
  jibun            text,
  apt_nm           text,
  apt_seq          text,
  build_year       integer,
  area             numeric(10,3),
  floor            integer,
  deposit          integer      not null check (deposit >= 0),
  monthly_rent     integer      not null check (monthly_rent >= 0),
  deal_date        date         not null,
  contract_type    text,
  contract_term    text,
  use_rr_right     text,
  prev_deposit     integer,
  prev_monthly_rent integer,
  source_api       text         not null,
  source_hash      text         not null,
  raw_item         jsonb,
  fetched_at       timestamptz  default now(),
  updated_at       timestamptz  default now(),
  unique (source_api, source_hash)
);

create index apt_rents_lawd_cd_deal_date on apt_rents (lawd_cd, deal_date desc);
create index apt_rents_apt_nm_trgm on apt_rents using gin (apt_nm gin_trgm_ops);
create index apt_rents_area_date on apt_rents (area, deal_date desc);

create trigger set_apt_rents_updated_at
  before update on apt_rents
  for each row execute function update_updated_at();

-- ============================================================
-- offi_trades (오피스텔 매매)
-- ============================================================
create table offi_trades (
  id           bigserial    primary key,
  lawd_cd      char(5)      not null references regions(lawd_cd),
  request_ym   char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  jibun        text,
  offi_nm      text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer      not null check (price >= 0),
  deal_date    date         not null,
  dealing_gbn  text,
  source_api   text         not null,
  source_hash  text         not null,
  raw_item     jsonb,
  fetched_at   timestamptz  default now(),
  updated_at   timestamptz  default now(),
  unique (source_api, source_hash)
);

create index offi_trades_lawd_cd_deal_date on offi_trades (lawd_cd, deal_date desc);
create index offi_trades_offi_nm_trgm on offi_trades using gin (offi_nm gin_trgm_ops);
create index offi_trades_complex_area_date on offi_trades (offi_nm, area, deal_date desc);

create trigger set_offi_trades_updated_at
  before update on offi_trades
  for each row execute function update_updated_at();

-- ============================================================
-- offi_rents (오피스텔 전월세)
-- ============================================================
create table offi_rents (
  id               bigserial    primary key,
  lawd_cd          char(5)      not null references regions(lawd_cd),
  request_ym       char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm           text,
  jibun            text,
  offi_nm          text,
  build_year       integer,
  area             numeric(10,3),
  floor            integer,
  deposit          integer      not null check (deposit >= 0),
  monthly_rent     integer      not null check (monthly_rent >= 0),
  deal_date        date         not null,
  contract_type    text,
  contract_term    text,
  use_rr_right     text,
  prev_deposit     integer,
  prev_monthly_rent integer,
  source_api       text         not null,
  source_hash      text         not null,
  raw_item         jsonb,
  fetched_at       timestamptz  default now(),
  updated_at       timestamptz  default now(),
  unique (source_api, source_hash)
);

create index offi_rents_lawd_cd_deal_date on offi_rents (lawd_cd, deal_date desc);
create index offi_rents_offi_nm_trgm on offi_rents using gin (offi_nm gin_trgm_ops);
create index offi_rents_complex_area_date on offi_rents (offi_nm, area, deal_date desc);

create trigger set_offi_rents_updated_at
  before update on offi_rents
  for each row execute function update_updated_at();

-- ============================================================
-- multi_trades (다세대/연립 매매)
-- ============================================================
create table multi_trades (
  id           bigserial    primary key,
  lawd_cd      char(5)      not null references regions(lawd_cd),
  request_ym   char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  jibun        text,
  bonbun       text,
  bubun        text,
  house_nm     text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer      not null check (price >= 0),
  deal_date    date         not null,
  dealing_gbn  text,
  rgst_date    text,
  buyer_gbn    text,
  seller_gbn   text,
  source_api   text         not null,
  source_hash  text         not null,
  raw_item     jsonb,
  fetched_at   timestamptz  default now(),
  updated_at   timestamptz  default now(),
  unique (source_api, source_hash)
);

create index multi_trades_lawd_cd_deal_date on multi_trades (lawd_cd, deal_date desc);
create index multi_trades_house_nm_trgm on multi_trades using gin (house_nm gin_trgm_ops);
create index multi_trades_complex_area_date on multi_trades (house_nm, area, deal_date desc);

create trigger set_multi_trades_updated_at
  before update on multi_trades
  for each row execute function update_updated_at();

-- ============================================================
-- multi_rents (다세대/연립 전월세)
-- ============================================================
create table multi_rents (
  id               bigserial    primary key,
  lawd_cd          char(5)      not null references regions(lawd_cd),
  request_ym       char(6)      not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm           text,
  jibun            text,
  house_nm         text,
  build_year       integer,
  area             numeric(10,3),
  floor            integer,
  deposit          integer      not null check (deposit >= 0),
  monthly_rent     integer      not null check (monthly_rent >= 0),
  deal_date        date         not null,
  contract_type    text,
  contract_term    text,
  use_rr_right     text,
  prev_deposit     integer,
  prev_monthly_rent integer,
  source_api       text         not null,
  source_hash      text         not null,
  raw_item         jsonb,
  fetched_at       timestamptz  default now(),
  updated_at       timestamptz  default now(),
  unique (source_api, source_hash)
);

create index multi_rents_lawd_cd_deal_date on multi_rents (lawd_cd, deal_date desc);
create index multi_rents_house_nm_trgm on multi_rents using gin (house_nm gin_trgm_ops);
create index multi_rents_complex_area_date on multi_rents (house_nm, area, deal_date desc);

create trigger set_multi_rents_updated_at
  before update on multi_rents
  for each row execute function update_updated_at();

-- ============================================================
-- UNION ALL view for unified querying
-- ============================================================
create or replace view real_estate_transactions as
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    price, null::integer as deposit, null::integer as monthly_rent,
    coalesce(apt_nm, '') as complex_nm,
    'apt_trades' as table_name, 'trade' as deal_kind
  from apt_trades
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    null, deposit, monthly_rent,
    coalesce(apt_nm, ''),
    'apt_rents', 'rent'
  from apt_rents
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    price, null, null,
    coalesce(offi_nm, ''),
    'offi_trades', 'trade'
  from offi_trades
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    null, deposit, monthly_rent,
    coalesce(offi_nm, ''),
    'offi_rents', 'rent'
  from offi_rents
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    price, null, null,
    coalesce(house_nm, ''),
    'multi_trades', 'trade'
  from multi_trades
union all
  select
    id, lawd_cd, request_ym, deal_date, area, floor,
    null, deposit, monthly_rent,
    coalesce(house_nm, ''),
    'multi_rents', 'rent'
  from multi_rents;
```

- [ ] **Step 2: Apply migration to Supabase**

```bash
npx supabase db push
# 또는 Supabase 대시보드 SQL Editor에 붙여넣기 실행
```

Expected: `Applied 1 migration` 또는 SQL Editor에서 `Success`

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db diff --use-migra
```

Expected: 변경 없음 (테이블이 정상 생성됨)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_real_estate_transactions.sql
git commit -m "feat: add real estate transaction tables migration"
```

---

### Task 2: TypeScript Types (`src/types/rtms.ts`)

**Files:**
- Create: `src/types/rtms.ts`

- [ ] **Step 1: Write types file**

```typescript
// src/types/rtms.ts

// ── Raw API response types ────────────────────────────────────

export interface RtmsAptTradeItem {
  법정동?: string
  법정동본번코드?: string
  법정동부번코드?: string
  아파트?: string
  단지코드?: string
  건축년도?: string
  전용면적?: string
  층?: string
  거래금액?: string
  년?: string
  월?: string
  일?: string
  도로명?: string
  거래유형?: string
  등기일자?: string
  매수자?: string
  매도자?: string
  [key: string]: string | undefined
}

export interface RtmsAptRentItem {
  법정동?: string
  아파트?: string
  단지코드?: string
  건축년도?: string
  전용면적?: string
  층?: string
  보증금액?: string
  월세금액?: string
  년?: string
  월?: string
  일?: string
  계약구분?: string
  계약기간?: string
  갱신요구권사용?: string
  종전계약보증금?: string
  종전계약월세?: string
  [key: string]: string | undefined
}

export interface RtmsOffiTradeItem {
  법정동?: string
  지번?: string
  단지명?: string
  건축년도?: string
  전용면적?: string
  층?: string
  거래금액?: string
  년?: string
  월?: string
  일?: string
  거래유형?: string
  [key: string]: string | undefined
}

export interface RtmsOffiRentItem {
  법정동?: string
  지번?: string
  단지명?: string
  건축년도?: string
  전용면적?: string
  층?: string
  보증금?: string
  월세?: string
  년?: string
  월?: string
  일?: string
  계약구분?: string
  계약기간?: string
  갱신요구권사용?: string
  종전계약보증금?: string
  종전계약월세?: string
  [key: string]: string | undefined
}

export interface RtmsMultiTradeItem {
  법정동?: string
  지번?: string
  연립다세대?: string
  건축년도?: string
  전용면적?: string
  층?: string
  거래금액?: string
  년?: string
  월?: string
  일?: string
  거래유형?: string
  등기일자?: string
  매수자?: string
  매도자?: string
  [key: string]: string | undefined
}

export interface RtmsMultiRentItem {
  법정동?: string
  지번?: string
  연립다세대?: string
  건축년도?: string
  전용면적?: string
  층?: string
  보증금액?: string
  월세금액?: string
  년?: string
  월?: string
  일?: string
  계약구분?: string
  계약기간?: string
  갱신요구권사용?: string
  종전계약보증금?: string
  종전계약월세?: string
  [key: string]: string | undefined
}

export type RtmsApiItem =
  | RtmsAptTradeItem
  | RtmsAptRentItem
  | RtmsOffiTradeItem
  | RtmsOffiRentItem
  | RtmsMultiTradeItem
  | RtmsMultiRentItem

// ── DB row insert types ───────────────────────────────────────

export interface AptTradeInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  apt_dong?: string | null
  jibun?: string | null
  bonbun?: string | null
  bubun?: string | null
  apt_nm?: string | null
  apt_seq?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  price: number
  deal_date: string
  road_nm?: string | null
  dealing_gbn?: string | null
  rgst_date?: string | null
  buyer_gbn?: string | null
  seller_gbn?: string | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface AptRentInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  apt_dong?: string | null
  jibun?: string | null
  apt_nm?: string | null
  apt_seq?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  deposit: number
  monthly_rent: number
  deal_date: string
  contract_type?: string | null
  contract_term?: string | null
  use_rr_right?: string | null
  prev_deposit?: number | null
  prev_monthly_rent?: number | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface OffiTradeInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  offi_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  price: number
  deal_date: string
  dealing_gbn?: string | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface OffiRentInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  offi_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  deposit: number
  monthly_rent: number
  deal_date: string
  contract_type?: string | null
  contract_term?: string | null
  use_rr_right?: string | null
  prev_deposit?: number | null
  prev_monthly_rent?: number | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface MultiTradeInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  bonbun?: string | null
  bubun?: string | null
  house_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  price: number
  deal_date: string
  dealing_gbn?: string | null
  rgst_date?: string | null
  buyer_gbn?: string | null
  seller_gbn?: string | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface MultiRentInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  house_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  deposit: number
  monthly_rent: number
  deal_date: string
  contract_type?: string | null
  contract_term?: string | null
  use_rr_right?: string | null
  prev_deposit?: number | null
  prev_monthly_rent?: number | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export type RtmsInsertRow =
  | AptTradeInsert
  | AptRentInsert
  | OffiTradeInsert
  | OffiRentInsert
  | MultiTradeInsert
  | MultiRentInsert

// ── Service config ────────────────────────────────────────────

export type RtmsServiceName =
  | 'getRTMSDataSvcAptTradeDev'
  | 'getRTMSDataSvcAptRent'
  | 'getRTMSDataSvcOffiTrade'
  | 'getRTMSDataSvcOffiRent'
  | 'getRTMSDataSvcRHDwelling'
  | 'getRTMSDataSvcRHDwellingRent'

export type RtmsTableName =
  | 'apt_trades'
  | 'apt_rents'
  | 'offi_trades'
  | 'offi_rents'
  | 'multi_trades'
  | 'multi_rents'

export interface RtmsServiceConfig {
  service: RtmsServiceName
  table: RtmsTableName
}

export const RTMS_SERVICES: RtmsServiceConfig[] = [
  { service: 'getRTMSDataSvcAptTradeDev', table: 'apt_trades' },
  { service: 'getRTMSDataSvcAptRent',     table: 'apt_rents' },
  { service: 'getRTMSDataSvcOffiTrade',   table: 'offi_trades' },
  { service: 'getRTMSDataSvcOffiRent',    table: 'offi_rents' },
  { service: 'getRTMSDataSvcRHDwelling',  table: 'multi_trades' },
  { service: 'getRTMSDataSvcRHDwellingRent', table: 'multi_rents' },
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/types/rtms.ts
git commit -m "feat: add RTMS API and DB row TypeScript types"
```

---

### Task 3: RTMS API 클라이언트 (`src/lib/api/rtms.ts`)

**Files:**
- Create: `src/lib/api/rtms.ts`
- Create: `src/lib/__tests__/rtms.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/rtms.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRtmsPage, extractItems } from '@/lib/api/rtms'

describe('extractItems', () => {
  it('returns array when items.item is an array', () => {
    const body = { response: { body: { items: { item: [{ 아파트: 'A' }, { 아파트: 'B' }] }, numOfRows: 10, totalCount: 2 } } }
    expect(extractItems(body)).toHaveLength(2)
  })

  it('returns single-element array when items.item is an object', () => {
    const body = { response: { body: { items: { item: { 아파트: 'A' } }, numOfRows: 10, totalCount: 1 } } }
    expect(extractItems(body)).toHaveLength(1)
  })

  it('returns empty array when items is empty string', () => {
    const body = { response: { body: { items: '', numOfRows: 10, totalCount: 0 } } }
    expect(extractItems(body)).toEqual([])
  })

  it('returns empty array when items.item is absent', () => {
    const body = { response: { body: { items: {}, numOfRows: 10, totalCount: 0 } } }
    expect(extractItems(body)).toEqual([])
  })
})

describe('fetchRtmsPage', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('calls correct URL with params and returns items', async () => {
    const mockItems = [{ 아파트: 'TestApt', 거래금액: '55,000' }]
    const mockBody = {
      response: {
        body: {
          items: { item: mockItems },
          numOfRows: 1000,
          totalCount: 1,
        },
      },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBody),
    }))

    const result = await fetchRtmsPage({
      service: 'getRTMSDataSvcAptTradeDev',
      lawdCd: '11110',
      dealYmd: '202606',
      pageNo: 1,
      apiKey: 'test-key',
    })

    expect(fetch).toHaveBeenCalledOnce()
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('getRTMSDataSvcAptTradeDev')
    expect(calledUrl).toContain('LAWD_CD=11110')
    expect(calledUrl).toContain('DEAL_YMD=202606')
    expect(calledUrl).toContain('pageNo=1')
    expect(calledUrl).toContain('numOfRows=1000')
    expect(calledUrl).toContain('_type=json')
    expect(result.items).toEqual(mockItems)
    expect(result.totalCount).toBe(1)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(
      fetchRtmsPage({ service: 'getRTMSDataSvcAptTradeDev', lawdCd: '11110', dealYmd: '202606', pageNo: 1, apiKey: 'k' })
    ).rejects.toThrow('RTMS API error: 500')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/rtms.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/api/rtms'`

- [ ] **Step 3: Write implementation**

```typescript
// src/lib/api/rtms.ts
import type { RtmsApiItem, RtmsServiceName } from '@/types/rtms'

const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvc'

export interface FetchRtmsPageParams {
  service: RtmsServiceName
  lawdCd: string
  dealYmd: string
  pageNo: number
  apiKey: string
}

export interface FetchRtmsPageResult {
  items: RtmsApiItem[]
  totalCount: number
  numOfRows: number
}

export function extractItems(body: unknown): RtmsApiItem[] {
  const items = (body as Record<string, unknown>)?.response
    ? ((body as Record<string, unknown>).response as Record<string, unknown>)?.body
      ? (((body as Record<string, unknown>).response as Record<string, unknown>).body as Record<string, unknown>)?.items
      : undefined
    : undefined

  if (!items || typeof items === 'string') return []

  const item = (items as Record<string, unknown>).item
  if (!item) return []
  if (Array.isArray(item)) return item as RtmsApiItem[]
  return [item as RtmsApiItem]
}

export async function fetchRtmsPage({
  service,
  lawdCd,
  dealYmd,
  pageNo,
  apiKey,
}: FetchRtmsPageParams): Promise<FetchRtmsPageResult> {
  const url = new URL(`${BASE_URL}/${service}`)
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('LAWD_CD', lawdCd)
  url.searchParams.set('DEAL_YMD', dealYmd)
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', '1000')
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`RTMS API error: ${res.status}`)

  const data = await res.json()
  const body = (data as Record<string, unknown>)?.response as Record<string, unknown> | undefined
  const bodyData = body?.body as Record<string, unknown> | undefined
  const totalCount = Number(bodyData?.totalCount ?? 0)
  const numOfRows = Number(bodyData?.numOfRows ?? 1000)
  const items = extractItems(data)

  return { items, totalCount, numOfRows }
}

export async function fetchAllRtmsItems({
  service,
  lawdCd,
  dealYmd,
  apiKey,
}: Omit<FetchRtmsPageParams, 'pageNo'>): Promise<RtmsApiItem[]> {
  const all: RtmsApiItem[] = []
  let pageNo = 1

  while (true) {
    const { items, numOfRows } = await fetchRtmsPage({ service, lawdCd, dealYmd, pageNo, apiKey })
    all.push(...items)
    if (items.length < numOfRows) break
    pageNo++
  }

  return all
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/rtms.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/rtms.ts src/lib/__tests__/rtms.test.ts
git commit -m "feat: add RTMS API client with pagination"
```

---

### Task 4: RTMS 정규화 (`src/lib/rtms-normalizer.ts`)

**Files:**
- Create: `src/lib/rtms-normalizer.ts`
- Create: `src/lib/__tests__/rtms-normalizer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/rtms-normalizer.test.ts
import { describe, it, expect } from 'vitest'
import {
  parsePrice,
  makeDealDate,
  makeSourceHash,
  normalizeAptTrade,
  normalizeAptRent,
  normalizeOffiTrade,
  normalizeMultiTrade,
} from '@/lib/rtms-normalizer'

describe('parsePrice', () => {
  it('parses comma-formatted integer', () => {
    expect(parsePrice('55,000')).toBe(55000)
  })
  it('returns 0 for empty/undefined', () => {
    expect(parsePrice(undefined)).toBe(0)
    expect(parsePrice('')).toBe(0)
  })
  it('handles no comma', () => {
    expect(parsePrice('5000')).toBe(5000)
  })
})

describe('makeDealDate', () => {
  it('zero-pads month and day', () => {
    expect(makeDealDate('2024', '4', '3')).toBe('2024-04-03')
  })
  it('handles already-padded values', () => {
    expect(makeDealDate('2024', '11', '25')).toBe('2024-11-25')
  })
})

describe('makeSourceHash', () => {
  it('produces consistent MD5 hex string', () => {
    const hash = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    expect(hash).toMatch(/^[a-f0-9]{32}$/)
  })
  it('same inputs produce same hash', () => {
    const a = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    const b = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    expect(a).toBe(b)
  })
  it('different inputs produce different hashes', () => {
    const a = makeSourceHash(['11110', '2024-04-03', 'TestApt', '84.99', '5', '55000', '123'])
    const b = makeSourceHash(['11110', '2024-04-03', 'OtherApt', '84.99', '5', '55000', '123'])
    expect(a).not.toBe(b)
  })
})

describe('normalizeAptTrade', () => {
  const item = {
    법정동: '역삼동',
    아파트: '역삼래미안',
    건축년도: '2003',
    전용면적: '84.927',
    층: '5',
    거래금액: '55,000',
    년: '2024',
    월: '4',
    일: '3',
  }

  it('maps all fields correctly', () => {
    const row = normalizeAptTrade(item, '11680', '202404', 'getRTMSDataSvcAptTradeDev')
    expect(row.lawd_cd).toBe('11680')
    expect(row.request_ym).toBe('202404')
    expect(row.umd_nm).toBe('역삼동')
    expect(row.apt_nm).toBe('역삼래미안')
    expect(row.build_year).toBe(2003)
    expect(row.area).toBeCloseTo(84.927)
    expect(row.floor).toBe(5)
    expect(row.price).toBe(55000)
    expect(row.deal_date).toBe('2024-04-03')
    expect(row.source_api).toBe('getRTMSDataSvcAptTradeDev')
    expect(row.source_hash).toMatch(/^[a-f0-9]{32}$/)
  })

  it('price falls back to 0 when 거래금액 absent', () => {
    const row = normalizeAptTrade({ 년: '2024', 월: '4', 일: '3' }, '11680', '202404', 'getRTMSDataSvcAptTradeDev')
    expect(row.price).toBe(0)
  })
})

describe('normalizeAptRent', () => {
  const item = {
    법정동: '역삼동',
    아파트: '역삼래미안',
    건축년도: '2003',
    전용면적: '84.927',
    층: '5',
    보증금액: '30,000',
    월세금액: '100',
    년: '2024',
    월: '4',
    일: '3',
  }

  it('maps deposit and monthly_rent', () => {
    const row = normalizeAptRent(item, '11680', '202404', 'getRTMSDataSvcAptRent')
    expect(row.deposit).toBe(30000)
    expect(row.monthly_rent).toBe(100)
  })
})

describe('normalizeOffiTrade', () => {
  it('uses 단지명 for offi_nm', () => {
    const item = { 단지명: '강남오피스텔', 거래금액: '80,000', 년: '2024', 월: '6', 일: '1' }
    const row = normalizeOffiTrade(item, '11680', '202406', 'getRTMSDataSvcOffiTrade')
    expect(row.offi_nm).toBe('강남오피스텔')
    expect(row.price).toBe(80000)
  })
})

describe('normalizeMultiTrade', () => {
  it('uses 연립다세대 for house_nm', () => {
    const item = { 연립다세대: '신사빌라', 거래금액: '20,000', 년: '2024', 월: '5', 일: '10' }
    const row = normalizeMultiTrade(item, '11680', '202405', 'getRTMSDataSvcRHDwelling')
    expect(row.house_nm).toBe('신사빌라')
    expect(row.price).toBe(20000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/rtms-normalizer.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/rtms-normalizer'`

- [ ] **Step 3: Write implementation**

```typescript
// src/lib/rtms-normalizer.ts
import { createHash } from 'crypto'
import type {
  RtmsAptTradeItem, RtmsAptRentItem, RtmsOffiTradeItem, RtmsOffiRentItem,
  RtmsMultiTradeItem, RtmsMultiRentItem, RtmsServiceName,
  AptTradeInsert, AptRentInsert, OffiTradeInsert, OffiRentInsert,
  MultiTradeInsert, MultiRentInsert,
} from '@/types/rtms'

export function parsePrice(val: string | undefined): number {
  if (!val) return 0
  const n = parseInt(val.replace(/,/g, ''), 10)
  return isNaN(n) ? 0 : n
}

export function makeDealDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function makeSourceHash(parts: string[]): string {
  return createHash('md5').update(parts.join('|')).digest('hex')
}

export function normalizeAptTrade(
  item: RtmsAptTradeItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): AptTradeInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const price = parsePrice(item.거래금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.아파트 ?? '', area, floor, String(price), item.법정동본번코드 ?? ''])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    apt_dong: null,
    jibun: item.법정동본번코드 ? `${item.법정동본번코드}-${item.법정동부번코드 ?? '0'}` : null,
    bonbun: item.법정동본번코드 ?? null,
    bubun: item.법정동부번코드 ?? null,
    apt_nm: item.아파트 ?? null,
    apt_seq: item.단지코드 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    price,
    deal_date: dealDate,
    road_nm: item.도로명 ?? null,
    dealing_gbn: item.거래유형 ?? null,
    rgst_date: item.등기일자 ?? null,
    buyer_gbn: item.매수자 ?? null,
    seller_gbn: item.매도자 ?? null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeAptRent(
  item: RtmsAptRentItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): AptRentInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const deposit = parsePrice(item.보증금액)
  const monthlyRent = parsePrice(item.월세금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.아파트 ?? '', area, floor, String(deposit), String(monthlyRent)])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    apt_dong: null,
    jibun: null,
    apt_nm: item.아파트 ?? null,
    apt_seq: item.단지코드 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    deposit,
    monthly_rent: monthlyRent,
    deal_date: dealDate,
    contract_type: item.계약구분 ?? null,
    contract_term: item.계약기간 ?? null,
    use_rr_right: item.갱신요구권사용 ?? null,
    prev_deposit: item.종전계약보증금 ? parsePrice(item.종전계약보증금) : null,
    prev_monthly_rent: item.종전계약월세 ? parsePrice(item.종전계약월세) : null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeOffiTrade(
  item: RtmsOffiTradeItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): OffiTradeInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const price = parsePrice(item.거래금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.단지명 ?? '', area, floor, String(price), item.지번 ?? ''])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    offi_nm: item.단지명 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    price,
    deal_date: dealDate,
    dealing_gbn: item.거래유형 ?? null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeOffiRent(
  item: RtmsOffiRentItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): OffiRentInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const deposit = parsePrice(item.보증금)
  const monthlyRent = parsePrice(item.월세)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.단지명 ?? '', area, floor, String(deposit), String(monthlyRent)])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    offi_nm: item.단지명 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    deposit,
    monthly_rent: monthlyRent,
    deal_date: dealDate,
    contract_type: item.계약구분 ?? null,
    contract_term: item.계약기간 ?? null,
    use_rr_right: item.갱신요구권사용 ?? null,
    prev_deposit: item.종전계약보증금 ? parsePrice(item.종전계약보증금) : null,
    prev_monthly_rent: item.종전계약월세 ? parsePrice(item.종전계약월세) : null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeMultiTrade(
  item: RtmsMultiTradeItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): MultiTradeInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const price = parsePrice(item.거래금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.연립다세대 ?? '', area, floor, String(price), item.지번 ?? ''])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    bonbun: null,
    bubun: null,
    house_nm: item.연립다세대 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    price,
    deal_date: dealDate,
    dealing_gbn: item.거래유형 ?? null,
    rgst_date: item.등기일자 ?? null,
    buyer_gbn: item.매수자 ?? null,
    seller_gbn: item.매도자 ?? null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeMultiRent(
  item: RtmsMultiRentItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): MultiRentInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const deposit = parsePrice(item.보증금액)
  const monthlyRent = parsePrice(item.월세금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.연립다세대 ?? '', area, floor, String(deposit), String(monthlyRent)])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    house_nm: item.연립다세대 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    deposit,
    monthly_rent: monthlyRent,
    deal_date: dealDate,
    contract_type: item.계약구분 ?? null,
    contract_term: item.계약기간 ?? null,
    use_rr_right: item.갱신요구권사용 ?? null,
    prev_deposit: item.종전계약보증금 ? parsePrice(item.종전계약보증금) : null,
    prev_monthly_rent: item.종전계약월세 ? parsePrice(item.종전계약월세) : null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/rtms-normalizer.test.ts
```

Expected: PASS — 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/rtms-normalizer.ts src/lib/__tests__/rtms-normalizer.test.ts
git commit -m "feat: add RTMS normalizer with MD5 deduplication"
```

---

### Task 5: 법정동코드 시드 스크립트 (`scripts/seed-regions.mjs`)

**Files:**
- Create: `scripts/seed-regions.mjs`

**배경:** 공공데이터포털에서 법정동코드 전체자료(KIKcd_H.xlsx 또는 CSV)를 다운로드해야 한다. URL: https://www.code.go.kr/stdcodesearch/search.do (법정동코드 조회). CSV 헤더: `법정동코드,법정동명,폐지여부`. 시군구 코드 = 10자리 코드 중 앞 5자리이며 뒤 5자리가 `00000`인 행. 예: `1111000000,서울특별시 종로구,존재`

- [ ] **Step 1: Write seed script**

```javascript
// scripts/seed-regions.mjs
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
  if (isFirstLine) { isFirstLine = false; continue } // skip header
  const parts = line.split(',')
  if (parts.length < 3) continue

  const code = parts[0].trim()
  const fullNm = parts[1].trim()
  const status = parts[2].trim()

  // 존재하는 시군구 코드만 (10자리 중 뒤 5자리 = '00000', 앞 5자리 ≥ 2자리 시도코드)
  if (code.length !== 10) continue
  if (code.slice(5) !== '00000') continue
  if (status !== '존재') continue
  if (code.slice(0, 2) === '00') continue // 제외: 전국코드

  const lawdCd = code.slice(0, 5)
  const nameParts = fullNm.split(' ')
  const sidoNm = nameParts[0] ?? ''
  const sigunguNm = nameParts.slice(1).join(' ') || sidoNm // 특별시/광역시 단독 행 처리

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
```

- [ ] **Step 2: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`**

Supabase 대시보드 → Settings → API → `service_role` 키를 복사해 `.env.local`에 추가:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key
```

- [ ] **Step 3: Download 법정동코드 CSV and run seed**

```bash
# 법정동코드전체자료.csv 를 scripts/ 디렉토리에 저장 후 실행
node -r dotenv/config scripts/seed-regions.mjs scripts/법정동코드전체자료.csv
```

Expected: `Parsed ~250 regions` ... `Done seeding regions`

- [ ] **Step 4: Verify in Supabase dashboard**

```sql
select count(*) from regions;
-- Expected: ~250 rows
select * from regions limit 5;
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-regions.mjs
git commit -m "feat: add regions seed script for 법정동코드"
```

---

### Task 6: 트랜잭션 bulk 시드 스크립트 (`scripts/seed-transactions.mjs`)

**Files:**
- Create: `scripts/seed-transactions.mjs`

이 스크립트는 regions 테이블의 모든 lawd_cd를 읽고, 최근 3개월(202604, 202605, 202606) × 6 서비스 = 최대 250 × 3 × 6 = 4,500 API 요청을 concurrency 10으로 실행한다.

- [ ] **Step 1: Write seed script**

```javascript
// scripts/seed-transactions.mjs
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
  { service: 'getRTMSDataSvcAptTradeDev',      table: 'apt_trades' },
  { service: 'getRTMSDataSvcAptRent',           table: 'apt_rents' },
  { service: 'getRTMSDataSvcOffiTrade',         table: 'offi_trades' },
  { service: 'getRTMSDataSvcOffiRent',          table: 'offi_rents' },
  { service: 'getRTMSDataSvcRHDwelling',        table: 'multi_trades' },
  { service: 'getRTMSDataSvcRHDwellingRent',    table: 'multi_rents' },
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
  const months = getRecentMonths(3)
  console.log(`Syncing months: ${months.join(', ')}`)

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
```

- [ ] **Step 2: Run seed script**

```bash
node -r dotenv/config scripts/seed-transactions.mjs
```

Expected: 진행 로그 출력, `Done. Total rows inserted: N` (수만 건 예상)

- [ ] **Step 3: Verify row counts**

```bash
# Supabase SQL Editor에서 실행
SELECT 'apt_trades' as t, count(*) FROM apt_trades
UNION ALL SELECT 'apt_rents', count(*) FROM apt_rents
UNION ALL SELECT 'offi_trades', count(*) FROM offi_trades
UNION ALL SELECT 'offi_rents', count(*) FROM offi_rents
UNION ALL SELECT 'multi_trades', count(*) FROM multi_trades
UNION ALL SELECT 'multi_rents', count(*) FROM multi_rents;
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-transactions.mjs
git commit -m "feat: add bulk transaction seed script with concurrency 10"
```

---

### Task 7: 월간 크론 API Route (`src/app/api/cron/sync-transactions/route.ts`)

**Files:**
- Create: `src/app/api/cron/sync-transactions/route.ts`
- Create: `src/app/api/cron/__tests__/sync-transactions.test.ts`

이 route는 GitHub Actions/Vercel cron에서 호출된다. 전달월(DEAL_YMD)은 query param `ym`으로 받거나 현재 월 기준 전월을 사용한다.

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/api/cron/__tests__/sync-transactions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cron/sync-transactions/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        data: [{ lawd_cd: '11680' }],
        error: null,
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

vi.mock('@/lib/api/rtms', () => ({
  fetchAllRtmsItems: vi.fn().mockResolvedValue([]),
}))

describe('GET /api/cron/sync-transactions', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns 401 without correct Bearer token', async () => {
    process.env.CRON_SECRET = 'secret'
    const req = new NextRequest('http://localhost/api/cron/sync-transactions')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid Bearer token', async () => {
    process.env.CRON_SECRET = 'secret'
    process.env.CHEONGAHK_API_KEY = 'test-key'
    const req = new NextRequest('http://localhost/api/cron/sync-transactions', {
      headers: { authorization: 'Bearer secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('ym')
    expect(body).toHaveProperty('regions')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/app/api/cron/__tests__/sync-transactions.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/cron/sync-transactions/route'`

- [ ] **Step 3: Write implementation**

```typescript
// src/app/api/cron/sync-transactions/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRtmsItems } from '@/lib/api/rtms'
import {
  normalizeAptTrade, normalizeAptRent, normalizeOffiTrade, normalizeOffiRent,
  normalizeMultiTrade, normalizeMultiRent,
} from '@/lib/rtms-normalizer'
import { RTMS_SERVICES } from '@/types/rtms'
import type { RtmsServiceName } from '@/types/rtms'

export const runtime = 'nodejs'
export const maxDuration = 300

function getPrevYm(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function runWithConcurrency(taskFns: (() => Promise<void>)[], limit: number) {
  const queue = [...taskFns]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const task = queue.shift()
      if (task) await task()
    }
  })
  await Promise.all(workers)
}

const NORMALIZERS: Record<string, (item: unknown, lawdCd: string, ym: string, service: RtmsServiceName) => unknown> = {
  apt_trades: (item, lawdCd, ym, service) => normalizeAptTrade(item as never, lawdCd, ym, service),
  apt_rents:  (item, lawdCd, ym, service) => normalizeAptRent(item as never, lawdCd, ym, service),
  offi_trades: (item, lawdCd, ym, service) => normalizeOffiTrade(item as never, lawdCd, ym, service),
  offi_rents: (item, lawdCd, ym, service) => normalizeOffiRent(item as never, lawdCd, ym, service),
  multi_trades: (item, lawdCd, ym, service) => normalizeMultiTrade(item as never, lawdCd, ym, service),
  multi_rents: (item, lawdCd, ym, service) => normalizeMultiRent(item as never, lawdCd, ym, service),
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const ym = url.searchParams.get('ym') ?? getPrevYm()
  const apiKey = process.env.CHEONGAHK_API_KEY ?? ''

  try {
    const supabase = await createClient()
    const { data: regions, error: regErr } = await supabase.from('regions').select('lawd_cd')
    if (regErr) throw new Error(regErr.message)

    const lawdCds = (regions ?? []).map((r: { lawd_cd: string }) => r.lawd_cd)
    let totalSynced = 0

    const tasks: (() => Promise<void>)[] = []

    for (const { service, table } of RTMS_SERVICES) {
      for (const lawdCd of lawdCds) {
        tasks.push(async () => {
          const items = await fetchAllRtmsItems({ service, lawdCd, dealYmd: ym, apiKey })
          if (items.length === 0) return

          const normalizer = NORMALIZERS[table]
          const rows = items.map(item => normalizer(item, lawdCd, ym, service))

          const { error } = await supabase
            .from(table)
            .upsert(rows, { onConflict: 'source_api,source_hash', ignoreDuplicates: true })
          if (error) throw new Error(`${table}: ${error.message}`)
          totalSynced += rows.length
        })
      }
    }

    await runWithConcurrency(tasks, 10)

    return NextResponse.json({ ym, regions: lawdCds.length, totalSynced })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/app/api/cron/__tests__/sync-transactions.test.ts
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/sync-transactions/route.ts src/app/api/cron/__tests__/sync-transactions.test.ts
git commit -m "feat: add monthly cron route for RTMS transaction sync"
```

---

### Task 8: 실거래가 목록 API Route

**Files:**
- Create: `src/app/api/real-estate/transactions/route.ts`

Query params: `lawd_cd` (필수), `table` (optional: apt_trades|apt_rents|offi_trades|offi_rents|multi_trades|multi_rents, default: apt_trades), `limit` (default: 20, max: 100), `offset` (default: 0)

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/real-estate/transactions/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TABLES = new Set([
  'apt_trades', 'apt_rents', 'offi_trades', 'offi_rents', 'multi_trades', 'multi_rents',
])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lawdCd = searchParams.get('lawd_cd')
  const table = searchParams.get('table') ?? 'apt_trades'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  if (!lawdCd) {
    return NextResponse.json({ error: 'lawd_cd is required' }, { status: 400 })
  }
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'invalid table' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('lawd_cd', lawdCd)
    .order('deal_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count, limit, offset })
}
```

- [ ] **Step 2: Test manually**

```bash
curl "http://localhost:3000/api/real-estate/transactions?lawd_cd=11680&table=apt_trades&limit=5"
```

Expected: JSON with `data` array

- [ ] **Step 3: Commit**

```bash
git add src/app/api/real-estate/transactions/route.ts
git commit -m "feat: add real-estate transactions list API"
```

---

### Task 9: 단지별 통계 API Route

**Files:**
- Create: `src/app/api/real-estate/stats/route.ts`

Query params: `lawd_cd` (필수), `complex_nm` (필수), `table` (default: apt_trades), `months` (default: 12)

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/real-estate/stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TRADE_TABLES = new Set(['apt_trades', 'offi_trades', 'multi_trades'])
const RENT_TABLES = new Set(['apt_rents', 'offi_rents', 'multi_rents'])
const NM_COLS: Record<string, string> = {
  apt_trades: 'apt_nm', apt_rents: 'apt_nm',
  offi_trades: 'offi_nm', offi_rents: 'offi_nm',
  multi_trades: 'house_nm', multi_rents: 'house_nm',
}
const ALLOWED_TABLES = new Set([...TRADE_TABLES, ...RENT_TABLES])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lawdCd = searchParams.get('lawd_cd')
  const complexNm = searchParams.get('complex_nm')
  const table = searchParams.get('table') ?? 'apt_trades'
  const months = Math.min(parseInt(searchParams.get('months') ?? '12', 10), 24)

  if (!lawdCd || !complexNm) {
    return NextResponse.json({ error: 'lawd_cd and complex_nm are required' }, { status: 400 })
  }
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'invalid table' }, { status: 400 })
  }

  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceStr = since.toISOString().slice(0, 10)
  const nmCol = NM_COLS[table]

  const supabase = await createClient()
  const { data, error } = await supabase
    .from(table)
    .select('deal_date, area, price, deposit, monthly_rent, floor')
    .eq('lawd_cd', lawdCd)
    .eq(nmCol, complexNm)
    .gte('deal_date', sinceStr)
    .order('deal_date', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  if (rows.length === 0) return NextResponse.json({ count: 0, stats: null, recent: [] })

  const isRent = RENT_TABLES.has(table)

  const amounts = isRent
    ? rows.map(r => r.deposit as number)
    : rows.map(r => r.price as number)

  const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)

  return NextResponse.json({
    count: rows.length,
    stats: { avg, min, max },
    recent: rows.slice(0, 10),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/real-estate/stats/route.ts
git commit -m "feat: add real-estate stats API for complex summary"
```

---

### Task 10: 단지명 검색 API Route

**Files:**
- Create: `src/app/api/real-estate/search/route.ts`

Query params: `q` (검색어, 필수), `lawd_cd` (optional), `limit` (default: 10)

pg_trgm GIN index를 활용해 건물명 퍼지 검색한다.

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/real-estate/search/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchResult {
  complex_nm: string
  lawd_cd: string
  table_name: string
  count: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const lawdCd = searchParams.get('lawd_cd')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'q must be at least 2 characters' }, { status: 400 })
  }

  const supabase = await createClient()

  const searches = [
    { table: 'apt_trades', col: 'apt_nm' },
    { table: 'offi_trades', col: 'offi_nm' },
    { table: 'multi_trades', col: 'house_nm' },
  ] as const

  const results: SearchResult[] = []

  await Promise.all(
    searches.map(async ({ table, col }) => {
      let query = supabase
        .from(table)
        .select(`${col}, lawd_cd`, { count: 'exact' })
        .ilike(col, `%${q}%`)
        .limit(limit)

      if (lawdCd) query = query.eq('lawd_cd', lawdCd)

      const { data, error } = await query
      if (error || !data) return

      const seen = new Map<string, number>()
      for (const row of data) {
        const nm = (row as Record<string, unknown>)[col] as string | null
        if (!nm) continue
        const key = `${nm}|${(row as Record<string, unknown>).lawd_cd}`
        seen.set(key, (seen.get(key) ?? 0) + 1)
      }

      for (const [key, count] of seen.entries()) {
        const [complex_nm, lcd] = key.split('|')
        results.push({ complex_nm, lawd_cd: lcd, table_name: table, count })
      }
    })
  )

  results.sort((a, b) => b.count - a.count)

  return NextResponse.json({ results: results.slice(0, limit) })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/real-estate/search/route.ts
git commit -m "feat: add real-estate complex name search API"
```

---

### Task 11: GitHub Actions 워크플로우 + vercel.json 업데이트

**Files:**
- Create: `.github/workflows/sync-transactions.yml`
- Modify: `vercel.json`

- [ ] **Step 1: Create GitHub Actions workflow**

```yaml
# .github/workflows/sync-transactions.yml
name: Sync Real Estate Transactions

on:
  schedule:
    # 매월 1일 오전 9시 KST (0시 UTC)
    - cron: '0 0 1 * *'
  workflow_dispatch:
    inputs:
      ym:
        description: '수집 연월 (YYYYMM, 미입력 시 전월)'
        required: false
        default: ''

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Sync transactions via cron API
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          SITE_URL: ${{ secrets.SITE_URL }}
        run: |
          YM="${{ github.event.inputs.ym }}"
          if [ -z "$YM" ]; then
            URL="${SITE_URL}/api/cron/sync-transactions"
          else
            URL="${SITE_URL}/api/cron/sync-transactions?ym=${YM}"
          fi
          echo "Calling: $URL"
          RESPONSE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
            -H "Authorization: Bearer ${CRON_SECRET}" \
            "$URL")
          echo "HTTP status: $RESPONSE"
          cat /tmp/response.json
          if [ "$RESPONSE" != "200" ]; then exit 1; fi
```

- [ ] **Step 2: Add GitHub secrets**

GitHub 레포 → Settings → Secrets and variables → Actions:
- `CRON_SECRET`: `.env.local`의 `CRON_SECRET` 값과 동일
- `SITE_URL`: 배포된 Vercel 도메인 (예: `https://your-domain.vercel.app`)

- [ ] **Step 3: Read current vercel.json and add second cron entry**

현재 `vercel.json` 내용:
```json
{ "crons": [{ "path": "/api/cron/sync", "schedule": "0 18 * * *" }] }
```

수정 후:
```json
{
  "crons": [
    { "path": "/api/cron/sync", "schedule": "0 18 * * *" },
    { "path": "/api/cron/sync-transactions", "schedule": "0 1 1 * *" }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/sync-transactions.yml vercel.json
git commit -m "feat: add GitHub Actions cron and Vercel backup cron for transactions sync"
```

---

### Task 12: NearbyTransactionsWidget + apply/[id] 페이지 통합

**Files:**
- Create: `src/components/real-estate/NearbyTransactionsWidget.tsx`
- Modify: `src/app/apply/[id]/page.tsx`

위젯은 `apartment.district`(시군구명)으로 regions에서 lawd_cd를 조회하고, apt_trades에서 동일 단지명(apt_nm ILIKE `%apartment.name%`) 최근 거래를 표시한다.

- [ ] **Step 1: Create the widget component**

```typescript
// src/components/real-estate/NearbyTransactionsWidget.tsx
import { createClient } from '@/lib/supabase/server'

interface Props {
  apartmentName: string
  district: string | null
}

interface TradeRow {
  deal_date: string
  area: number | null
  floor: number | null
  price: number | null
  apt_nm: string | null
}

async function getLawdCd(district: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('regions')
    .select('lawd_cd')
    .ilike('sigungu_nm', `%${district}%`)
    .limit(1)
    .single()
  return data?.lawd_cd ?? null
}

async function getNearbyTrades(lawdCd: string, aptNm: string): Promise<TradeRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apt_trades')
    .select('deal_date, area, floor, price, apt_nm')
    .eq('lawd_cd', lawdCd)
    .ilike('apt_nm', `%${aptNm}%`)
    .order('deal_date', { ascending: false })
    .limit(10)
  return (data ?? []) as TradeRow[]
}

function formatPrice(price: number | null): string {
  if (!price) return '-'
  if (price >= 10000) return `${(price / 10000).toFixed(1)}억`
  return `${price.toLocaleString()}만`
}

export default async function NearbyTransactionsWidget({ apartmentName, district }: Props) {
  if (!district) return null

  const lawdCd = await getLawdCd(district)
  if (!lawdCd) return null

  const trades = await getNearbyTrades(lawdCd, apartmentName)
  if (trades.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold mb-3">주변 실거래가</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2 font-medium">단지</th>
              <th className="text-right pb-2 font-medium">면적</th>
              <th className="text-right pb-2 font-medium">층</th>
              <th className="text-right pb-2 font-medium">거래가</th>
              <th className="text-right pb-2 font-medium">거래일</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700 max-w-[140px] truncate">{t.apt_nm ?? '-'}</td>
                <td className="py-2 text-right text-gray-600">{t.area ? `${t.area}㎡` : '-'}</td>
                <td className="py-2 text-right text-gray-600">{t.floor ? `${t.floor}층` : '-'}</td>
                <td className="py-2 text-right font-medium text-blue-600">{formatPrice(t.price)}</td>
                <td className="py-2 text-right text-gray-400">{t.deal_date?.slice(0, 7) ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">국토교통부 실거래가 공개시스템 제공</p>
    </div>
  )
}
```

- [ ] **Step 2: Modify `src/app/apply/[id]/page.tsx` to insert the widget**

현재 파일의 `{apartment.lat && apartment.lng && ...}` 블록 이후, `<div className="flex flex-wrap gap-3">` 버튼 그룹 바로 전에 위젯을 삽입:

```typescript
// 파일 상단 imports에 추가:
import NearbyTransactionsWidget from '@/components/real-estate/NearbyTransactionsWidget'
```

```typescript
// KakaoMapEmbed 블록 이후, 버튼 그룹 이전에 삽입:
        <NearbyTransactionsWidget
          apartmentName={apartment.name}
          district={apartment.district}
        />
```

변경 결과 (`src/app/apply/[id]/page.tsx` 의 해당 부분):

```typescript
import NearbyTransactionsWidget from '@/components/real-estate/NearbyTransactionsWidget'

// ... (기존 imports 유지)

        {apartment.lat && apartment.lng && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-2">위치</h2>
            <KakaoMapEmbed lat={apartment.lat} lng={apartment.lng} name={apartment.name} />
          </div>
        )}

        <NearbyTransactionsWidget
          apartmentName={apartment.name}
          district={apartment.district}
        />

        <div className="flex flex-wrap gap-3">
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: Run dev server and verify widget renders**

```bash
npm run dev
```

브라우저에서 청약 단지 상세 페이지(`/apply/[id]`) 접속 → 지도 아래 "주변 실거래가" 테이블이 표시되는지 확인.
거래 데이터가 없는 단지의 경우 위젯이 렌더링되지 않아야 함.

- [ ] **Step 5: Commit**

```bash
git add src/components/real-estate/NearbyTransactionsWidget.tsx src/app/apply/[id]/page.tsx
git commit -m "feat: add NearbyTransactionsWidget to apartment detail page"
```

---

## 전체 테스트 실행

```bash
npx vitest run
```

Expected: 모든 테스트 PASS

---

## 배포 체크리스트

- [ ] Supabase 대시보드에서 migration 002 적용 확인
- [ ] `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] `scripts/seed-regions.mjs` 실행 (법정동코드 CSV 필요)
- [ ] `scripts/seed-transactions.mjs` 실행 (최초 3개월 bulk 수집)
- [ ] GitHub Secrets에 `CRON_SECRET`, `SITE_URL` 추가
- [ ] Vercel 환경 변수에 `CRON_SECRET` 확인
- [ ] GitHub Actions 수동 실행으로 워크플로우 동작 검증
