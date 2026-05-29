# 청약마당 런칭 준비 — AdSense 콘텐츠 + 신뢰도 설계

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Google AdSense 심사 통과를 위한 신뢰 가능한 청약 정보 서비스 구축. "승인용 껍데기"가 아니라 실제 가치 있는 콘텐츠와 서비스 신뢰도를 갖춘 사이트로 만든다.

**Architecture:** 정적 콘텐츠 페이지(FAQ/Contact/About)는 Next.js Server Component. Accordion 등 인터랙션은 별도 Client Component로 분리. 가이드 콘텐츠는 Supabase `articles` 테이블에 SQL 삽입.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase

---

## Phase A: 페이지 추가

### A-1. FAQ 페이지 (`/faq`)

**파일:**
- `src/app/faq/page.tsx` — Server Component, `export const metadata` 포함
- `src/components/faq/FaqAccordion.tsx` — `'use client'` Accordion 컴포넌트

**구현 방식:**
- `page.tsx`는 Server Component로 메타데이터 + 정적 데이터 보유
- FAQ 데이터는 `page.tsx` 내 상수 배열로 정의하여 `FaqAccordion`에 props로 전달
- `FaqAccordion`은 shadcn/ui `Accordion` 컴포넌트(`AccordionItem`, `AccordionTrigger`, `AccordionContent`) 사용
- 카테고리별 `<section>` 구분, 단일 페이지에 모두 표시

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

### A-2. About 페이지 (`/about`)

**파일:** `src/app/about/page.tsx` — Server Component

**포함 내용:**
- 서비스 소개: 청약마당이 무엇인지, 누가 만든 비공식 정보 서비스인지 명확히 기술
- 데이터 출처: 한국부동산원 청약홈 공공데이터 API 활용 명시
- 면책 고지: "실제 청약 신청은 반드시 청약홈(applyhome.co.kr)에서 확인하세요"
- 업데이트 주기: 매일 자동 동기화
- 문의: contact@example.com 링크

---

### A-3. Contact 페이지 (`/contact`)

**파일:** `src/app/contact/page.tsx` — Server Component

**포함 내용:**
- 이메일 주소 (mailto 링크)
- 오류 신고, 데이터 이의제기, 제휴 문의 안내
- 응답 소요 시간 안내

---

### A-4. ads.txt

**파일:** `public/ads.txt`

**형식 (Google 공식):**
```
google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

- `ca-pub-XXXX`가 아닌 `pub-XXXX` 형식 사용
- AdSense 승인 후 대시보드의 실제 Publisher ID로 교체
- 배포 후 `https://your-domain.com/ads.txt` 접근 확인 필수

---

### A-5. 푸터 네비게이션 업데이트

**파일:** `src/components/layout/Footer.tsx` (수정)

현재 푸터에 없거나 불완전한 링크 추가:
- `/faq` — 자주 묻는 질문
- `/about` — 서비스 소개
- `/contact` — 문의하기
- `/privacy` — 개인정보처리방침 (이미 있음)
- `/terms` — 이용약관 (이미 있음)

---

## Phase B: 가이드 콘텐츠 (Supabase SQL)

**대상 테이블:** `articles` (기존 스키마)
**필드:** `slug, title, summary, body (HTML), category='guide', published_at, updated_at`

### 콘텐츠 품질 기준

모든 글에 필수 포함:
- `<p class="text-xs text-gray-400">최종 업데이트: YYYY-MM-DD · 출처: 청약홈, 국토교통부</p>`
- 본문 말미 면책 고지: "본 내용은 참고용이며 실제 청약 신청 전 반드시 청약홈 공식 공고문을 확인하세요."

**핵심 5개 (1,500~2,500자, 예시·체크리스트·계산법 포함):**

1. `apt-subscription-intro` — 아파트 청약 완전 입문 가이드
   - 청약의 개념, 청약통장 종류, 1순위 요건, 신청 방법 단계별 설명
   - 체크리스트: "나는 청약 신청이 가능한가?" 항목별 점검

2. `apt-score-calculation` — 청약 가점 계산법 완벽 정리
   - 3개 항목(무주택 기간 32점 + 부양가족 35점 + 청약통장 가입기간 17점) 상세
   - 실제 계산 예시: "35세 직장인, 부모 부양, 통장 7년" 케이스
   - 가점 구간별 당첨 가능 지역 가이드

3. `special-supply-types` — 특별공급 종류와 신청 조건 총정리
   - 신혼부부/생애최초/다자녀/노부모부양/기관추천 각각 자격 요건 표로 정리
   - 일반공급과의 중복 신청 가능 여부

4. `priority-one-conditions` — 청약 1순위 조건과 지역별 차이
   - 투기과열지구 / 조정대상지역 / 비규제지역별 1순위 요건 비교표
   - 세대주 요건, 재당첨 제한 기간

5. `seoul-subscription-strategy` — 서울·수도권 청약 전략 가이드
   - 가점 낮을 때 전략: 추첨제 비중 높은 단지 찾기
   - 특별공급 활용법
   - 경기·인천 틈새 공략법

**보통 10개 (700~1,000자, 정의·예시·출처 포함):**

6. `subscription-account-guide` — 청약통장 200% 활용법
7. `homeless-period-calc` — 무주택 기간 계산 방법
8. `lottery-vs-score` — 가점제 vs 추첨제 언제 어디에 적용되나
9. `newlywed-special-supply` — 신혼부부 특별공급 완벽 가이드
10. `first-home-special` — 생애최초 특별공급 자격과 신청법
11. `subscription-calendar-guide` — 청약 일정 보는 법과 캘린더 활용
12. `contract-process` — 청약 당첨 후 계약까지 단계별 가이드
13. `price-cap-system` — 분양가상한제란 무엇인가
14. `resale-restriction` — 전매제한 완벽 이해
15. `subscription-checklist` — 청약 신청 전 꼭 확인할 체크리스트

---

## Phase C: 기존 페이지 보강

### C-1. 데이터 페이지 설명문 추가

`/apply` 페이지 상단, `/region/[name]` 페이지에 간단한 설명 문구 추가.
"목록만 있는 얇은 페이지"처럼 보이지 않도록 서비스 소개 1~2줄 + 사용법 안내.

### C-2. SEO 메타데이터 확인

`sitemap.ts`에 새로 추가된 페이지(`/faq`, `/about`, `/contact`) 포함 확인.

---

## AdSense 심사 제출 전 체크리스트

- [ ] FAQ 페이지 (24문항, Server + Client 분리)
- [ ] About 페이지 (서비스 소개, 데이터 출처 명시)
- [ ] Contact 페이지 (이메일 표시)
- [ ] 개인정보처리방침 ✅
- [ ] 이용약관 ✅
- [ ] ads.txt (`pub-XXXX` 형식, 도메인 루트)
- [ ] 가이드 글 15개 (핵심 5개 1,500자+, 전체 출처·날짜·면책 포함)
- [ ] 푸터에 모든 정책/안내 페이지 링크
- [ ] sitemap.xml에 신규 페이지 포함
- [ ] 모바일 반응형 확인
- [ ] HTTPS 도메인 배포 완료

---

## 인프라 (AdSense 심사와 무관, 별도 진행)

Upstash Redis, Kakao Map, Vercel cron, Sentry는 서비스 품질 개선용이며 AdSense 승인 조건이 아님.
배포 후 별도 단계로 진행.
