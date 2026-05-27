# 부동산 포털 사이트 설계 문서

**날짜:** 2026-05-27  
**단계:** Phase 1 MVP  
**목표:** 분양/청약 정보 + 뉴스/콘텐츠 + 광고 수익 기반 부동산 포털

---

## 1. 프로젝트 개요

### 목표
- 청약을 처음 접하는 2030 실수요자와 내 집 마련 준비 중인 일반인을 타겟
- Google AdSense + Kakao AdFit 이중 광고로 트래픽 기반 수익 창출
- 공공 API 데이터로 운영 비용 최소화 (초기 ₩0/월)

### 참고 사이트
- r114.com/apply (부동산114 분양관) — 분양/청약 정보 구조 참고
- serve.co.kr (부동산써브) — 종합 부동산 포털 UX 참고

### Phase 1 범위
분양/청약 정보 + 부동산 뉴스/가이드 콘텐츠 + 광고 수익화  
(Phase 2 이후: 매매/전세/월세 매물 검색, 경매 정보 확장)

---

## 2. 기술 스택

```
프론트엔드:  Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui
데이터베이스: Supabase (PostgreSQL + Auth)
캐싱:        Upstash Redis
지도:        카카오맵 API
배포:        Vercel (Cron Jobs 포함)
광고:        Google AdSense + Kakao AdFit
모니터링:    Google Analytics 4 + Search Console + Vercel Analytics + Sentry
```

**초기 인프라 비용: ₩0/월** — 모든 서비스 무료 티어로 충분

---

## 3. 전체 아키텍처

```
사용자 브라우저
    │
    ▼
Next.js (Vercel CDN 엣지 캐시)
    ├── 정적 페이지 (SSG/ISR) — SEO 핵심
    └── API Routes — 동적 데이터 처리
              │
    ┌─────────┼──────────────┐
    ▼         ▼              ▼
Upstash   Supabase      공공 API
Redis     Postgres      청약홈/부동산원
(캐시)    (회원/저장)    (원천 데이터)
                              ▲
                    Vercel Cron (매일 새벽 3시)
                    자동 데이터 갱신
```

### 렌더링 전략

| 페이지 유형 | 방식 | 이유 |
|------------|------|------|
| 분양 목록, 뉴스 목록 | ISR (1시간) | SEO + 데이터 최신성 균형 |
| 지역별 청약 가이드 | SSG (빌드 시) | 완전 정적, 구글 상위 노출 |
| 지도 탐색, 마이페이지 | CSR | 실시간 인터랙션 |
| 분양 단지 상세 | ISR (6시간) | 자주 안 바뀜, SEO 필요 |

---

## 4. 페이지 구조 & 라우팅

```
/                          홈 (청약 D-day 캘린더, 인기 분양, 뉴스 헤드라인)
/apply                     분양/청약 목록 (필터: 지역, 규모, 자격)
/apply/[id]                분양 단지 상세 (카카오맵 + 경쟁률 + 일정)
/calendar                  청약 캘린더 (월별 일정 뷰)
/map                       지도 기반 분양 탐색 (카카오맵)
/calculator                청약 가점 계산기 (독립 SEO 랜딩)
/news                      부동산 뉴스/트렌드
/news/[slug]               뉴스 상세 (고광고 노출 페이지)
/guide                     청약 가이드 목록
/guide/how-to              청약 처음이라면
/guide/types               청약 유형 총정리
/region/[name]             지역별 분양 정보 — SEO 핵심 랜딩
/my/saved                  관심 단지 저장 목록
/my/alerts                 청약 D-day 알림 설정
/privacy                   개인정보처리방침 (AdSense 필수)
/terms                     이용약관
```

### SEO 핵심 — 지역 페이지 자동 생성

`/region/[name]`을 전국 시/구 단위로 SSG 자동 생성.

```
/region/서울     → "서울 분양 일정 2025" 검색 유입
/region/강남구   → "강남 아파트 분양" 검색 유입
/region/경기     → "경기도 청약 일정" 검색 유입
```

수백 개의 SEO 랜딩 페이지가 자동 생성되어 장기 트래픽 확보.

---

## 5. 데이터 레이어

### 공공 API 목록

| API | 제공처 | 데이터 | 갱신 주기 |
|-----|--------|--------|----------|
| 청약 공고 목록 | 청약홈 (LH) | 단지명, 위치, 일정, 세대수 | 일 1회 |
| 청약 경쟁률 | 청약홈 (LH) | 타입별 경쟁률 | 청약 기간 중 |
| 아파트 실거래가 | 국토부 공공데이터포털 | 거래가, 면적, 층수 | 월 1회 |
| 부동산 시세 | 한국부동산원 | 주간 매매/전세 지수 | 주 1회 |

모두 data.go.kr에서 무료 API 키 발급 가능.

### Cron Job 흐름

```
Vercel Cron (매일 새벽 3시)
    → 공공 API 호출
    → 데이터 정제 (중복 제거, 주소 정규화)
    → Supabase upsert (변경분만 갱신)
    → Upstash Redis 캐시 무효화
```

### Supabase 스키마

```sql
apartments (
  id, name, region, district,
  address, lat, lng,
  supply_date, apply_start, apply_end,
  total_units, min_price, max_price,
  source_id, created_at, updated_at
)

articles (
  id, slug, title, summary, body,
  category,        -- 'news' | 'guide'
  published_at, updated_at
)

users (
  id,              -- Supabase Auth UUID
  email, nickname,
  push_token,      -- PWA 알림용
  created_at
)

saved_apartments (
  user_id, apartment_id, created_at
)

alerts (
  user_id, apartment_id,
  alert_days_before,   -- D-7, D-3, D-1
  is_active
)
```

### Redis 캐싱 전략

| 캐시 키 | TTL |
|---------|-----|
| `apartments:list:{region}` | 1시간 |
| `apartments:detail:{id}` | 6시간 |
| `articles:list` | 30분 |
| `region:summary:{name}` | 2시간 |

---

## 6. 수익 모델

### Phase 1 — AdSense + Kakao AdFit 이중 구조

```
상단 헤더 배너          ← AdSense 반응형
콘텐츠 목록 중간        ← Kakao AdFit 네이티브 카드
콘텐츠 하단             ← AdSense 디스플레이
모바일 하단 고정 배너   ← AdFit (고노출)
```

### 페이지별 예상 RPM

| 페이지 | 예상 RPM | 이유 |
|--------|---------|------|
| `/calculator` 가점 계산기 | ₩3,000~8,000 | 구매 의도 높은 키워드 |
| `/apply/[id]` 분양 상세 | ₩2,000~5,000 | 고관여 사용자 |
| `/region/[name]` 지역별 | ₩2,000~4,000 | 검색 유입 직접 |
| `/news/[slug]` 뉴스 | ₩1,000~2,000 | 일반 콘텐츠 |

월 10만 PV 기준 예상 수익: ₩200,000~500,000

### 광고 수익 극대화 원칙

1. Core Web Vitals 유지 — 구글은 느린 사이트 AdSense 단가 낮춤
2. 콘텐츠 > 광고 비율 유지 — 정책 위반 및 SEO 페널티 방지
3. 지역 페이지 자동 생성 — SEO 트래픽 수백 배 증폭

### Phase 2 수익 확장 (트래픽 확보 후)

| 수익원 | 조건 | 예상 추가 수익 |
|--------|------|---------------|
| 건설사 직접 배너광고 | 월 5만 PV 이상 | 월 ₩500,000~2,000,000 |
| 프리미엄 알림 유료화 | 회원 1,000명 이상 | ₩500~1,000/인/월 |
| 분양 신청 CPA 제휴 | 파트너사 연결 | 건당 ₩3,000~10,000 |
| 청약 가이드 PDF 판매 | 콘텐츠 축적 후 | 건당 ₩9,900 |

---

## 7. 사용자 기능 & UI 흐름

### 첫 방문 경험

```
구글 검색 "서울 청약 일정"
    → /region/서울 (지역 랜딩)
        ├── 이번 달 청약 일정 테이블
        ├── 지도 미리보기
        └── "청약 처음이세요?" 배너
    → /apply/[id] (관심 단지 클릭)
        ├── 단지 상세 + 카카오맵
        ├── 청약 자격 간단 체크
        ├── 공식 청약홈 바로가기
        └── "알림 받기" CTA → 회원가입 유도
```

### 회원 & 알림 흐름

가입은 알림이 필요한 순간에만 요구 — 강제 가입 없음.

```
"알림 받기" 클릭
    → 카카오 소셜 로그인 (Supabase Auth)
    → 관심 단지 저장 + D-day 알림 설정
    → Vercel Cron 매일 체크 → Web Push 발송
```

### 핵심 UI 컴포넌트

| 컴포넌트 | 역할 |
|---------|------|
| `ApartmentCard` | 단지 카드 (이름, 지역, D-day, 가격 범위) |
| `CalendarView` | 월별 청약 일정 |
| `KakaoMapEmbed` | 분양 단지 위치 핀 지도 |
| `ScoreCalculator` | 청약 가점 계산기 |
| `AdSlot` | 광고 슬롯 래퍼 (AdSense/AdFit 교체 가능) |
| `AlertButton` | "알림 받기" 로그인 트리거 |

### 모바일 우선 레이아웃

한국 부동산 검색의 70% 이상이 모바일.

```
모바일                 데스크탑
┌─────────────┐       ┌──────────┬────────────┐
│ 상단 검색바  │       │ 사이드바  │ 메인 콘텐츠 │
│ 분양 카드   │  →    │ (광고+필터)│ (그리드)   │
│ (세로 스크롤)│       │          │            │
│ 하단 고정광고│       └──────────┴────────────┘
└─────────────┘
```

### 재방문 루프

```
첫 방문 → 알림 설정
    → 청약 D-day 푸시 알림
    → 재방문 → 단지 상세 확인
    → 뉴스/가이드 추천 노출
    → 체류시간 증가 → AdSense 수익 증가
```

---

## 8. SEO 기술 설정

| 항목 | 구현 방법 |
|------|----------|
| `sitemap.xml` 자동 생성 | Next.js `app/sitemap.ts` |
| `robots.txt` | `app/robots.ts` |
| JSON-LD 구조화 데이터 | 분양 상세 페이지에 `RealEstateListing` 스키마 |
| Open Graph 태그 | `app/layout.tsx` 메타데이터 설정 |
| 카카오톡 공유 미리보기 | og:image + og:title 최적화 |

---

## 9. 콘텐츠 전략

AdSense 승인을 위해 런칭 전 콘텐츠 필수.

### 초기 수동 작성 (15개)

SEO 검색량 높은 키워드 타겟:
- "청약 가점 계산 방법"
- "무주택자 기준 총정리"
- "생애최초 특별공급 조건"
- "청약 통장 만들기 총정리"
- "분양가 상한제 뜻과 영향" 등

### 자동 생성 콘텐츠

공공 API 데이터 기반 월별 자동 생성:
- "2025년 {월}월 {지역} 청약 일정 총정리"
- 매달 전국 17개 지역 × 자동 생성 = SEO 페이지 지속 축적

---

## 10. 법적 필수 항목

- `/privacy` 개인정보처리방침 — AdSense/AdFit 신청 필수
- `/terms` 이용약관
- 운영자 정보 표시 (푸터)
- 공공데이터포털 API 이용약관 준수

---

## 11. 모니터링 스택

| 도구 | 목적 | 비용 |
|------|------|------|
| Google Search Console | SEO 키워드 순위, 색인 상태 | 무료 |
| Google Analytics 4 | 광고 최적화 데이터 | 무료 |
| Vercel Analytics | Core Web Vitals 실시간 | 무료 |
| Sentry | 에러 추적 | 무료 티어 |

---

## 12. 런칭 순서

```
1단계: 콘텐츠 먼저 (2~3주)
   → 가이드 15개 수동 작성
   → 지역 페이지 자동 생성 설정

2단계: Google Search Console 등록 + 색인 요청

3단계: 트래픽 월 1,000 PV 이상 확인

4단계: AdSense + Kakao AdFit 신청
   (콘텐츠 + 트래픽 없으면 반려됨)

5단계: 광고 배치 A/B 테스트 + 최적화
```

---

## 13. 향후 확장 (Phase 2+)

- 매매/전세/월세 매물 검색 (중개사 직접 등록)
- 경매 정보 (대법원 경매 API)
- 부동산 투자 수익률 계산기
- 주간 시세 리포트 이메일 뉴스레터
