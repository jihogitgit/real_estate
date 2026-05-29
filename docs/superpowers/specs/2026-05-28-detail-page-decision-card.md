# 아파트 상세 페이지 — 판단 카드 개선 설계

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/apply/[id]` 상세 페이지를 단순 정보 나열에서 "이 단지에 신청할지 말지 결정하는 데 필요한 모든 정보"를 제공하는 판단 카드로 개선

**Architecture:** DB 스키마에 타임라인 날짜 컬럼 추가 → API 정규화 함수 업데이트 → Apartment 타입 업데이트 → 4개 UI 컴포넌트 신규 제작 → 상세 페이지 레이아웃 교체

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase, @base-ui/react

---

## 범위

- 포함: DB 컬럼 추가, API 매핑 업데이트, 상세 페이지 UI 개선
- 제외: 내 가점 메모/연동 (별도 태스크로 분리)
- 제외: 분양가 자동 수집 (API에서 제공 안 됨, `pblanc_url`로 공식 공고 링크 제공)

---

## Phase A: 데이터 레이어

### A-1. Supabase 테이블 컬럼 추가

`apartments` 테이블에 아래 컬럼 추가 (Supabase SQL Editor):

```sql
alter table apartments
  add column if not exists announce_date date,
  add column if not exists special_supply_date date,
  add column if not exists priority1_date date,
  add column if not exists winner_date date,
  add column if not exists contract_start date,
  add column if not exists contract_end date,
  add column if not exists move_in_month text,
  add column if not exists pblanc_url text,
  add column if not exists price_cap boolean default false,
  add column if not exists house_type text;
```

### A-2. API 필드 매핑 (`src/lib/api/cheongahk.ts`)

`CheongahkItem` 인터페이스에 추가:

```typescript
export interface CheongahkItem {
  // 기존 필드...
  PBLANC_NO: string
  HOUSE_NM: string
  RCEPT_BGNDE: string
  RCEPT_ENDDE: string
  SUBSCRPT_AREA_CODE_NM: string
  HSSPLY_ADRES: string
  TOT_SUPLY_HSHLDCO: number
  HOUSE_MANAGE_NO: string
  // 신규 필드
  RCRIT_PBLANC_DE: string        // 모집공고일 (YYYY-MM-DD)
  SPSPLY_RCEPT_BGNDE: string     // 특별공급 시작일
  GNRL_RNK1_CRSPAREA_RCPTDE: string  // 1순위 해당지역 접수일
  PRZWNER_PRESNATN_DE: string    // 당첨자 발표일
  CNTRCT_CNCLS_BGNDE: string     // 계약 시작일
  CNTRCT_CNCLS_ENDDE: string     // 계약 종료일
  MVN_PREARNGE_YM: string        // 입주예정월 (YYYYMM)
  PBLANC_URL: string             // 공식 공고 URL
  PARCPRC_ULS_AT: string         // 분양가상한제 여부 'Y'|'N'
  HOUSE_DTL_SECD_NM: string      // 주택 유형 (민영/국민주택 등)
}
```

`normalizeApartment` 함수에 신규 필드 매핑 추가:

```typescript
export function normalizeApartment(item: CheongahkItem): NormalizedApartment {
  const addrParts = (item.HSSPLY_ADRES ?? '').split(' ')
  return {
    source_id: item.PBLANC_NO,
    name: item.HOUSE_NM,
    region: item.SUBSCRPT_AREA_CODE_NM ?? '',
    district: addrParts[1] ?? null,
    address: item.HSSPLY_ADRES ?? null,
    apply_start: item.RCEPT_BGNDE ?? null,
    apply_end: item.RCEPT_ENDDE ?? null,
    total_units: item.TOT_SUPLY_HSHLDCO ?? 0,
    // 신규
    announce_date: item.RCRIT_PBLANC_DE ?? null,
    special_supply_date: item.SPSPLY_RCEPT_BGNDE ?? null,
    priority1_date: item.GNRL_RNK1_CRSPAREA_RCPTDE ?? null,
    winner_date: item.PRZWNER_PRESNATN_DE ?? null,
    contract_start: item.CNTRCT_CNCLS_BGNDE ?? null,
    contract_end: item.CNTRCT_CNCLS_ENDDE ?? null,
    move_in_month: item.MVN_PREARNGE_YM ?? null,
    pblanc_url: item.PBLANC_URL ?? null,
    price_cap: item.PARCPRC_ULS_AT === 'Y',
    house_type: item.HOUSE_DTL_SECD_NM ?? null,
  }
}
```

### A-3. Apartment 타입 업데이트 (`src/types/index.ts`)

`Apartment` 인터페이스에 신규 필드 추가:

```typescript
export interface Apartment {
  // 기존 필드 유지...
  id: string
  source_id: string
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
  created_at: string
  updated_at: string
  // 신규
  announce_date: string | null
  special_supply_date: string | null
  priority1_date: string | null
  winner_date: string | null
  contract_start: string | null
  contract_end: string | null
  move_in_month: string | null      // 'YYYYMM' 형식
  pblanc_url: string | null
  price_cap: boolean | null
  house_type: string | null
}
```

`NormalizedApartment` = `Omit<Apartment, 'id' | 'lat' | 'lng' | 'supply_date' | 'min_price' | 'max_price' | 'created_at' | 'updated_at'>` — 기존 Omit 그대로 유지하면 신규 필드가 자동 포함됨.

---

## Phase B: UI 컴포넌트

### B-1. DdayBanner (Client Component)

**파일:** `src/components/apartment/DdayBanner.tsx`

```typescript
'use client'
interface Props {
  applyEnd: string | null
  priority1Date: string | null
  winnerDate: string | null
  contractStart: string | null
  moveInMonth: string | null
}
```

동작:
- `useEffect` + `useState`로 오늘 날짜 클라이언트에서 계산
- 1순위 접수일 기준 D-day 계산 (없으면 apply_end 기준)
- D-day가 0이하(마감)면 회색 배너, 양수면 파란 배너
- 우측에 당첨발표 D-day, 계약 D-day, 입주예정월 표시

UI:
```
┌─────────────────────────────────────────────────┐
│  D-3              │ 당첨발표까지 D-15            │
│  1순위 접수 마감까지 │ 계약까지 D-29              │
│                   │ 입주 예정 2029.03            │
└─────────────────────────────────────────────────┘
```

### B-2. SubscriptionTimeline (Client Component)

**파일:** `src/components/apartment/SubscriptionTimeline.tsx`

`'use client'` — "오늘 기준 done/today/future 상태"를 클라이언트에서 계산해야 정확합니다.

```typescript
interface Props {
  announceDate: string | null
  specialSupplyDate: string | null
  priority1Date: string | null
  applyEnd: string | null
  winnerDate: string | null
  contractStart: string | null
  contractEnd: string | null
}
```

동작:
- 5~7단계 세로 타임라인 렌더링
- 오늘 날짜와 비교해 각 단계를 `done` / `today` / `future` 상태로 구분
- `today` 단계에 빨간 점 + "진행중" 텍스트
- 일부 날짜가 null이면 해당 단계 생략

단계 순서:
1. 모집공고 (`announce_date`)
2. 특별공급 (`special_supply_date`)
3. 1순위 접수 (`priority1_date` ~ `apply_end`)
4. 당첨자 발표 (`winner_date`)
5. 계약 (`contract_start` ~ `contract_end`)

### B-3. ApartmentChecklist (Server Component)

**파일:** `src/components/apartment/ApartmentChecklist.tsx`

```typescript
interface Props {
  priceCap: boolean | null
  applyEnd: string | null
  houseType: string | null
}
```

동작:
- 항상 표시하는 공통 항목 + 조건부 항목으로 구성
- `price_cap === true` → "분양가상한제 적용 — 실거주의무 확인 필요" 항목 추가
- 노란 배경 박스, 체크박스 아이콘 (체크 기능 없음 — 시각적 안내용)

공통 항목:
- 청약통장 1순위 조건 충족 여부
- 무주택 세대주 여부 확인
- 계약금 준비 (분양가의 10~20%)
- 중도금 대출 가능 여부 확인

조건부 항목:
- `price_cap === true`: 분양가상한제 적용 — 실거주의무·전매제한 최장 10년 확인
- `price_cap === false || null`: 전매제한 기간 공고문에서 확인

### B-4. IcsDownloadButton (Client Component)

**파일:** `src/components/apartment/IcsDownloadButton.tsx`

```typescript
'use client'
interface Props {
  name: string
  priority1Date: string | null
  applyEnd: string | null
  winnerDate: string | null
  contractStart: string | null
  pblancUrl: string | null
}
```

동작:
- 버튼 클릭 시 `.ics` 파일 생성 후 브라우저 다운로드
- iCalendar 형식으로 이벤트 생성 (1순위 접수일, 당첨발표일, 계약일)
- 각 이벤트에 단지명 + 청약홈 URL 포함
- Blob URL 방식으로 파일 다운로드

---

## Phase C: 상세 페이지 교체

**파일:** `src/app/apply/[id]/page.tsx`

### 변경 사항

1. Supabase 쿼리에 신규 컬럼 추가:
```typescript
.select('id, name, region, district, address, lat, lng, apply_start, apply_end, total_units, min_price, max_price, announce_date, special_supply_date, priority1_date, winner_date, contract_start, contract_end, move_in_month, pblanc_url, price_cap, house_type, source_id')
```

2. 레이아웃 순서:
```
<h1> + <Badge> + 주소
<DdayBanner>
<SubscriptionTimeline>
핵심 지표 그리드 (세대수 / 주택유형 / 분양가상한제 / 분양가)
<ApartmentChecklist>
<KakaoMapEmbed> (기존 유지)
액션 버튼 행:
  - 공식 공고 바로가기 (pblanc_url 있으면 해당 URL, 없으면 applyhome.co.kr)
  - <IcsDownloadButton>
  - 지역 분양 더보기
  - <AlertButton>
  - <SaveButton>
```

3. `apply.lh.or.kr` → `pblanc_url ?? 'https://www.applyhome.co.kr'` 로 교체

---

## 데이터 초기화

컴포넌트 구현 완료 후:
1. Supabase SQL로 컬럼 추가
2. cron API 재호출 (`/api/cron/sync`) → 신규 필드 자동 채워짐

---

## 면책 처리

`ApartmentChecklist` 하단에 면책 문구 포함:
```
본 체크리스트는 참고용입니다. 실제 자격 확인은 청약홈 공고문을 기준으로 하세요.
```
