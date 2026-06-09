# 부동산 실거래가 데이터 수집 및 시세 조회 설계

**날짜:** 2026-06-09  
**상태:** 확정  
**범위:** Supabase 테이블 설계 + 초기 bulk 적재 + 월별 cron + 시세 조회 API

---

## 1. 목표

현재 청약(청약홈) 데이터만 있는 시스템에 **아파트·오피스텔·다세대/연립의 매매·전세·월세 실거래가 데이터**를 추가한다.

- 메인: 지역/단지 기반 시세 조회 페이지
- 부가: 청약 단지 페이지에서 주변 실거래가 연계 위젯

---

## 2. 데이터 소스

- **API:** 국토교통부 실거래가 공개시스템 (공공데이터포털)
- **인증:** 기존 `CHEONGAHK_API_KEY` 동일 키 재사용
- **범위:** 전국 전체 (시군구 약 250개)
- **초기 적재:** 최근 3개월 (202604, 202605, 202606)
- **이후:** 매월 1일 자동 동기화 (전월 데이터)

---

## 3. DB 스키마

### 3-1. `regions` (법정동코드 · 시군구 단위)

```sql
create table regions (
  lawd_cd    char(5) primary key,   -- 시군구코드 (LAWD_CD)
  sido_nm    text not null,
  sigungu_nm text not null,
  full_nm    text not null
);
```

### 3-2. 거래 테이블 6개

공통 설계 원칙:
- `area numeric(10,3)` — 소수 3자리 보장 (API 응답 예: 17.811)
- 건물명 nullable — API에서 빈 문자열로 올 수 있음
- `deal_date date not null` — 년/월/일 합산 구성
- `request_ym char(6) check ('^[0-9]{6}$')` — 조회 기준 월
- `source_api + source_hash` unique — 중복 방지
- `raw_item jsonb` — API 원문 보존 (필드 추가/복구 대비)
- `updated_at` trigger — `update_updated_at()` 재사용

#### apt_trades (아파트 매매)
```sql
create table apt_trades (
  id           bigserial primary key,
  lawd_cd      char(5) not null references regions(lawd_cd),
  request_ym   char(6) not null check (request_ym ~ '^[0-9]{6}$'),
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
  price        integer not null check (price >= 0),
  deal_date    date not null,
  road_nm      text,
  dealing_gbn  text,
  rgst_date    text,
  buyer_gbn    text,
  seller_gbn   text,
  source_api   text not null,
  source_hash  text not null,
  raw_item     jsonb,
  fetched_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create unique index ux_apt_trades_source      on apt_trades (source_api, source_hash);
create index idx_apt_trades_region_date       on apt_trades (lawd_cd, deal_date desc);
create index idx_apt_trades_complex_date      on apt_trades (lawd_cd, apt_nm, deal_date desc);
create index idx_apt_trades_area_date         on apt_trades (lawd_cd, apt_nm, area, deal_date desc);
create index idx_apt_trades_name_trgm         on apt_trades using gin (apt_nm gin_trgm_ops);
create trigger apt_trades_updated_at
  before update on apt_trades
  for each row execute function update_updated_at();
```

#### apt_rents (아파트 전월세)
```sql
create table apt_rents (
  id                 bigserial primary key,
  lawd_cd            char(5) not null references regions(lawd_cd),
  request_ym         char(6) not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm             text,
  apt_dong           text,
  apt_nm             text,
  build_year         integer,
  area               numeric(10,3),
  floor              integer,
  deposit            integer not null check (deposit >= 0),
  monthly_rent       integer not null default 0 check (monthly_rent >= 0),
  deal_date          date not null,
  contract_type      text,
  contract_term      text,
  use_rr_right       text,
  prev_deposit       integer,
  prev_monthly_rent  integer,
  source_api         text not null,
  source_hash        text not null,
  raw_item           jsonb,
  fetched_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create unique index ux_apt_rents_source     on apt_rents (source_api, source_hash);
create index idx_apt_rents_region_date      on apt_rents (lawd_cd, deal_date desc);
create index idx_apt_rents_complex_date     on apt_rents (lawd_cd, apt_nm, deal_date desc);
create index idx_apt_rents_name_trgm        on apt_rents using gin (apt_nm gin_trgm_ops);
create trigger apt_rents_updated_at
  before update on apt_rents
  for each row execute function update_updated_at();
```

#### offi_trades (오피스텔 매매)
```sql
create table offi_trades (
  id           bigserial primary key,
  lawd_cd      char(5) not null references regions(lawd_cd),
  request_ym   char(6) not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  jibun        text,
  offi_nm      text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer not null check (price >= 0),
  deal_date    date not null,
  source_api   text not null,
  source_hash  text not null,
  raw_item     jsonb,
  fetched_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create unique index ux_offi_trades_source       on offi_trades (source_api, source_hash);
create index idx_offi_trades_region_date        on offi_trades (lawd_cd, deal_date desc);
create index idx_offi_trades_complex_area_date  on offi_trades (lawd_cd, offi_nm, area, deal_date desc);
create index idx_offi_trades_name_trgm          on offi_trades using gin (offi_nm gin_trgm_ops);
create trigger offi_trades_updated_at
  before update on offi_trades
  for each row execute function update_updated_at();
```

#### offi_rents (오피스텔 전월세)
```sql
create table offi_rents (
  id                 bigserial primary key,
  lawd_cd            char(5) not null references regions(lawd_cd),
  request_ym         char(6) not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm             text,
  offi_nm            text,
  build_year         integer,
  area               numeric(10,3),
  floor              integer,
  deposit            integer not null check (deposit >= 0),
  monthly_rent       integer not null default 0 check (monthly_rent >= 0),
  deal_date          date not null,
  contract_type      text,
  contract_term      text,
  use_rr_right       text,
  prev_deposit       integer,
  prev_monthly_rent  integer,
  source_api         text not null,
  source_hash        text not null,
  raw_item           jsonb,
  fetched_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create unique index ux_offi_rents_source       on offi_rents (source_api, source_hash);
create index idx_offi_rents_region_date        on offi_rents (lawd_cd, deal_date desc);
create index idx_offi_rents_complex_area_date  on offi_rents (lawd_cd, offi_nm, area, deal_date desc);
create index idx_offi_rents_name_trgm          on offi_rents using gin (offi_nm gin_trgm_ops);
create trigger offi_rents_updated_at
  before update on offi_rents
  for each row execute function update_updated_at();
```

#### multi_trades (다세대/연립 매매)
```sql
create table multi_trades (
  id           bigserial primary key,
  lawd_cd      char(5) not null references regions(lawd_cd),
  request_ym   char(6) not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm       text,
  jibun        text,
  house_nm     text,
  build_year   integer,
  area         numeric(10,3),
  floor        integer,
  price        integer not null check (price >= 0),
  deal_date    date not null,
  source_api   text not null,
  source_hash  text not null,
  raw_item     jsonb,
  fetched_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create unique index ux_multi_trades_source       on multi_trades (source_api, source_hash);
create index idx_multi_trades_region_date        on multi_trades (lawd_cd, deal_date desc);
create index idx_multi_trades_complex_area_date  on multi_trades (lawd_cd, house_nm, area, deal_date desc);
create index idx_multi_trades_name_trgm          on multi_trades using gin (house_nm gin_trgm_ops);
create trigger multi_trades_updated_at
  before update on multi_trades
  for each row execute function update_updated_at();
```

#### multi_rents (다세대/연립 전월세)
```sql
create table multi_rents (
  id                 bigserial primary key,
  lawd_cd            char(5) not null references regions(lawd_cd),
  request_ym         char(6) not null check (request_ym ~ '^[0-9]{6}$'),
  umd_nm             text,
  house_nm           text,
  build_year         integer,
  area               numeric(10,3),
  floor              integer,
  deposit            integer not null check (deposit >= 0),
  monthly_rent       integer not null default 0 check (monthly_rent >= 0),
  deal_date          date not null,
  contract_type      text,
  contract_term      text,
  use_rr_right       text,
  prev_deposit       integer,
  prev_monthly_rent  integer,
  source_api         text not null,
  source_hash        text not null,
  raw_item           jsonb,
  fetched_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create unique index ux_multi_rents_source       on multi_rents (source_api, source_hash);
create index idx_multi_rents_region_date        on multi_rents (lawd_cd, deal_date desc);
create index idx_multi_rents_complex_area_date  on multi_rents (lawd_cd, house_nm, area, deal_date desc);
create index idx_multi_rents_name_trgm          on multi_rents using gin (house_nm gin_trgm_ops);
create trigger multi_rents_updated_at
  before update on multi_rents
  for each row execute function update_updated_at();
```

### 3-3. 통합 View

```sql
create view real_estate_transactions as
  select 'apt'  as property_type, 'trade' as tx_type,
         lawd_cd, deal_date, apt_nm  as building_nm, area, floor,
         price, null::integer as deposit, null::integer as monthly_rent
  from apt_trades
  union all
  select 'apt', 'rent', lawd_cd, deal_date, apt_nm,  area, floor,
         null, deposit, monthly_rent from apt_rents
  union all
  select 'offi', 'trade', lawd_cd, deal_date, offi_nm, area, floor,
         price, null, null from offi_trades
  union all
  select 'offi', 'rent', lawd_cd, deal_date, offi_nm, area, floor,
         null, deposit, monthly_rent from offi_rents
  union all
  select 'multi', 'trade', lawd_cd, deal_date, house_nm, area, floor,
         price, null, null from multi_trades
  union all
  select 'multi', 'rent', lawd_cd, deal_date, house_nm, area, floor,
         null, deposit, monthly_rent from multi_rents;
```

---

## 4. 데이터 수집 전략

### 4-1. 법정동코드 초기 적재

- 소스: 행정안전부 법정동코드 전체자료 CSV
- 시군구 단위 (lawd_cd = 법정동코드 앞 5자리) 만 추출
- `scripts/seed-regions.mjs` — 1회성 실행

### 4-2. 실거래가 초기 bulk 적재

- 대상: 최근 3개월 (202604, 202605, 202606)
- 루프: `regions` 전체 lawd_cd × 3개월 × 6 API = 약 4,500 requests
- 병렬도: concurrency 10
- 실패 시 최대 3회 retry + exponential backoff
- upsert: `on conflict (source_api, source_hash) do nothing`
- `scripts/seed-transactions.mjs` — 1회성 실행

### 4-3. 국토부 RTMS API 6종

| 테이블 | 서비스명 |
|--------|---------|
| apt_trades   | getRTMSDataSvcAptTradeDev |
| apt_rents    | getRTMSDataSvcAptRent     |
| offi_trades  | getRTMSDataSvcOffiTrade   |
| offi_rents   | getRTMSDataSvcOffiRent    |
| multi_trades | getRTMSDataSvcRHDwelling  |
| multi_rents  | getRTMSDataSvcRHDwellingRent |

공통 파라미터: `LAWD_CD` + `DEAL_YMD` + `serviceKey`  
Base URL: `https://apis.data.go.kr/1613000/RTMSDataSvc...`

### 4-4. source_hash 계산

```ts
crypto.createHash('md5')
  .update([lawd_cd, deal_date, building_nm ?? '', area ?? '', floor ?? '', price_or_deposit, jibun ?? ''].join('|'))
  .digest('hex')
```

---

## 5. 월별 자동 동기화

### 5-1. Next.js API Route

```
src/app/api/cron/sync-transactions/route.ts
```

- 매월 1일 실행, 전월(`YYYYMM`) 데이터 수집
- `CRON_SECRET` Bearer 인증 (기존 패턴 동일)
- 전국 시군구 × 1개월 × 6 API = 약 1,500 requests

### 5-2. vercel.json

```json
{ "path": "/api/cron/sync-transactions", "schedule": "0 2 1 * *" }
```

### 5-3. GitHub Actions (주 트리거)

```yaml
# .github/workflows/sync-transactions.yml
name: sync-transactions
on:
  schedule:
    - cron: '0 2 1 * *'   # 매월 1일 02:00 UTC
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync-transactions
        run: |
          curl -f -X GET "${{ secrets.SITE_URL }}/api/cron/sync-transactions" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

GitHub Secrets 필요: `SITE_URL`, `CRON_SECRET`  
vercel.json cron은 백업으로 유지.

---

## 6. 시세 조회 API

### 6-1. `GET /api/real-estate/transactions`

실거래 목록 조회 (페이지네이션)

| 파라미터 | 타입 | 비고 |
|----------|------|------|
| `lawd_cd` | string | 필수, 시군구코드 5자리 |
| `property_type` | apt\|offi\|multi | 기본: apt |
| `tx_type` | trade\|rent | 기본: trade |
| `from` | YYYYMM | 시작 월 |
| `to` | YYYYMM | 종료 월 |
| `building_nm` | string | 단지명 부분검색 (trigram) |
| `area_min` / `area_max` | number | 전용면적 범위 |
| `page` / `limit` | number | 페이지네이션 |

`real_estate_transactions` view 단일 쿼리.

### 6-2. `GET /api/real-estate/stats`

월별 평균·최고·최저가 집계 (차트 데이터)

| 파라미터 | 비고 |
|----------|------|
| `lawd_cd` | 필수 |
| `property_type` | apt\|offi\|multi |
| `tx_type` | trade\|rent |
| `building_nm` | 단지별 시세 (optional) |
| `area` | ±5㎡ 범위 그룹핑 |
| `from` / `to` | 기간 |

응답: `{ month: string, avg_price: number, max_price: number, min_price: number, count: number }[]`

### 6-3. `GET /api/real-estate/search`

단지명 자동완성 (trigram, 상위 10개)

| 파라미터 | 비고 |
|----------|------|
| `q` | 검색어 |
| `lawd_cd` | 지역 필터 (optional) |
| `property_type` | apt\|offi\|multi |

---

## 7. 청약 연계

기존 `/apply/[id]` 페이지에서 아파트명(`apt_nm`) + `lawd_cd` 기반으로  
`/api/real-estate/stats` 호출 → "주변 실거래가" 위젯 표시.

---

## 8. 파일 구조

```
scripts/
  seed-regions.mjs              법정동코드 초기 적재
  seed-transactions.mjs         실거래가 bulk 초기 적재

supabase/migrations/
  002_real_estate_transactions.sql   regions + 6개 테이블 + view

src/
  lib/
    api/
      rtms.ts                   국토부 RTMS API 클라이언트 (6종)
    rtms-normalizer.ts          응답 → DB row 변환 + source_hash 계산
  app/
    api/
      cron/
        sync-transactions/
          route.ts              월별 자동 동기화
      real-estate/
        transactions/
          route.ts
        stats/
          route.ts
        search/
          route.ts

.github/
  workflows/
    sync-transactions.yml
```

---

## 9. 환경 변수 추가

```env
# 기존 키 재사용 (추가 발급 불필요)
# CHEONGAHK_API_KEY → RTMS API도 동일 키 사용

# GitHub Actions Secrets
SITE_URL=https://your-domain.vercel.app
CRON_SECRET=...  (기존 값 그대로)
```
