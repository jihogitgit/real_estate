# 아파트 상세 페이지 판단 카드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/apply/[id]` 상세 페이지를 D-day 배너·타임라인·체크리스트가 포함된 판단 카드로 개선한다.

**Architecture:** Supabase `apartments` 테이블에 10개 컬럼 추가 → TypeScript 타입 및 API 정규화 함수 업데이트 → 4개 UI 컴포넌트 신규 제작 → 상세 페이지 레이아웃 교체 → cron 재호출로 신규 데이터 채우기

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase, Vitest + @testing-library/react

---

## 파일 맵

| 파일 | 작업 |
|------|------|
| `src/types/index.ts` | Apartment, CheongahkItem 인터페이스 신규 필드 추가 |
| `src/lib/api/cheongahk.ts` | normalizeApartment 신규 필드 매핑 추가 |
| `src/components/apartment/DdayBanner.tsx` | 신규 — D-day 배너 (Client Component) |
| `src/components/apartment/SubscriptionTimeline.tsx` | 신규 — 세로 타임라인 (Client Component) |
| `src/components/apartment/ApartmentChecklist.tsx` | 신규 — 확인 체크리스트 (Server Component) |
| `src/components/apartment/IcsDownloadButton.tsx` | 신규 — .ics 다운로드 버튼 (Client Component) |
| `src/app/apply/[id]/page.tsx` | 레이아웃 교체 |
| `src/components/apartment/__tests__/ApartmentCard.test.tsx` | mockApartment에 신규 필드(null) 추가 |
| `src/components/apartment/__tests__/DdayBanner.test.tsx` | 신규 테스트 |
| `src/components/apartment/__tests__/SubscriptionTimeline.test.tsx` | 신규 테스트 |
| `src/components/apartment/__tests__/ApartmentChecklist.test.tsx` | 신규 테스트 |
| `src/components/apartment/__tests__/IcsDownloadButton.test.tsx` | 신규 테스트 |

---

### Task 1: Supabase 컬럼 추가

**Files:** Supabase SQL Editor (수동 실행)

- [ ] **Step 1: Supabase SQL Editor에서 실행**

`https://idufruywbvlynmznpoib.supabase.co` → SQL Editor → New query:

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

- [ ] **Step 2: 컬럼 추가 확인**

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'apartments'
  and column_name in ('announce_date','priority1_date','winner_date','pblanc_url','price_cap');
```

Expected: 5개 행 반환.

---

### Task 2: TypeScript 타입 업데이트

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/apartment/__tests__/ApartmentCard.test.tsx`

- [ ] **Step 1: `src/types/index.ts` — Apartment 인터페이스 교체**

파일에서 `export interface Apartment {` 블록 전체를 아래로 교체:

```typescript
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
  announce_date: string | null
  special_supply_date: string | null
  priority1_date: string | null
  winner_date: string | null
  contract_start: string | null
  contract_end: string | null
  move_in_month: string | null
  pblanc_url: string | null
  price_cap: boolean | null
  house_type: string | null
}
```

- [ ] **Step 2: `src/types/index.ts` — CheongahkItem 인터페이스 교체**

`export interface CheongahkItem {` 블록 전체를 아래로 교체:

```typescript
export interface CheongahkItem {
  PBLANC_NO: string
  HOUSE_NM: string
  RCEPT_BGNDE: string
  RCEPT_ENDDE: string
  SUBSCRPT_AREA_CODE_NM: string
  HSSPLY_ADRES: string
  TOT_SUPLY_HSHLDCO: number
  HOUSE_MANAGE_NO: string
  RCRIT_PBLANC_DE: string
  SPSPLY_RCEPT_BGNDE: string
  GNRL_RNK1_CRSPAREA_RCPTDE: string
  PRZWNER_PRESNATN_DE: string
  CNTRCT_CNCLS_BGNDE: string
  CNTRCT_CNCLS_ENDDE: string
  MVN_PREARNGE_YM: string
  PBLANC_URL: string
  PARCPRC_ULS_AT: string
  HOUSE_DTL_SECD_NM: string
}
```

- [ ] **Step 3: 기존 테스트 mock 업데이트**

`src/components/apartment/__tests__/ApartmentCard.test.tsx`의 `mockApartment` 객체를 아래로 교체:

```typescript
const mockApartment: Apartment = {
  id: 'uuid-1',
  name: '테스트 아파트',
  region: '서울',
  district: '강남구',
  address: '서울 강남구 테스트로 1',
  lat: 37.5,
  lng: 127.0,
  supply_date: null,
  apply_start: '2025-06-01',
  apply_end: '2025-06-05',
  total_units: 100,
  min_price: 50000,
  max_price: 80000,
  source_id: 'SRC001',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  announce_date: null,
  special_supply_date: null,
  priority1_date: null,
  winner_date: null,
  contract_start: null,
  contract_end: null,
  move_in_month: null,
  pblanc_url: null,
  price_cap: null,
  house_type: null,
}
```

- [ ] **Step 4: 기존 테스트 통과 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/ApartmentCard.test.tsx
```

Expected: 4 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/types/index.ts src/components/apartment/__tests__/ApartmentCard.test.tsx
git commit -m "feat: add new fields to Apartment and CheongahkItem types"
```

---

### Task 3: API 정규화 함수 업데이트

**Files:**
- Modify: `src/lib/api/cheongahk.ts`

- [ ] **Step 1: `src/lib/api/cheongahk.ts` 전체 교체**

```typescript
import type { CheongahkItem, NormalizedApartment } from '@/types'

const BASE_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1'

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

export async function fetchApartmentList(params: {
  pageNo?: number
  numOfRows?: number
} = {}): Promise<CheongahkItem[]> {
  const { pageNo = 1, numOfRows = 100 } = params
  const apiKey = process.env.CHEONGAHK_API_KEY

  const url = new URL(`${BASE_URL}/getAPTLttotPblancDetail`)
  url.searchParams.set('serviceKey', apiKey ?? '')
  url.searchParams.set('page', String(pageNo))
  url.searchParams.set('perPage', String(numOfRows))

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`청약홈 API error: ${res.status}`)

  const data = await res.json()
  return data?.data ?? []
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/api/cheongahk.ts
git commit -m "feat: map new API fields in normalizeApartment"
```

---

### Task 4: DdayBanner 컴포넌트

**Files:**
- Create: `src/components/apartment/__tests__/DdayBanner.test.tsx`
- Create: `src/components/apartment/DdayBanner.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`src/components/apartment/__tests__/DdayBanner.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DdayBanner from '../DdayBanner'

describe('DdayBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-28T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('1순위 기준 D-3을 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-31"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('D-3')).toBeInTheDocument())
    expect(screen.getByText('1순위 접수 마감까지')).toBeInTheDocument()
  })

  it('priority1Date 없으면 applyEnd 기준으로 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date={null}
        applyEnd="2025-05-31"
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('D-3')).toBeInTheDocument())
    expect(screen.getByText('청약 마감까지')).toBeInTheDocument()
  })

  it('날짜가 지났으면 마감을 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-27"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('마감')).toBeInTheDocument())
  })

  it('winnerDate, contractStart, moveInMonth를 우측에 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-31"
        applyEnd={null}
        winnerDate="2025-06-10"
        contractStart="2025-06-20"
        moveInMonth="202903"
      />
    )
    await waitFor(() => expect(screen.getByText(/당첨발표까지/)).toBeInTheDocument())
    expect(screen.getByText(/계약까지/)).toBeInTheDocument()
    expect(screen.getByText(/2029\.03/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/DdayBanner.test.tsx
```

Expected: FAIL — 모듈 없음.

- [ ] **Step 3: `DdayBanner.tsx` 구현**

`src/components/apartment/DdayBanner.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'

interface Props {
  applyEnd: string | null
  priority1Date: string | null
  winnerDate: string | null
  contractStart: string | null
  moveInMonth: string | null
}

function daysUntil(dateStr: string | null, today: Date): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const base = new Date(today)
  base.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
}

function formatMoveIn(ym: string | null): string | null {
  if (!ym || ym.length < 6) return null
  return `${ym.slice(0, 4)}.${ym.slice(4, 6)}`
}

export default function DdayBanner({ applyEnd, priority1Date, winnerDate, contractStart, moveInMonth }: Props) {
  const [today, setToday] = useState<Date | null>(null)

  useEffect(() => {
    setToday(new Date())
  }, [])

  if (!today) return null

  const mainRef = priority1Date ?? applyEnd
  const mainDays = daysUntil(mainRef, today)
  const winnerDays = daysUntil(winnerDate, today)
  const contractDays = daysUntil(contractStart, today)
  const moveIn = formatMoveIn(moveInMonth)
  const isExpired = mainDays !== null && mainDays <= 0

  return (
    <div className={`rounded-lg p-4 mb-6 flex gap-6 ${isExpired ? 'bg-gray-100' : 'bg-blue-50'}`}>
      <div className="flex-1">
        <p className={`text-3xl font-bold ${isExpired ? 'text-gray-400' : 'text-blue-600'}`}>
          {mainDays === null ? '-' : mainDays <= 0 ? '마감' : `D-${mainDays}`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {priority1Date ? '1순위 접수 마감까지' : '청약 마감까지'}
        </p>
      </div>
      <div className="text-right text-sm space-y-1 self-center">
        {winnerDays !== null && (
          <p className="text-gray-600">당첨발표까지 {winnerDays > 0 ? `D-${winnerDays}` : '완료'}</p>
        )}
        {contractDays !== null && (
          <p className="text-gray-600">계약까지 {contractDays > 0 ? `D-${contractDays}` : '완료'}</p>
        )}
        {moveIn && <p className="text-gray-600">입주 예정 {moveIn}</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/DdayBanner.test.tsx
```

Expected: 4 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/components/apartment/DdayBanner.tsx src/components/apartment/__tests__/DdayBanner.test.tsx
git commit -m "feat: add DdayBanner component"
```

---

### Task 5: SubscriptionTimeline 컴포넌트

**Files:**
- Create: `src/components/apartment/__tests__/SubscriptionTimeline.test.tsx`
- Create: `src/components/apartment/SubscriptionTimeline.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`src/components/apartment/__tests__/SubscriptionTimeline.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import SubscriptionTimeline from '../SubscriptionTimeline'

describe('SubscriptionTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-28T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('모든 단계를 표시한다', async () => {
    render(
      <SubscriptionTimeline
        announceDate="2025-05-01"
        specialSupplyDate="2025-05-20"
        priority1Date="2025-05-31"
        applyEnd="2025-06-01"
        winnerDate="2025-06-10"
        contractStart="2025-06-20"
        contractEnd="2025-06-25"
      />
    )
    await waitFor(() => expect(screen.getByText('모집공고')).toBeInTheDocument())
    expect(screen.getByText('특별공급')).toBeInTheDocument()
    expect(screen.getByText('1순위 접수')).toBeInTheDocument()
    expect(screen.getByText('당첨자 발표')).toBeInTheDocument()
    expect(screen.getByText('계약')).toBeInTheDocument()
  })

  it('null인 단계는 생략한다', async () => {
    render(
      <SubscriptionTimeline
        announceDate="2025-05-01"
        specialSupplyDate={null}
        priority1Date={null}
        applyEnd="2025-06-01"
        winnerDate={null}
        contractStart={null}
        contractEnd={null}
      />
    )
    await waitFor(() => expect(screen.getByText('모집공고')).toBeInTheDocument())
    expect(screen.queryByText('특별공급')).not.toBeInTheDocument()
    expect(screen.queryByText('당첨자 발표')).not.toBeInTheDocument()
  })

  it('오늘 진행 중인 단계에 진행중 텍스트를 표시한다', async () => {
    render(
      <SubscriptionTimeline
        announceDate="2025-05-01"
        specialSupplyDate={null}
        priority1Date="2025-05-28"
        applyEnd="2025-05-29"
        winnerDate={null}
        contractStart={null}
        contractEnd={null}
      />
    )
    await waitFor(() => expect(screen.getByText('(진행중)')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/SubscriptionTimeline.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: `SubscriptionTimeline.tsx` 구현**

`src/components/apartment/SubscriptionTimeline.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'

interface Props {
  announceDate: string | null
  specialSupplyDate: string | null
  priority1Date: string | null
  applyEnd: string | null
  winnerDate: string | null
  contractStart: string | null
  contractEnd: string | null
}

type StepStatus = 'done' | 'today' | 'future'

interface Step {
  label: string
  date: string
  dateEnd: string | null
  status: StepStatus
}

function buildSteps(props: Props, now: Date): Step[] {
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)

  const raw: Array<{ label: string; date: string | null; dateEnd?: string | null }> = [
    { label: '모집공고', date: props.announceDate },
    { label: '특별공급', date: props.specialSupplyDate },
    { label: '1순위 접수', date: props.priority1Date ?? props.applyEnd, dateEnd: props.applyEnd },
    { label: '당첨자 발표', date: props.winnerDate },
    { label: '계약', date: props.contractStart, dateEnd: props.contractEnd },
  ]

  return raw
    .filter(s => s.date !== null)
    .map(s => {
      const d = new Date(s.date!)
      d.setHours(0, 0, 0, 0)
      const diff = d.getTime() - base.getTime()
      const status: StepStatus = diff < 0 ? 'done' : diff === 0 ? 'today' : 'future'
      return { label: s.label, date: s.date!, dateEnd: s.dateEnd ?? null, status }
    })
}

export default function SubscriptionTimeline(props: Props) {
  const [steps, setSteps] = useState<Step[] | null>(null)

  useEffect(() => {
    setSteps(buildSteps(props, new Date()))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!steps) return null

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold mb-3">청약 일정</h2>
      <ol className="space-y-3 ml-1">
        {steps.map((step, i) => (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`h-3 w-3 rounded-full shrink-0 mt-0.5 ${
                step.status === 'done' ? 'bg-gray-300' :
                step.status === 'today' ? 'bg-red-500' : 'bg-blue-300'
              }`} />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 mt-1 min-h-3" />
              )}
            </div>
            <div className="pb-1 -mt-0.5">
              <p className={`text-sm font-medium ${
                step.status === 'today' ? 'text-red-600' :
                step.status === 'done' ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {step.label}
                {step.status === 'today' && (
                  <span className="text-xs ml-1">(진행중)</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {step.date}
                {step.dateEnd && step.dateEnd !== step.date ? ` ~ ${step.dateEnd}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/SubscriptionTimeline.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/components/apartment/SubscriptionTimeline.tsx src/components/apartment/__tests__/SubscriptionTimeline.test.tsx
git commit -m "feat: add SubscriptionTimeline component"
```

---

### Task 6: ApartmentChecklist 컴포넌트

**Files:**
- Create: `src/components/apartment/__tests__/ApartmentChecklist.test.tsx`
- Create: `src/components/apartment/ApartmentChecklist.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`src/components/apartment/__tests__/ApartmentChecklist.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ApartmentChecklist from '../ApartmentChecklist'

describe('ApartmentChecklist', () => {
  it('공통 항목 4개를 표시한다', () => {
    render(<ApartmentChecklist priceCap={null} houseType={null} />)
    expect(screen.getByText(/청약통장 1순위 조건/)).toBeInTheDocument()
    expect(screen.getByText(/무주택 세대주/)).toBeInTheDocument()
    expect(screen.getByText(/계약금 준비/)).toBeInTheDocument()
    expect(screen.getByText(/중도금 대출/)).toBeInTheDocument()
  })

  it('price_cap이 true이면 실거주의무 항목을 표시한다', () => {
    render(<ApartmentChecklist priceCap={true} houseType={null} />)
    expect(screen.getByText(/분양가상한제 적용/)).toBeInTheDocument()
    expect(screen.getByText(/실거주의무/)).toBeInTheDocument()
  })

  it('price_cap이 false이면 전매제한 항목을 표시한다', () => {
    render(<ApartmentChecklist priceCap={false} houseType={null} />)
    expect(screen.getByText(/전매제한 기간/)).toBeInTheDocument()
    expect(screen.queryByText(/분양가상한제 적용/)).not.toBeInTheDocument()
  })

  it('price_cap이 null이면 전매제한 항목을 표시한다', () => {
    render(<ApartmentChecklist priceCap={null} houseType={null} />)
    expect(screen.getByText(/전매제한 기간/)).toBeInTheDocument()
  })

  it('면책 문구를 표시한다', () => {
    render(<ApartmentChecklist priceCap={null} houseType={null} />)
    expect(screen.getByText(/참고용입니다/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/ApartmentChecklist.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: `ApartmentChecklist.tsx` 구현**

`src/components/apartment/ApartmentChecklist.tsx`:

```typescript
interface Props {
  priceCap: boolean | null
  houseType: string | null
}

const COMMON_ITEMS = [
  '청약통장 1순위 조건 충족 여부 확인',
  '무주택 세대주 여부 확인',
  '계약금 준비 (분양가의 10~20%)',
  '중도금 대출 가능 여부 확인',
]

export default function ApartmentChecklist({ priceCap }: Props) {
  const conditionalItem = priceCap === true
    ? '분양가상한제 적용 — 실거주의무·전매제한 최장 10년 확인'
    : '전매제한 기간 공고문에서 확인'

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h2 className="text-base font-semibold mb-3">신청 전 확인 체크리스트</h2>
      <ul className="space-y-2">
        {[...COMMON_ITEMS, conditionalItem].map(item => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-yellow-600 shrink-0">☐</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 mt-3">
        본 체크리스트는 참고용입니다. 실제 자격 확인은 청약홈 공고문을 기준으로 하세요.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/ApartmentChecklist.test.tsx
```

Expected: 5 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/components/apartment/ApartmentChecklist.tsx src/components/apartment/__tests__/ApartmentChecklist.test.tsx
git commit -m "feat: add ApartmentChecklist component"
```

---

### Task 7: IcsDownloadButton 컴포넌트

**Files:**
- Create: `src/components/apartment/__tests__/IcsDownloadButton.test.tsx`
- Create: `src/components/apartment/IcsDownloadButton.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`src/components/apartment/__tests__/IcsDownloadButton.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IcsDownloadButton from '../IcsDownloadButton'

describe('IcsDownloadButton', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('날짜가 있으면 버튼을 표시한다', () => {
    render(
      <IcsDownloadButton
        name="테스트 아파트"
        priority1Date="2025-06-01"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        pblancUrl={null}
      />
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('모든 날짜가 null이면 렌더링하지 않는다', () => {
    const { container } = render(
      <IcsDownloadButton
        name="테스트 아파트"
        priority1Date={null}
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        pblancUrl={null}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('클릭 시 createObjectURL을 호출하고 링크를 클릭한다', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(
      <IcsDownloadButton
        name="테스트 아파트"
        priority1Date="2025-06-01"
        applyEnd={null}
        winnerDate="2025-06-10"
        contractStart={null}
        pblancUrl={null}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/IcsDownloadButton.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: `IcsDownloadButton.tsx` 구현**

`src/components/apartment/IcsDownloadButton.tsx`:

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

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function makeIcs(events: Array<{ summary: string; date: string; url: string }>): string {
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//청약마당//KR']
  for (const e of events) {
    const d = toIcsDate(e.date)
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${d}`,
      `SUMMARY:${e.summary}`,
      `URL:${e.url}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export default function IcsDownloadButton({ name, priority1Date, applyEnd, winnerDate, contractStart, pblancUrl }: Props) {
  const hasEvents = priority1Date || applyEnd || winnerDate || contractStart
  if (!hasEvents) return null

  const url = pblancUrl ?? 'https://www.applyhome.co.kr'

  function handleDownload() {
    const events: Array<{ summary: string; date: string; url: string }> = []
    const applyDate = priority1Date ?? applyEnd
    if (applyDate) events.push({ summary: `${name} 1순위 접수`, date: applyDate, url })
    if (winnerDate) events.push({ summary: `${name} 당첨자 발표`, date: winnerDate, url })
    if (contractStart) events.push({ summary: `${name} 계약 시작`, date: contractStart, url })
    if (events.length === 0) return

    const blob = new Blob([makeIcs(events)], { type: 'text/calendar' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${name}-청약일정.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
    >
      📅 캘린더에 추가
    </button>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run src/components/apartment/__tests__/IcsDownloadButton.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/components/apartment/IcsDownloadButton.tsx src/components/apartment/__tests__/IcsDownloadButton.test.tsx
git commit -m "feat: add IcsDownloadButton component"
```

---

### Task 8: 상세 페이지 레이아웃 교체

**Files:**
- Modify: `src/app/apply/[id]/page.tsx`

- [ ] **Step 1: `src/app/apply/[id]/page.tsx` 전체 교체**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getApartmentById } from '@/lib/apartments'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Apartment } from '@/types'
import KakaoMapEmbed from '@/components/map/KakaoMapEmbed'
import SaveButton from '@/components/user/SaveButton'
import AlertButton from '@/components/user/AlertButton'
import DdayBanner from '@/components/apartment/DdayBanner'
import SubscriptionTimeline from '@/components/apartment/SubscriptionTimeline'
import ApartmentChecklist from '@/components/apartment/ApartmentChecklist'
import IcsDownloadButton from '@/components/apartment/IcsDownloadButton'

export const revalidate = 21600

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const apartment = await getApartmentById(id)
  if (!apartment) return { title: '단지를 찾을 수 없습니다' }
  return {
    title: `${apartment.name} 분양 정보`,
    description: `${apartment.region} ${apartment.district ?? ''} ${apartment.name} 청약 일정, 세대수, 위치 정보.`,
    openGraph: {
      title: `${apartment.name} | 청약마당`,
      description: `청약 기간: ${apartment.apply_start} ~ ${apartment.apply_end}`,
    },
  }
}

function JsonLd({ apartment }: { apartment: Apartment }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: apartment.name,
    description: `${apartment.region} ${apartment.district ?? ''} 분양 단지`,
    address: {
      '@type': 'PostalAddress',
      addressRegion: apartment.region,
      addressLocality: apartment.district ?? '',
      streetAddress: apartment.address ?? '',
      addressCountry: 'KR',
    },
    ...(apartment.lat && apartment.lng
      ? { geo: { '@type': 'GeoCoordinates', latitude: apartment.lat, longitude: apartment.lng } }
      : {}),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function ApartmentDetailPage({ params }: Props) {
  const { id } = await params
  const apartment = await getApartmentById(id)
  if (!apartment) notFound()

  const officialUrl = apartment.pblanc_url ?? 'https://www.applyhome.co.kr'

  return (
    <>
      <JsonLd apartment={apartment} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-4">
          <div className="flex items-start gap-3 mb-1">
            <h1 className="text-2xl font-bold">{apartment.name}</h1>
            <Badge>{apartment.region}</Badge>
          </div>
          <p className="text-gray-500 text-sm">
            {apartment.address ?? `${apartment.region} ${apartment.district ?? ''}`}
          </p>
        </div>

        <DdayBanner
          priority1Date={apartment.priority1_date}
          applyEnd={apartment.apply_end}
          winnerDate={apartment.winner_date}
          contractStart={apartment.contract_start}
          moveInMonth={apartment.move_in_month}
        />

        <SubscriptionTimeline
          announceDate={apartment.announce_date}
          specialSupplyDate={apartment.special_supply_date}
          priority1Date={apartment.priority1_date}
          applyEnd={apartment.apply_end}
          winnerDate={apartment.winner_date}
          contractStart={apartment.contract_start}
          contractEnd={apartment.contract_end}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">총 세대수</p>
            <p className="font-medium">{apartment.total_units?.toLocaleString() ?? '-'}세대</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">주택 유형</p>
            <p className="font-medium text-sm">{apartment.house_type ?? '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">분양가상한제</p>
            <p className="font-medium text-sm">
              {apartment.price_cap === null ? '-' : apartment.price_cap ? '적용' : '미적용'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">분양가</p>
            <p className="font-medium text-sm">
              {apartment.min_price ? `${(apartment.min_price / 10000).toFixed(0)}억~` : '공고 확인'}
            </p>
          </div>
        </div>

        <ApartmentChecklist priceCap={apartment.price_cap} houseType={apartment.house_type} />

        {apartment.lat && apartment.lng && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-2">위치</h2>
            <KakaoMapEmbed lat={apartment.lat} lng={apartment.lng} name={apartment.name} />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            공식 공고 바로가기
          </a>
          <IcsDownloadButton
            name={apartment.name}
            priority1Date={apartment.priority1_date}
            applyEnd={apartment.apply_end}
            winnerDate={apartment.winner_date}
            contractStart={apartment.contract_start}
            pblancUrl={apartment.pblanc_url}
          />
          <Link
            href={`/region/${apartment.region}`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {apartment.region} 분양 더보기
          </Link>
          <AlertButton apartmentId={apartment.id} />
          <SaveButton apartmentId={apartment.id} />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: 전체 테스트 통과 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run
```

Expected: 모든 테스트 통과.

- [ ] **Step 3: 빌드 확인**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npm run build
```

Expected: 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/app/apply/[id]/page.tsx
git commit -m "feat: replace detail page layout with decision card"
```

---

### Task 9: 데이터 재동기화

- [ ] **Step 1: 개발 서버 실행 (별도 터미널)**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npm run dev
```

- [ ] **Step 2: cron API 호출**

```bash
curl -s -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/cron/sync | jq .
```

Expected: `{ "ok": true, "upserted": N }`

- [ ] **Step 3: Supabase에서 데이터 확인**

Supabase SQL Editor에서:
```sql
select name, priority1_date, winner_date, pblanc_url, price_cap
from apartments
where priority1_date is not null
limit 5;
```

Expected: 최소 1개 이상 레코드에 `priority1_date` 값이 있음.

- [ ] **Step 4: 브라우저에서 상세 페이지 확인**

`http://localhost:3000/apply` 에서 아무 단지 클릭 → DdayBanner, SubscriptionTimeline, ApartmentChecklist, 캘린더 버튼이 모두 표시되는지 확인.
