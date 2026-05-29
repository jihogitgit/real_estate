# 청약마당 런칭 준비 — AdSense 콘텐츠 + 인프라 설계

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Google AdSense 심사 통과를 위한 콘텐츠 보강 및 서비스 런칭을 위한 인프라 완성

**Architecture:** 정적 페이지(FAQ/Contact)는 Next.js Server Component로 구현. 가이드 콘텐츠는 Supabase SQL 삽입. 인프라(Redis/Vercel/Sentry)는 환경변수 설정 및 외부 서비스 연동.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Upstash Redis, Vercel

---

## Phase A: AdSense 콘텐츠 보강

### A-1. FAQ 페이지 (`/faq`)

**파일:** `src/app/faq/page.tsx`

**구현 방식:**
- `'use client'` 컴포넌트
- shadcn/ui `Accordion` 컴포넌트 사용 (`AccordionItem`, `AccordionTrigger`, `AccordionContent`)
- 카테고리별 섹션으로 구분, 한 페이지에 모두 표시 (탭 없음)
- SEO: `export const metadata` 포함

**FAQ 항목 (총 24개):**

카테고리 1 — 청약 기본
1. 청약이란 무엇인가요?
2. 청약통장이 없으면 청약을 못 하나요?
3. 청약 1순위 조건이 뭔가요?
4. 청약 2순위도 당첨될 수 있나요?
5. 무주택자 기준이 어떻게 되나요?
6. 청약 당첨 후 포기하면 어떻게 되나요?

카테고리 2 — 가점제와 추첨제
7. 가점제와 추첨제 차이가 뭔가요?
8. 청약 가점 만점은 몇 점인가요?
9. 부양가족 수는 어떻게 계산하나요?
10. 무주택 기간은 언제부터 계산되나요?
11. 청약통장 가입 기간은 어떻게 계산하나요?
12. 가점이 낮아도 당첨될 수 있나요?

카테고리 3 — 특별공급
13. 특별공급 종류에는 어떤 것들이 있나요?
14. 신혼부부 특별공급 조건이 뭔가요?
15. 생애최초 특별공급 자격은?
16. 다자녀 특별공급은 몇 명 이상인가요?
17. 노부모 부양 특별공급 조건은?
18. 특별공급과 일반공급 중복 신청 가능한가요?

카테고리 4 — 청약 절차
19. 청약 신청은 어디서 하나요?
20. 청약 일정은 어떻게 확인하나요?
21. 당첨 후 계약까지 어떤 절차가 있나요?
22. 청약 당첨되면 기존 집을 팔아야 하나요?
23. 분양가상한제가 뭔가요?
24. 전매제한이란 무엇인가요?

---

### A-2. 문의 페이지 (`/contact`)

**파일:** `src/app/contact/page.tsx`

**구현 방식:** 정적 Server Component
- 이메일 주소 표시 (mailto 링크)
- 간단한 소개 문구 (서비스 소개, 데이터 출처 명시)
- 오류 신고 / 제휴 문의 안내

---

### A-3. ads.txt

**파일:** `public/ads.txt`

**형식:**
```
google.com, {ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0
```

- `NEXT_PUBLIC_ADSENSE_CLIENT` 환경변수의 `ca-pub-XXXX` 값을 직접 기입
- AdSense 승인 후 실제 Publisher ID로 교체

---

### A-4. 가이드 콘텐츠 (Supabase SQL)

**대상 테이블:** `articles` (기존)
**필드:** `slug, title, summary, body (HTML), category='guide', published_at`

**15개 가이드 글 목록:**

1. `apt-subscription-intro` — 아파트 청약 완전 입문 가이드
2. `apt-score-calculation` — 청약 가점 계산법 완벽 정리
3. `special-supply-types` — 특별공급 종류와 신청 조건 총정리
4. `subscription-account-guide` — 청약통장 200% 활용법
5. `homeless-period-calc` — 무주택 기간 계산 방법
6. `priority-one-conditions` — 청약 1순위 조건과 지역별 차이
7. `lottery-vs-score` — 가점제 vs 추첨제 언제 어디에 적용되나
8. `newlywed-special-supply` — 신혼부부 특별공급 완벽 가이드
9. `first-home-special` — 생애최초 특별공급 자격과 신청법
10. `subscription-calendar-guide` — 청약 일정 보는 법과 캘린더 활용
11. `contract-process` — 청약 당첨 후 계약까지 단계별 가이드
12. `price-cap-system` — 분양가상한제란 무엇인가
13. `resale-restriction` — 전매제한 완벽 이해
14. `seoul-subscription-strategy` — 서울·수도권 청약 전략 가이드
15. `subscription-checklist` — 청약 신청 전 꼭 확인할 체크리스트

각 글은 최소 500자 이상 HTML 본문(`<h2>`, `<p>`, `<ul>` 태그 사용).

---

## Phase B: 인프라 완성

### B-1. Upstash Redis 연동

**목적:** 아파트 목록 캐싱으로 Supabase 쿼리 부하 감소

**설정:**
1. [console.upstash.com](https://console.upstash.com) → Redis 생성 (Seoul 리전)
2. REST API URL과 Token 복사
3. `.env.local` 업데이트:
   ```
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```
4. Vercel 환경변수에도 동일하게 추가

**코드:** `src/lib/redis.ts`는 이미 null-safe로 구현됨 — 환경변수만 채우면 자동 활성화

---

### B-2. 카카오맵 키 설정

**목적:** `/apply/[id]` 상세 페이지 지도 표시

**설정:**
1. [developers.kakao.com](https://developers.kakao.com) → 앱 생성
2. 플랫폼 → 웹 → 사이트 도메인 등록 (localhost:3000, 실제 도메인)
3. JavaScript 앱 키 복사
4. `.env.local`: `NEXT_PUBLIC_KAKAO_MAP_KEY=...`

---

### B-3. Vercel 배포

**설정 순서:**
1. `vercel.json` 작성 — cron job 설정 (매일 새벽 2시 데이터 동기화)
2. Vercel 대시보드 → Environment Variables에 `.env.local` 전체 항목 입력
3. `git push` → 자동 배포

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**CRON_SECRET:** `openssl rand -base64 32`으로 생성 후 Vercel 환경변수에 추가

---

### B-4. Sentry 에러 모니터링

**설정:** 인터랙티브 CLI 필요 — 사용자가 직접 실행
```bash
npx @sentry/wizard@latest -i nextjs --no-install
```
생성되는 `sentry.client.config.ts`, `sentry.server.config.ts` 파일 커밋.

---

## 구현 우선순위

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | FAQ 페이지 | 30분 |
| 2 | Contact 페이지 | 10분 |
| 3 | ads.txt | 5분 |
| 4 | 가이드 콘텐츠 SQL | 1시간 |
| 5 | vercel.json cron 설정 | 10분 |
| 6 | Upstash/Kakao/Sentry | 사용자 설정 필요 |

---

## AdSense 심사 체크리스트

심사 제출 전 확인:

- [ ] FAQ 페이지 완성 (24문항)
- [ ] Contact 페이지 (이메일 표시)
- [ ] 개인정보처리방침 ✅ (이미 완성)
- [ ] 이용약관 ✅ (이미 완성)
- [ ] ads.txt 루트 배포 확인
- [ ] 가이드 글 15개 이상
- [ ] 모바일 반응형 확인
- [ ] 도메인 연결 및 HTTPS
