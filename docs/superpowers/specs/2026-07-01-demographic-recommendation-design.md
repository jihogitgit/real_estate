# 3040 · 5060 예산 맞춤 지역 추천 기능 설계

**작성일:** 2026-07-01  
**상태:** 승인 대기

---

## 개요

메인 홈 화면에 연령대(3040 / 5060)별 보유 자산과 대출 한도를 기반으로 매매 또는 전세 가능한 지역 및 실거래 사례를 추천하는 섹션을 추가한다.

---

## 결정 사항 요약

| 항목 | 결정 |
|------|------|
| 위치 | 메인 홈 카테고리 타일 바로 아래 (섹션 3번째) |
| 입력 방식 | 연령대 선택 → 기본값 자동입력 → 사용자 직접 수정 가능 |
| 거래 유형 | 매매 / 전세 선택 |
| 추천 데이터 | apt_trades(매매) / apt_rents(전세) 실거래 기반 |
| 결과 레이아웃 | 지역 탭 + 아파트 실거래 카드 그리드 |
| 구현 방식 | 클라이언트 필터링 (지역별 평균가 집계 API 1회 호출 후 즉시 반응) |
| 대출 모달 | 정부지원(외부 링크) / 일반대출(DSR 40% 계산) |

---

## 섹션 1 — 아키텍처 & 데이터 흐름

```
홈 페이지 로드
  └─ GET /api/recommend/region-stats?type=trade|jeonse
       └─ apt_trades(매매) 또는 apt_rents(전세)에서
          lawd_cd별 avg(price|deposit) 집계 (최근 12개월)
       └─ revalidate: 86400 (24시간 캐시)
       └─ 반환: [{ lawd_cd, name, avg_price, count }, ...]

사용자 입력 (클라이언트)
  ├─ 연령대 선택 → 보유금액 / 대출한도 기본값 자동입력
  ├─ 거래유형 전환 → region-stats 재호출 (type 파라미터 변경)
  └─ 예산 수정 → 클라이언트에서 즉시 재필터링 (API 재호출 없음)

필터링
  └─ avg_price ≤ (보유금액 + 대출한도) × 1.3 인 지역만 탭 표시
     (×1.3: 평균가보다 약간 비싼 매물도 탐색 가능하도록 여유폭 부여)

대출 한도 모달 (클라이언트 계산, 서버 요청 없음)
  ├─ 정부지원 선택 → nhuf.molit.go.kr 새 탭 열기 + "금액 직접 입력" 안내
  └─ 일반대출 선택 → 연소득 입력 → DSR 40% 계산 → 대출한도 자동입력
```

---

## 섹션 2 — UI 컴포넌트 구조

```
src/
├── components/dungji/screens/Home.tsx       ← RecommendSection 추가
└── components/recommend/
    ├── RecommendSection.tsx                 ← 섹션 전체 래퍼 (클라이언트)
    ├── AgeGroupSelector.tsx                 ← 3040 / 5060 선택 버튼
    ├── DealTypeSelector.tsx                 ← 매매 / 전세 탭
    ├── BudgetInputs.tsx                     ← 보유금액 + 대출한도 입력
    ├── LoanCalculatorModal.tsx              ← 대출 한도 계산 모달
    └── RegionResultTabs.tsx                 ← 지역 탭 + 카드 그리드
```

**사용자 흐름:**

```
① 연령대 선택 (3040 / 5060)
   └─ 보유금액 + 대출한도 기본값 자동입력

② 매매 / 전세 선택
   └─ region-stats API 호출

③ 보유금액 / 대출한도 수정 (선택)
   └─ "대출 한도 모르세요?" 클릭 → LoanCalculatorModal
      ├─ 정부지원 → nhuf.molit.go.kr 이동 + 직접 입력 안내
      └─ 일반대출 → 연소득 입력 → DSR 계산 → 자동입력

④ 결과 즉시 반영
   └─ 지역 탭: 예산 적합 지역만, 평균가 낮은 순 정렬
      각 탭: 지역명 + 평균가 + 최근 실거래 카드 6개
      카드: 아파트명 / 면적(㎡) / 거래가 / 거래일
      "더보기" → /region/[name] 페이지
```

**엣지 케이스:**
- 매칭 지역 0개 → "예산 범위 내 지역이 없어요" 빈 상태 표시
- 매칭 지역 다수 → 상위 10개 탭만 표시

---

## 섹션 3 — 데이터 모델

### API

```
GET /api/recommend/region-stats?type=trade   // 매매
GET /api/recommend/region-stats?type=jeonse  // 전세
```

```ts
// 응답 타입
type RegionStat = {
  lawd_cd: string   // 법정동 코드 5자리
  name: string      // 시군구명 (예: "서울 강남구")
  avg_price: number // 평균 거래가 (만원)
  count: number     // 거래 건수 (최근 12개월)
}
```

### DB 쿼리

```sql
-- 매매 (apt_trades)
SELECT lawd_cd, AVG(price) AS avg_price, COUNT(*) AS count
FROM apt_trades
WHERE deal_date >= NOW() - INTERVAL '12 months'
GROUP BY lawd_cd
ORDER BY count DESC
LIMIT 50;

-- 전세 (apt_rents)
SELECT lawd_cd, AVG(deposit) AS avg_price, COUNT(*) AS count
FROM apt_rents
WHERE deal_date >= NOW() - INTERVAL '12 months'
GROUP BY lawd_cd
ORDER BY count DESC
LIMIT 50;
```

### lawd_cd → 지역명

`src/lib/lawd-names.ts`에 법정동 코드 5자리 → 시군구명 정적 맵 하드코딩.

### 연령대 기본값

> **⚠️ 안내:** 아래 수치는 통계 기반 참고값입니다. 실제 본인의 보유 자산과 대출 가능 금액에 맞게 수정하여 사용하세요.

```ts
// src/lib/recommend/age-defaults.ts
// 출처: 통계청 가계금융복지조사 참고 (2025 기준 추정치)
// 실제 개인 상황에 따라 크게 다를 수 있음 — 반드시 직접 수정할 것

export const AGE_DEFAULTS = {
  '3040': { savings: 15000, loan: 20000 },  // 단위: 만원
  '5060': { savings: 30000, loan: 15000 },
}
```

### 대출 한도 계산 (일반 주담대 — DSR 40%)

```ts
// 원리금균등상환 역산
// annualIncome: 연소득 (만원), rate: 연금리, termYears: 상환기간
function calcMaxLoan(annualIncome: number, rate: number, termYears: number): number {
  const r = rate / 12 / 100           // 월금리
  const n = termYears * 12            // 총 상환 월수
  const monthlyPayable = (annualIncome * 10000 * 0.4) / 12  // DSR 40% 월 상환 한도
  // 대출 원금 = 월상환액 × [(1+r)^n - 1] / [r × (1+r)^n]
  const maxLoan = monthlyPayable * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)))
  return Math.floor(maxLoan / 10000)  // 만원 단위 반환
}
```

### 정부지원 대출 안내 (모달)

하드코딩 기준일: **2026-07 (nhuf.molit.go.kr 공식 확인)**  
정책 변경 시 업데이트 필요.

| 상품 | 대상 | 소득 조건 | 한도 | 링크 |
|------|------|----------|------|------|
| 디딤돌대출 | 매매 | 부부합산 6천만원↓ (신혼 8.5천↓) | 2억 (신혼·2자녀 3.2억) | nhuf.molit.go.kr |
| 버팀목전세자금 | 전세 | 부부합산 5천만원↓ (신혼 7.5천↓) | 수도권 1.2억 / 외 8천만 | nhuf.molit.go.kr |

> **⚠️ 안내:** 위 조건은 참고용이며 실제 한도는 개인 신용·자산·담보에 따라 다릅니다.  
> 정확한 한도는 [주택도시기금 사이트](https://nhuf.molit.go.kr)에서 직접 조회하세요.

---

## 파일 목록 (신규 생성)

| 파일 | 설명 |
|------|------|
| `src/components/recommend/RecommendSection.tsx` | 섹션 래퍼 |
| `src/components/recommend/AgeGroupSelector.tsx` | 연령대 선택 |
| `src/components/recommend/DealTypeSelector.tsx` | 매매/전세 탭 |
| `src/components/recommend/BudgetInputs.tsx` | 예산 입력 |
| `src/components/recommend/LoanCalculatorModal.tsx` | 대출 계산 모달 |
| `src/components/recommend/RegionResultTabs.tsx` | 결과 탭 + 카드 |
| `src/app/api/recommend/region-stats/route.ts` | 지역 평균가 API |
| `src/lib/recommend/age-defaults.ts` | 연령대 기본값 |
| `src/lib/recommend/loan-calc.ts` | DSR 계산 로직 |
| `src/lib/lawd-names.ts` | 법정동 코드 → 지역명 맵 |

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dungji/screens/Home.tsx` | 카테고리 타일 아래 `<RecommendSection />` 추가 |
