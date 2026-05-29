# 청약마당 AdSense 콘텐츠 & 신뢰도 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google AdSense 심사 통과를 위한 FAQ·About·Contact 페이지 추가, ads.txt 생성, 가이드 콘텐츠 15개 Supabase 삽입, 기존 페이지 설명문 보강

**Architecture:** FAQ/About/Contact는 Next.js Server Component + `@base-ui/react` Accordion Client Component 분리. 가이드 콘텐츠는 Supabase SQL INSERT. 푸터·sitemap 업데이트.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, `@base-ui/react`, Supabase

---

## 파일 구성

| 파일 | 상태 |
|------|------|
| `src/components/faq/FaqAccordion.tsx` | 신규 |
| `src/app/faq/page.tsx` | 신규 |
| `src/app/about/page.tsx` | 신규 |
| `src/app/contact/page.tsx` | 신규 |
| `public/ads.txt` | 신규 |
| `src/components/layout/Footer.tsx` | 수정 |
| `src/app/sitemap.ts` | 수정 |
| `src/app/apply/page.tsx` | 수정 |
| `src/app/region/[name]/page.tsx` | 수정 |

---

### Task 1: FaqAccordion 클라이언트 컴포넌트

**Files:**
- Create: `src/components/faq/FaqAccordion.tsx`

- [ ] **Step 1: FaqAccordion 컴포넌트 생성**

```tsx
'use client'
import { Accordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  q: string
  a: string
}

export interface FaqCategory {
  title: string
  items: FaqItem[]
}

export default function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <section key={cat.title}>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{cat.title}</h2>
          <Accordion.Root className="divide-y border rounded-lg overflow-hidden">
            {cat.items.map((item, i) => (
              <Accordion.Item key={i} value={`${cat.title}-${i}`}>
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 [&[data-open]_svg]:rotate-180">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className="px-4 py-3 text-sm text-gray-600 leading-relaxed bg-gray-50 border-t">
                  {item.a}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit 2>&1
```
Expected: 출력 없음(에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/components/faq/FaqAccordion.tsx
git commit -m "feat: add FaqAccordion client component"
```

---

### Task 2: FAQ 페이지 (Server Component)

**Files:**
- Create: `src/app/faq/page.tsx`

- [ ] **Step 1: FAQ 페이지 생성**

```tsx
import type { Metadata } from 'next'
import FaqAccordion from '@/components/faq/FaqAccordion'
import type { FaqCategory } from '@/components/faq/FaqAccordion'

export const metadata: Metadata = {
  title: '자주 묻는 질문',
  description: '청약 1순위 조건, 가점 계산법, 특별공급 자격 등 청약마당 FAQ를 확인하세요.',
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: '청약 기본',
    items: [
      {
        q: '청약이란 무엇인가요?',
        a: '아파트 청약은 새로 짓는 아파트의 입주자를 모집하는 절차입니다. 건설사나 공공기관이 분양 공고를 내면, 청약 자격을 갖춘 사람이 신청해 가점이나 추첨으로 당첨자를 선발합니다. 당첨되면 시세보다 저렴하게 새 아파트를 살 기회를 얻습니다.',
      },
      {
        q: '청약통장이 없으면 청약을 못 하나요?',
        a: '네, 주택청약종합저축(청약통장)에 가입하고 일정 기간이 지나야 1순위 자격이 생깁니다. 아직 없다면 지금 바로 은행에서 개설하세요. 가입일이 기산점이 됩니다.',
      },
      {
        q: '청약 1순위 조건이 뭔가요?',
        a: '지역별로 다릅니다. 투기과열지구: 가입 24개월 이상·납입 24회 이상. 조정대상지역: 12개월·12회 이상. 기타 수도권: 12개월·12회. 기타 지방: 6개월·6회 이상. 세대주여야 하며, 세대원 중 5년 이내 당첨 이력이 없어야 합니다.',
      },
      {
        q: '청약 2순위도 당첨될 수 있나요?',
        a: '1순위 미달 시 2순위를 모집합니다. 인기 단지에서는 사실상 기회가 거의 없지만, 비인기 지역이나 잔여 세대는 2순위도 가능합니다.',
      },
      {
        q: '무주택자 기준이 어떻게 되나요?',
        a: '세대원 전원이 주택을 소유하지 않은 경우입니다. 만 60세 이상 직계존속(부모·조부모)이 주택을 보유한 경우는 예외적으로 무주택 세대원 수 산정에서 제외됩니다.',
      },
      {
        q: '청약 당첨 후 포기하면 어떻게 되나요?',
        a: '계약을 포기하면 재당첨 제한이 적용됩니다. 투기과열지구 10년, 조정대상지역 7년, 기타 지역 5년간 당첨이 제한됩니다. 신중하게 결정하세요.',
      },
    ],
  },
  {
    title: '가점제와 추첨제',
    items: [
      {
        q: '가점제와 추첨제 차이가 뭔가요?',
        a: '가점제는 무주택 기간·부양가족 수·청약통장 가입기간의 점수 합산으로 높은 순서대로 당첨자를 선발합니다. 추첨제는 자격만 갖추면 무작위 추첨으로 선발합니다. 85㎡ 이하는 가점제 비중이, 85㎡ 초과는 추첨제 비중이 높습니다.',
      },
      {
        q: '청약 가점 만점은 몇 점인가요?',
        a: '84점입니다. 무주택 기간 최대 32점, 부양가족 수 최대 35점, 청약통장 가입기간 최대 17점으로 구성됩니다.',
      },
      {
        q: '부양가족 수는 어떻게 계산하나요?',
        a: '신청자를 포함한 세대원 수에서 1을 뺀 값입니다. 예: 본인+배우자+자녀 2명=4명이면 부양가족 3명(20점). 부모를 부양가족으로 인정받으려면 주민등록상 동일 세대원이어야 합니다.',
      },
      {
        q: '무주택 기간은 언제부터 계산되나요?',
        a: '만 30세가 된 날(또는 혼인 신고일 중 빠른 날)부터 입주자모집공고일까지 계속 무주택인 기간입니다. 과거에 주택을 소유한 이력이 있으면 처분 후 다시 기산합니다.',
      },
      {
        q: '청약통장 가입 기간은 어떻게 계산하나요?',
        a: '최초 가입일부터 입주자모집공고일까지입니다. 은행을 옮겨도 최초 가입일 기준으로 계산됩니다. 17점 만점을 받으려면 15년 이상 가입해야 합니다.',
      },
      {
        q: '가점이 낮아도 당첨될 수 있나요?',
        a: '가능합니다. 85㎡ 초과 대형 평형이나 일부 지방 단지는 추첨제 비중이 높습니다. 또한 특별공급(신혼부부·생애최초 등)은 가점과 무관하게 자격만 갖추면 신청 가능합니다.',
      },
    ],
  },
  {
    title: '특별공급',
    items: [
      {
        q: '특별공급 종류에는 어떤 것들이 있나요?',
        a: '①신혼부부 ②생애최초 ③다자녀가구 ④노부모부양 ⑤기관추천 ⑥이전기관 종사자 총 6가지입니다. 각각 자격 요건이 다르므로 본인 해당 여부를 꼭 확인하세요.',
      },
      {
        q: '신혼부부 특별공급 조건이 뭔가요?',
        a: '혼인 7년 이내, 세대원 전원 무주택이어야 합니다. 자녀가 있으면 우선순위가 부여됩니다. 소득 기준: 도시근로자 월평균소득 130% 이하(맞벌이 140%). 자산 기준도 적용됩니다.',
      },
      {
        q: '생애최초 특별공급 자격은?',
        a: '세대원 전원이 생애 처음 주택을 구매하는 경우. 근로·사업소득이 있어야 하며, 소득 기준: 도시근로자 월평균소득 130% 이하. 공공주택은 100% 이하.',
      },
      {
        q: '다자녀 특별공급은 몇 명 이상인가요?',
        a: '미성년 자녀가 3명 이상인 가구에 해당합니다. 자녀 수가 많을수록 우선순위가 높으며, 일부 공공주택은 2명도 신청 가능한 경우가 있습니다.',
      },
      {
        q: '노부모 부양 특별공급 조건은?',
        a: '만 65세 이상 직계존속(배우자의 직계존속 포함)을 3년 이상 계속 부양한 세대주가 대상입니다. 전용 85㎡ 이하 국민주택 규모 주택에 적용됩니다.',
      },
      {
        q: '특별공급과 일반공급 중복 신청 가능한가요?',
        a: '같은 단지에서 특별공급과 일반공급을 동시에 신청하면 둘 다 무효 처리됩니다. 단, 서로 다른 단지에 각각 신청하는 것은 가능합니다.',
      },
    ],
  },
  {
    title: '청약 절차',
    items: [
      {
        q: '청약 신청은 어디서 하나요?',
        a: '청약홈(www.applyhome.co.kr)에서 온라인으로 신청합니다. 일부 단지는 은행 방문 신청도 가능하지만 대부분 온라인이 원칙입니다. 공인인증서 또는 공동인증서가 필요합니다.',
      },
      {
        q: '청약 일정은 어떻게 확인하나요?',
        a: '청약홈 > 청약일정 또는 청약마당의 청약 캘린더에서 확인하세요. 특별공급·1순위·2순위 접수일, 당첨자 발표일, 계약일을 미리 확인하는 게 중요합니다.',
      },
      {
        q: '당첨 후 계약까지 어떤 절차가 있나요?',
        a: '①당첨 발표 확인 → ②서류 제출(소득·자산·무주택 증명) → ③계약 체결(계약금 납부) → ④중도금 납부 → ⑤잔금 및 입주 순서로 진행됩니다. 서류 미제출 시 당첨이 취소될 수 있습니다.',
      },
      {
        q: '청약 당첨되면 기존 집을 팔아야 하나요?',
        a: '청약 유형에 따라 다릅니다. 가점제 1순위는 무주택 요건이 있어 당첨 전 처분이 필요한 경우가 있습니다. 반면 추첨제나 일부 대형 평형은 유주택자도 신청 가능합니다. 공고문을 반드시 확인하세요.',
      },
      {
        q: '분양가상한제가 뭔가요?',
        a: '정부가 아파트 분양 가격의 상한선을 정해 그 이하로만 분양하도록 하는 제도입니다. 투기 방지와 실수요자 보호가 목적이며, 주로 투기과열지구에 적용됩니다. 전매제한·실거주 의무가 함께 부여됩니다.',
      },
      {
        q: '전매제한이란 무엇인가요?',
        a: '당첨된 주택을 일정 기간 타인에게 팔거나 양도할 수 없는 제도입니다. 투기과열지구 최대 10년, 조정대상지역 최대 6년, 수도권 공공택지 3년이 적용됩니다. 위반 시 취득세 추징 등 불이익이 있습니다.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">자주 묻는 질문</h1>
        <p className="text-gray-500 mt-2 text-sm">
          청약 조건, 가점 계산, 특별공급 등 궁금한 사항을 확인하세요.
        </p>
      </div>
      <FaqAccordion categories={FAQ_DATA} />
      <p className="mt-10 text-xs text-gray-400 text-center">
        실제 청약 신청 전 반드시{' '}
        <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer" className="underline">
          청약홈
        </a>
        의 공식 공고문을 확인하세요.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit 2>&1
```
Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/faq/page.tsx
git commit -m "feat: add FAQ page with accordion UI"
```

---

### Task 3: About 페이지

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: About 페이지 생성**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '청약마당은 한국부동산원 청약홈 공공데이터를 활용한 분양 청약 정보 서비스입니다.',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">서비스 소개</h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">청약마당이란?</h2>
          <p>
            청약마당은 전국 아파트 분양 청약 정보를 한눈에 볼 수 있는 개인 운영 정보 서비스입니다.
            공식 기관이 아닌 비공식 정보 서비스로, 청약홈의 공공데이터를 가공하여 제공합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">데이터 출처</h2>
          <p>
            모든 분양 청약 데이터는{' '}
            <a
              href="https://www.applyhome.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              한국부동산원 청약홈
            </a>
            의 공공데이터 API를 통해 수집됩니다. 데이터는 매일 자동으로 동기화되며,
            공공데이터포털(data.go.kr)의 이용 약관을 준수합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제공 기능</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>전국 분양 청약 일정 및 정보 조회</li>
            <li>지역별 청약 현황 확인</li>
            <li>청약 캘린더 — 월별 청약 일정 시각화</li>
            <li>청약 가점 계산기 — 내 가점 직접 계산</li>
            <li>청약 가이드 — 입문부터 전략까지</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">면책 고지</h2>
          <p>
            본 서비스의 정보는 참고용이며, 실제 청약 신청 및 자격 확인은 반드시{' '}
            <a
              href="https://www.applyhome.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              청약홈(www.applyhome.co.kr)
            </a>
            의 공식 공고문을 기준으로 하세요. 청약 조건은 단지별·지역별로 다르며,
            공공 API 데이터 오류로 인한 손해에 대해 운영자는 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">문의</h2>
          <p>
            오류 신고나 문의사항은{' '}
            <a href="/contact" className="text-blue-600 underline">
              문의하기
            </a>
            페이지를 이용해 주세요.
          </p>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add About page"
```

---

### Task 4: Contact 페이지 + ads.txt

**Files:**
- Create: `src/app/contact/page.tsx`
- Create: `public/ads.txt`

- [ ] **Step 1: Contact 페이지 생성**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '문의하기',
  description: '청약마당 서비스 문의, 오류 신고, 데이터 이의제기',
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">문의하기</h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">이메일 문의</h2>
          <p>
            아래 이메일로 문의해 주세요. 보통 2~3 영업일 내 답변드립니다.
          </p>
          <p className="mt-2">
            <a
              href="mailto:contact@example.com"
              className="text-blue-600 underline text-base font-medium"
            >
              contact@example.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">문의 가능 사항</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>데이터 오류 신고 (잘못된 청약 정보)</li>
            <li>서비스 이용 중 오류 또는 버그 신고</li>
            <li>개인정보 처리 관련 이의제기</li>
            <li>콘텐츠 제휴 또는 광고 문의</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">참고</h2>
          <p>
            청약 자격·조건·일정에 대한 문의는 공식 기관을 이용해 주세요.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                청약홈 (www.applyhome.co.kr)
              </a>
            </li>
            <li>
              <a href="https://www.molit.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                국토교통부 (www.molit.go.kr)
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ads.txt 생성**

```
public/ads.txt 내용:
google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

주의: `pub-XXXXXXXXXXXXXXXXX` 자리에 AdSense 대시보드의 실제 Publisher ID를 입력. `ca-pub-` 접두사 제거하고 `pub-` 만 사용.

- [ ] **Step 3: 커밋**

```bash
git add src/app/contact/page.tsx public/ads.txt
git commit -m "feat: add Contact page and ads.txt"
```

---

### Task 5: Footer + Sitemap 업데이트

**Files:**
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Footer 수정**

현재 Footer 전체를 아래로 교체:

```tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8 text-sm text-gray-500">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          <Link href="/faq" className="hover:text-gray-800">자주 묻는 질문</Link>
          <Link href="/about" className="hover:text-gray-800">서비스 소개</Link>
          <Link href="/contact" className="hover:text-gray-800">문의하기</Link>
          <Link href="/privacy" className="hover:text-gray-800">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
        </div>
        <p>청약마당 | 이메일: contact@example.com</p>
        <p className="mt-1">
          본 사이트는 공공데이터포털 API를 활용합니다. 청약 정보는 반드시 청약홈(applyhome.co.kr)에서 확인하세요.
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: sitemap.ts에 신규 페이지 추가**

`src/app/sitemap.ts`의 `staticUrls` 배열에 아래 3개 항목 추가:

```ts
{ url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
{ url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
{ url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
```

- [ ] **Step 3: 타입 체크 + 커밋**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit 2>&1
git add src/components/layout/Footer.tsx src/app/sitemap.ts
git commit -m "feat: update footer navigation and sitemap with new pages"
```

---

### Task 6: 가이드 핵심 5개 SQL

**Files:** Supabase SQL Editor 실행

- [ ] **Step 1: articles 테이블 확인 후 핵심 5개 INSERT**

Supabase → SQL Editor에서 아래 실행:

```sql
-- articles 테이블이 없는 경우 생성
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,
  category text not null default 'guide',
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 핵심 가이드 1: 청약 완전 입문
insert into articles (slug, title, summary, body, category, published_at, updated_at) values (
'apt-subscription-intro',
'아파트 청약 완전 입문 가이드',
'청약 개념부터 통장 종류, 1순위 조건, 신청 절차까지 처음 청약을 준비하는 분을 위한 완전 입문 가이드입니다.',
$body1$<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약이란?</h2>
<p>아파트 청약은 새로 짓는 아파트의 입주자를 모집하는 절차입니다. 건설사나 공공기관이 분양 공고를 내면, 청약 자격을 갖춘 사람이 신청해 가점이나 추첨으로 당첨자를 선발합니다. 당첨되면 시세보다 저렴하게 새 아파트를 살 기회를 얻을 수 있습니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약통장 종류</h2>
<ul class="list-disc pl-6 space-y-2 text-sm">
<li><strong>주택청약종합저축</strong>: 2009년 5월 이후 신규 가입 가능. 국민주택·민영주택 모두 청약 가능. 현재 신규 가입 가능한 유일한 청약통장.</li>
<li><strong>청약저축</strong>: 국민주택 전용. 2015년 이후 신규 가입 불가.</li>
<li><strong>청약예금/부금</strong>: 민영주택 전용. 2015년 이후 신규 가입 불가.</li>
</ul>
<p class="mt-3">아직 통장이 없다면 지금 바로 은행에서 주택청약종합저축을 개설하세요. 가입일이 1순위 산정 기산점이 됩니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">1순위 자격 요건</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2 text-left">지역 구분</th><th class="border p-2">가입기간</th><th class="border p-2">납입횟수</th></tr></thead>
<tbody>
<tr><td class="border p-2">투기과열지구</td><td class="border p-2 text-center">24개월</td><td class="border p-2 text-center">24회</td></tr>
<tr><td class="border p-2">조정대상지역</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td></tr>
<tr><td class="border p-2">기타 수도권</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td></tr>
<tr><td class="border p-2">기타 지방</td><td class="border p-2 text-center">6개월</td><td class="border p-2 text-center">6회</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">청약 신청 가능 여부 체크리스트</h2>
<ul class="list-none space-y-2 text-sm">
<li>☐ 주택청약종합저축에 가입되어 있다</li>
<li>☐ 해당 지역 1순위 조건(가입기간·납입횟수)을 충족한다</li>
<li>☐ 세대주이다 (투기과열지구·조정지역 1순위 필수)</li>
<li>☐ 세대원 전원이 5년 이내 당첨 이력이 없다</li>
<li>☐ 무주택 세대주이다 (가점제 적용 시)</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">청약 신청 절차</h2>
<ol class="list-decimal pl-6 space-y-2 text-sm">
<li>청약홈(www.applyhome.co.kr) 회원 가입 및 공동인증서 등록</li>
<li>입주자모집공고 확인 — 공급 위치, 면적, 분양가, 일정 확인</li>
<li>청약 신청 기간 내 온라인 신청 (특별공급 → 1순위 → 2순위 순서)</li>
<li>당첨자 발표일 확인 (청약홈 또는 해당 단지 홈페이지)</li>
<li>당첨 시 서류 제출 및 계약 체결</li>
</ol>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">본 내용은 참고용이며 실제 청약 신청 전 반드시 <a href="https://www.applyhome.co.kr" class="underline">청약홈 공식 공고문</a>을 확인하세요. 청약 조건은 단지별·지역별로 다를 수 있습니다.</div>$body1$,
'guide', now(), now()
);

-- 핵심 가이드 2: 가점 계산법
insert into articles (slug, title, summary, body, category, published_at, updated_at) values (
'apt-score-calculation',
'청약 가점 계산법 완벽 정리',
'무주택 기간 32점, 부양가족 35점, 청약통장 17점. 84점 만점 청약 가점 계산법과 실제 예시를 정리했습니다.',
$body2$<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약 가점 구성 (만점 84점)</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2 text-left">항목</th><th class="border p-2">최대 점수</th><th class="border p-2 text-left">계산 기준</th></tr></thead>
<tbody>
<tr><td class="border p-2">무주택 기간</td><td class="border p-2 text-center">32점</td><td class="border p-2">만 30세 이후 무주택 기간 (1년당 2점)</td></tr>
<tr><td class="border p-2">부양가족 수</td><td class="border p-2 text-center">35점</td><td class="border p-2">0명=5점, 1명=10점, 2명=15점, 3명=20점, 4명=25점, 5명=30점, 6명이상=35점</td></tr>
<tr><td class="border p-2">청약통장 가입기간</td><td class="border p-2 text-center">17점</td><td class="border p-2">6개월미만=1점, 1년=2점, 2년=3점 … 15년이상=17점</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">무주택 기간 점수 상세</h2>
<p>만 30세가 된 날(또는 혼인 신고일 중 빠른 날)부터 청약 공고일까지 계속 무주택인 기간을 계산합니다. 과거에 집을 소유한 적이 있으면 처분 후 다시 기산합니다.</p>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2">무주택 기간</th><th class="border p-2">점수</th></tr></thead>
<tbody>
<tr><td class="border p-2">1년 미만</td><td class="border p-2 text-center">2점</td></tr>
<tr><td class="border p-2">1~2년</td><td class="border p-2 text-center">4점</td></tr>
<tr><td class="border p-2">3~4년</td><td class="border p-2 text-center">8점</td></tr>
<tr><td class="border p-2">7~8년</td><td class="border p-2 text-center">16점</td></tr>
<tr><td class="border p-2">15년 이상</td><td class="border p-2 text-center">32점 (만점)</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">실제 계산 예시</h2>
<div class="bg-blue-50 border border-blue-200 rounded p-4 text-sm mt-2">
<p class="font-semibold mb-2">📊 케이스: 35세 직장인, 부모 동거 부양, 청약통장 7년</p>
<ul class="space-y-1">
<li>• 무주택 기간: 만 30세부터 5년 → <strong>10점</strong></li>
<li>• 부양가족: 배우자 + 부모 2명 = 3명 → <strong>20점</strong></li>
<li>• 청약통장: 7년 → <strong>8점</strong></li>
<li class="font-bold mt-2 text-blue-700">총 가점: 38점</li>
</ul>
<p class="mt-2 text-gray-500 text-xs">서울 인기 단지 커트라인이 60점대 이상임을 감안하면, 추첨제 비중 높은 단지나 수도권 외곽·지방을 공략하는 전략이 현실적입니다.</p>
</div>
<h2 class="text-xl font-bold mt-6 mb-3">가점 구간별 전략</h2>
<ul class="list-disc pl-6 space-y-2 text-sm">
<li><strong>70점 이상</strong>: 서울 주요 지역 가점제 1순위 당첨 가능권</li>
<li><strong>50~69점</strong>: 경기·인천 수도권 또는 서울 외곽 단지 도전</li>
<li><strong>30~49점</strong>: 지방 광역시, 추첨제 비중 높은 85㎡ 초과 평형</li>
<li><strong>30점 미만</strong>: 특별공급(생애최초·신혼부부) 또는 추첨제 집중 공략</li>
</ul>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">본 내용은 참고용이며 실제 가점은 청약홈 가점 계산기 또는 공식 공고문을 기준으로 하세요.</div>$body2$,
'guide', now(), now()
);

-- 핵심 가이드 3: 특별공급 총정리
insert into articles (slug, title, summary, body, category, published_at, updated_at) values (
'special-supply-types',
'특별공급 종류와 신청 조건 총정리',
'신혼부부, 생애최초, 다자녀, 노부모부양 등 6가지 특별공급의 자격 요건을 표로 정리했습니다.',
$body3$<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">특별공급이란?</h2>
<p>특별공급은 일반 청약 경쟁에서 불리한 계층(신혼부부, 다자녀가구 등)을 위해 별도 물량을 배정하는 제도입니다. 가점과 관계없이 해당 자격만 갖추면 신청할 수 있습니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">특별공급 종류별 자격 요건</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2 text-left">유형</th><th class="border p-2 text-left">주요 자격</th><th class="border p-2 text-left">소득 기준</th></tr></thead>
<tbody>
<tr><td class="border p-2 font-medium">신혼부부</td><td class="border p-2">혼인 7년 이내, 전원 무주택</td><td class="border p-2">월평균소득 130%(맞벌이 140%) 이하</td></tr>
<tr><td class="border p-2 font-medium">생애최초</td><td class="border p-2">생애 최초 주택 구매, 근로·사업소득 있어야 함</td><td class="border p-2">월평균소득 130% 이하</td></tr>
<tr><td class="border p-2 font-medium">다자녀가구</td><td class="border p-2">미성년 자녀 3명 이상</td><td class="border p-2">일부 단지 소득 기준 있음</td></tr>
<tr><td class="border p-2 font-medium">노부모부양</td><td class="border p-2">만 65세 이상 직계존속 3년 이상 부양</td><td class="border p-2">없음 (공공주택 제외)</td></tr>
<tr><td class="border p-2 font-medium">기관추천</td><td class="border p-2">국가유공자, 장애인, 철거민 등</td><td class="border p-2">기관별 상이</td></tr>
<tr><td class="border p-2 font-medium">이전기관</td><td class="border p-2">혁신도시 이전 공공기관 종사자</td><td class="border p-2">없음</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">신혼부부 특별공급 상세</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>혼인 7년 이내 (사실혼 포함, 혼인 신고일 기준)</li>
<li>세대원 전원 무주택 (혼인 전 주택 소유 시 불가)</li>
<li>자녀 있으면 우선공급 → 일반공급 순서</li>
<li>소득 기준: 도시근로자 가구원수별 월평균소득 130%(맞벌이 140%) 이하</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">일반공급과 중복 신청</h2>
<p>같은 단지에서 특별공급과 일반공급에 동시 신청하면 <strong>둘 다 무효</strong>입니다. 서로 다른 단지에 각각 신청하는 것은 가능합니다.</p>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">자격 기준은 단지 및 주택 유형(공공·민영)에 따라 다를 수 있으므로 공고문을 반드시 확인하세요.</div>$body3$,
'guide', now(), now()
);

-- 핵심 가이드 4: 1순위 조건 지역별 차이
insert into articles (slug, title, summary, body, category, published_at, updated_at) values (
'priority-one-conditions',
'청약 1순위 조건과 지역별 차이 완전 정리',
'투기과열지구, 조정대상지역, 비규제지역별 청약 1순위 자격 요건과 세대주 조건을 비교합니다.',
$body4$<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">지역별 1순위 요건 비교</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2 text-left">지역 구분</th><th class="border p-2">가입기간</th><th class="border p-2">납입횟수</th><th class="border p-2">세대주</th><th class="border p-2">무주택</th></tr></thead>
<tbody>
<tr><td class="border p-2 font-medium">투기과열지구</td><td class="border p-2 text-center">24개월</td><td class="border p-2 text-center">24회</td><td class="border p-2 text-center">필수</td><td class="border p-2 text-center">필수 (85㎡↓)</td></tr>
<tr><td class="border p-2 font-medium">조정대상지역</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td><td class="border p-2 text-center">필수</td><td class="border p-2 text-center">필수 (85㎡↓)</td></tr>
<tr><td class="border p-2 font-medium">수도권 기타</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td><td class="border p-2 text-center">불요</td><td class="border p-2 text-center">불요</td></tr>
<tr><td class="border p-2 font-medium">지방 기타</td><td class="border p-2 text-center">6개월</td><td class="border p-2 text-center">6회</td><td class="border p-2 text-center">불요</td><td class="border p-2 text-center">불요</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">투기과열지구란?</h2>
<p>주택 가격 상승 우려가 있는 지역을 국토교통부가 지정합니다. 2025년 기준 서울 전 지역이 투기과열지구에 해당합니다. 이 지역은 청약 요건이 가장 까다롭고, 재당첨 제한 기간도 10년으로 가장 깁니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">재당첨 제한 기간</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>투기과열지구: 당첨일로부터 <strong>10년</strong></li>
<li>조정대상지역: <strong>7년</strong></li>
<li>수도권 기타: <strong>5년</strong></li>
<li>지방 기타: <strong>5년</strong></li>
<li>분양가상한제 적용 주택: <strong>10년</strong></li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">실전 팁</h2>
<ul class="list-disc pl-6 space-y-2 text-sm">
<li>세대주가 아닌 경우 비규제지역 또는 85㎡ 초과 추첨제 물량을 노리세요.</li>
<li>재당첨 제한 기간 중에도 세대원이 청약하는 것은 가능합니다 (단, 세대원 당첨 이력이 없어야 함).</li>
<li>지역 지정 여부는 국토교통부 홈페이지에서 최신 고시 내용을 확인하세요.</li>
</ul>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">규제지역 지정·해제는 수시로 변경됩니다. 청약 전 반드시 최신 공고문을 확인하세요.</div>$body4$,
'guide', now(), now()
);

-- 핵심 가이드 5: 서울·수도권 청약 전략
insert into articles (slug, title, summary, body, category, published_at, updated_at) values (
'seoul-subscription-strategy',
'서울·수도권 청약 전략 가이드',
'가점 낮아도 서울·수도권에서 청약 당첨되는 현실적인 전략. 추첨제, 특별공급, 틈새 지역을 분석합니다.',
$body5$<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">서울 청약의 현실</h2>
<p>서울 인기 단지 85㎡ 이하 가점제 커트라인은 보통 60~75점입니다. 30~40대 평균 가점이 30~45점 수준임을 감안하면, 가점제로 서울 인기 단지에 당첨되기는 매우 어렵습니다. 그러나 다음 전략으로 기회를 찾을 수 있습니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">전략 1: 추첨제 비중 높은 면적 공략</h2>
<p>전용면적 85㎡ 초과 중·대형 평형은 추첨제 비중이 50~100%입니다. 가점이 낮아도 추첨으로 당첨 가능합니다.</p>
<ul class="list-disc pl-6 space-y-1 text-sm mt-2">
<li>85~102㎡: 추첨제 50%</li>
<li>102㎡ 초과: 추첨제 100%</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">전략 2: 특별공급 활용</h2>
<ul class="list-disc pl-6 space-y-2 text-sm">
<li><strong>신혼부부</strong>: 혼인 7년 이내라면 반드시 검토. 일반공급 경쟁률보다 낮은 경우 많음.</li>
<li><strong>생애최초</strong>: 소득 기준 맞으면 일반공급 대비 경쟁률 유리.</li>
<li>특별공급 물량은 전체 공급의 40~50%로, 가점제 경쟁을 피할 수 있음.</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">전략 3: 경기·인천 틈새 공략</h2>
<ul class="list-disc pl-6 space-y-2 text-sm">
<li><strong>3기 신도시</strong>(하남교산·남양주왕숙·인천계양 등): 공공분양으로 시세 대비 저렴.</li>
<li><strong>GTX 연선</strong>: 개통 예정 노선 인근 단지 선제 공략.</li>
<li><strong>인천 서구·경기 평택</strong>: 상대적으로 경쟁률 낮고 가점 커트라인 낮음.</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">전략 4: 조합원 취소분·잔여 세대</h2>
<p>인기 단지에서 조합원 계약 포기나 자격 미달로 잔여 세대가 나오는 경우가 있습니다. 경쟁이 상대적으로 낮을 수 있으며, 청약홈 공지를 수시로 확인하는 게 중요합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">나에게 맞는 전략 찾기</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2">상황</th><th class="border p-2 text-left">추천 전략</th></tr></thead>
<tbody>
<tr><td class="border p-2 text-center">가점 30점 미만</td><td class="border p-2">특별공급 + 추첨제 대형 평형 + 경기 외곽</td></tr>
<tr><td class="border p-2 text-center">가점 30~50점</td><td class="border p-2">경기·인천 가점제 + 추첨제 병행</td></tr>
<tr><td class="border p-2 text-center">신혼부부</td><td class="border p-2">신혼부부 특공 최우선, 생애최초 병행</td></tr>
<tr><td class="border p-2 text-center">가점 50점 이상</td><td class="border p-2">서울 외곽·경기 주요 지역 가점제 1순위 도전</td></tr>
</tbody></table>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약 전략은 개인 상황과 시장 변화에 따라 달라집니다. 실제 신청 전 최신 공고문과 청약홈 안내를 반드시 확인하세요.</div>$body5$,
'guide', now(), now()
);
```

- [ ] **Step 2: 삽입 확인**

Supabase → SQL Editor:
```sql
select slug, title, length(body) as body_length from articles where category = 'guide' order by published_at;
```
Expected: 5행, body_length 각 1000 이상

---

### Task 7: 가이드 나머지 10개 SQL

**Files:** Supabase SQL Editor 실행

- [ ] **Step 1: 나머지 10개 INSERT 실행**

```sql
insert into articles (slug, title, summary, body, category, published_at, updated_at) values
('subscription-account-guide', '청약통장 200% 활용법', '청약통장 납입 금액, 전환 방법, 소득공제 혜택까지 청약통장을 최대한 활용하는 방법을 알아봅니다.',
$b6$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약통장 납입 전략</h2>
<p>주택청약종합저축은 매월 2만~50만원을 자유롭게 납입할 수 있습니다. 가점 최대화를 위해 꾸준히 납입하는 것이 중요합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">얼마를 넣어야 할까?</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li><strong>국민주택 청약</strong>: 지역별 예치금 기준 충족 필요 (서울 85㎡ 이하 300만원)</li>
<li><strong>민영주택 청약</strong>: 납입 횟수(가점)가 중요, 금액보다 횟수 우선</li>
<li>권장: 월 10만원 이상 꾸준히 납입</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">소득공제 혜택</h2>
<p>무주택 세대주는 연간 납입액의 40%(최대 300만원, 소득공제 120만원)를 소득공제 받을 수 있습니다. 연말정산 시 반드시 챙기세요.</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약통장 유지 주의사항</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>해지 시 가입 이력 소멸 — 절대 해지 금지</li>
<li>타 은행 이전은 가입 이력 유지되므로 가능</li>
<li>명의 변경 불가</li>
</ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약통장 예치금 기준은 지역 및 주택 유형에 따라 다르니 청약홈 공고문을 확인하세요.</div>$b6$,
'guide', now() - interval '1 day', now() - interval '1 day'),

('homeless-period-calc', '무주택 기간 계산 방법', '청약 가점에서 가장 중요한 무주택 기간 — 언제부터 계산되고, 주택 처분 후 어떻게 달라지는지 정리합니다.',
$b7$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">무주택 기간 기산점</h2>
<p>무주택 기간은 다음 중 가장 늦은 날부터 계산됩니다: ①만 30세가 된 날 ②혼인 신고일. 즉, 30세 미만에 결혼했다면 혼인 신고일부터, 30세 이후 결혼이라면 만 30세 생일부터 기산합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">주택 처분 후 재기산</h2>
<p>과거에 주택을 소유한 적이 있다면 처분(등기 이전)한 날부터 다시 기산합니다. 상속받은 주택을 즉시 처분한 경우 처분일 기준으로 계산합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">무주택 기간 점수표</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2">기간</th><th class="border p-2">점수</th></tr></thead>
<tbody>
<tr><td class="border p-2">1년 미만</td><td class="border p-2 text-center">2점</td></tr>
<tr><td class="border p-2">3년</td><td class="border p-2 text-center">8점</td></tr>
<tr><td class="border p-2">5년</td><td class="border p-2 text-center">10점</td></tr>
<tr><td class="border p-2">10년</td><td class="border p-2 text-center">22점</td></tr>
<tr><td class="border p-2">15년 이상</td><td class="border p-2 text-center">32점</td></tr>
</tbody></table>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">무주택 확인은 청약홈 또는 주택소유확인 시스템에서 가능합니다.</div>$b7$,
'guide', now() - interval '2 days', now() - interval '2 days'),

('lottery-vs-score', '가점제 vs 추첨제 — 언제 어디에 적용되나', '청약 가점이 낮아도 당첨될 수 있는 추첨제 물량과 적용 기준을 정리합니다.',
$b8$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">가점제 vs 추첨제 기준</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2 text-left">면적</th><th class="border p-2">투기과열지구</th><th class="border p-2">조정대상지역</th><th class="border p-2">기타</th></tr></thead>
<tbody>
<tr><td class="border p-2">85㎡ 이하</td><td class="border p-2 text-center">가점 100%</td><td class="border p-2 text-center">가점 75%</td><td class="border p-2 text-center">가점 40%</td></tr>
<tr><td class="border p-2">85~102㎡</td><td class="border p-2 text-center">추첨 50%</td><td class="border p-2 text-center">추첨 70%</td><td class="border p-2 text-center">추첨 70%</td></tr>
<tr><td class="border p-2">102㎡ 초과</td><td class="border p-2 text-center">추첨 100%</td><td class="border p-2 text-center">추첨 100%</td><td class="border p-2 text-center">추첨 100%</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">추첨제 활용 전략</h2>
<p>가점이 30점 미만이라면 가점제 경쟁에서 불리합니다. 대신 ①85㎡ 초과 대형 평형의 추첨제 물량 ②비규제지역의 추첨제 비중 높은 단지를 노리면 당첨 가능성을 높일 수 있습니다.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">추첨제 비율은 단지 공고마다 상이하므로 입주자모집공고를 확인하세요.</div>$b8$,
'guide', now() - interval '3 days', now() - interval '3 days'),

('newlywed-special-supply', '신혼부부 특별공급 완벽 가이드', '혼인 7년 이내라면 반드시 챙겨야 할 신혼부부 특별공급. 자격·소득 기준·신청 방법을 정리합니다.',
$b9$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">신청 자격</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>혼인 신고일로부터 7년 이내 (입주자모집공고일 기준)</li>
<li>세대원 전원 무주택</li>
<li>만 19세 이상</li>
<li>소득 기준 충족 (아래 표 참조)</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">소득 기준 (2024년 기준)</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2">구분</th><th class="border p-2">소득 기준</th></tr></thead>
<tbody>
<tr><td class="border p-2">외벌이</td><td class="border p-2">도시근로자 월평균소득 130% 이하</td></tr>
<tr><td class="border p-2">맞벌이</td><td class="border p-2">도시근로자 월평균소득 140% 이하</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">우선순위</h2>
<p>1순위: 자녀(태아 포함)가 있는 신혼부부 → 2순위: 자녀 없는 신혼부부 · 예비 신혼부부(혼인 예정자)</p>
<h2 class="text-xl font-bold mt-6 mb-3">신청 방법</h2>
<p>청약홈(www.applyhome.co.kr) 특별공급 메뉴에서 신청. 소득 증명 서류(건강보험료 납부확인서 등) 준비 필요.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">소득 기준은 매년 변경될 수 있으므로 공고문 기준 소득 기준표를 반드시 확인하세요.</div>$b9$,
'guide', now() - interval '4 days', now() - interval '4 days'),

('first-home-special', '생애최초 특별공급 자격과 신청법', '태어나서 처음 집을 사는 분을 위한 생애최초 특별공급. 자격 요건과 소득 기준을 정리합니다.',
$b10$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">신청 자격</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>세대원 전원이 생애 처음 주택을 구입하는 경우</li>
<li>근로자 또는 자영업자 (소득 있어야 함)</li>
<li>입주자모집공고일 기준 5년 이상 소득세를 납부한 자</li>
<li>소득 기준: 도시근로자 월평균소득 130% 이하 (공공주택 100%)</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">주의사항</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>과거 분양권을 취득한 경우도 주택 소유로 간주될 수 있음</li>
<li>세대원 중 한 명이라도 과거 주택 소유 이력이 있으면 불가</li>
<li>상속받은 주택 즉시 처분 시 예외 인정 가능 (공고문 확인)</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">신청 절차</h2>
<ol class="list-decimal pl-6 space-y-1 text-sm">
<li>청약홈 로그인 → 생애최초 특별공급 신청</li>
<li>소득 증빙 서류 제출 (건강보험료 납부확인서, 소득세 납부 확인)</li>
<li>당첨자 발표 후 자격 서류 제출</li>
</ol>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">생애최초 자격 판단 기준이 복잡할 수 있으니 청약홈 고객센터(1644-7445)에 문의하거나 공고문을 직접 확인하세요.</div>$b10$,
'guide', now() - interval '5 days', now() - interval '5 days'),

('subscription-calendar-guide', '청약 일정 보는 법과 캘린더 활용', '청약 일정표에서 특별공급일, 1순위일, 당첨 발표일을 읽는 방법과 청약마당 캘린더 활용법.',
$b11$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약 일정 구조</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2">일정</th><th class="border p-2 text-left">내용</th></tr></thead>
<tbody>
<tr><td class="border p-2 text-center">모집공고일</td><td class="border p-2">공고 게시, 이날부터 공고문 확인 가능</td></tr>
<tr><td class="border p-2 text-center">특별공급일</td><td class="border p-2">신혼부부·생애최초 등 특별공급 접수</td></tr>
<tr><td class="border p-2 text-center">1순위 접수일</td><td class="border p-2">해당 지역 1순위 접수 (1~2일)</td></tr>
<tr><td class="border p-2 text-center">2순위 접수일</td><td class="border p-2">1순위 미달 시 2순위 접수</td></tr>
<tr><td class="border p-2 text-center">당첨자 발표</td><td class="border p-2">청약홈에서 확인 가능</td></tr>
<tr><td class="border p-2 text-center">계약일</td><td class="border p-2">지정 장소에서 계약 (2~3일간)</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">청약마당 캘린더 활용법</h2>
<p>청약마당의 <a href="/calendar" class="text-blue-600 underline">청약 캘린더</a>에서 이달의 청약 일정을 한눈에 확인할 수 있습니다. 공고일, 접수일, 발표일이 색상별로 표시됩니다.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약 일정은 사업 주체 사정에 따라 변경될 수 있습니다. 청약홈 공고를 최종 기준으로 하세요.</div>$b11$,
'guide', now() - interval '6 days', now() - interval '6 days'),

('contract-process', '청약 당첨 후 계약까지 단계별 가이드', '청약 당첨 발표부터 서류 제출, 계약, 중도금, 입주까지 전 과정을 단계별로 정리합니다.',
$b12$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈</p>
<h2 class="text-xl font-bold mt-6 mb-3">당첨 후 전체 프로세스</h2>
<ol class="list-decimal pl-6 space-y-3 text-sm">
<li><strong>당첨 확인</strong>: 청약홈 로그인 → 청약 결과 조회. 문자로도 통보됩니다.</li>
<li><strong>서류 제출</strong>: 당첨 후 3~5일 내 지정 장소에 자격 서류 제출. 무주택 확인서, 소득 증명, 주민등록등본 등 필요. 서류 미제출 시 당첨 취소.</li>
<li><strong>계약 체결</strong>: 지정 날짜·장소에서 계약서 작성 및 계약금(분양가의 10~20%) 납부.</li>
<li><strong>중도금 납부</strong>: 공정률에 따라 6회 분할 납부 (보통 분양가의 60%). 중도금 대출 여부 사전 확인 필요.</li>
<li><strong>잔금 납부 및 입주</strong>: 준공 후 잔금(분양가의 20~30%) 납부 후 입주.</li>
</ol>
<h2 class="text-xl font-bold mt-6 mb-3">주의사항</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>계약 포기 시 재당첨 제한 5~10년 적용</li>
<li>중도금 대출 규제 지역별 LTV 확인 필요</li>
<li>입주 전 잔금 미납 시 계약 해지 가능</li>
</ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">계약 일정 및 서류는 단지마다 다르므로 담당 분양사무소에 직접 문의하세요.</div>$b12$,
'guide', now() - interval '7 days', now() - interval '7 days'),

('price-cap-system', '분양가상한제란 무엇인가', '분양가상한제의 개념, 적용 지역, 전매제한·실거주 의무와의 관계를 알기 쉽게 설명합니다.',
$b13$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">분양가상한제란?</h2>
<p>정부가 아파트 분양가의 상한선을 정해, 그 이하로만 분양하도록 강제하는 제도입니다. 투기 억제와 실수요자 보호가 목적입니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">적용 지역</h2>
<p>2025년 기준 서울 전 지역과 일부 경기 지역이 분양가상한제 적용 지역입니다. 국토교통부 고시로 지정·해제됩니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">분양가상한제 적용 시 따라오는 규제</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li><strong>전매 제한</strong>: 최대 10년간 거래 불가</li>
<li><strong>실거주 의무</strong>: 당첨자가 직접 거주해야 하는 기간 (2~5년)</li>
<li><strong>재당첨 제한</strong>: 10년</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">장단점</h2>
<p><strong>장점</strong>: 시세 대비 저렴한 가격에 신축 아파트 취득 가능.<br><strong>단점</strong>: 전매 제한으로 단기 매도 불가, 실거주 의무 이행 필수.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">분양가상한제 적용 여부는 입주자모집공고에 명시됩니다. 공고문을 반드시 확인하세요.</div>$b13$,
'guide', now() - interval '8 days', now() - interval '8 days'),

('resale-restriction', '전매제한 완벽 이해', '전매제한이란 무엇인지, 지역별 기간, 위반 시 불이익, 예외 사항까지 정리합니다.',
$b14$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">전매제한이란?</h2>
<p>청약에 당첨된 주택을 일정 기간 동안 타인에게 팔거나 양도할 수 없도록 제한하는 제도입니다. 투기 방지와 실수요자 보호가 목적입니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">지역별 전매제한 기간</h2>
<table class="w-full border-collapse text-sm mt-2">
<thead><tr class="bg-gray-100"><th class="border p-2 text-left">지역</th><th class="border p-2">기간</th></tr></thead>
<tbody>
<tr><td class="border p-2">투기과열지구 (서울 등)</td><td class="border p-2 text-center">최대 10년</td></tr>
<tr><td class="border p-2">조정대상지역</td><td class="border p-2 text-center">최대 6년</td></tr>
<tr><td class="border p-2">수도권 공공택지</td><td class="border p-2 text-center">3년</td></tr>
<tr><td class="border p-2">분양가상한제 적용</td><td class="border p-2 text-center">최대 10년</td></tr>
</tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">위반 시 불이익</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>계약 취소 및 분양가로 환수</li>
<li>취득세 추징</li>
<li>1년 이하 징역 또는 1천만원 이하 벌금</li>
</ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">전매제한 기간은 입주자모집공고에 명시됩니다. 반드시 공고문 기준으로 확인하세요.</div>$b14$,
'guide', now() - interval '9 days', now() - interval '9 days'),

('subscription-checklist', '청약 신청 전 꼭 확인할 체크리스트', '청약 실수를 막기 위한 단계별 체크리스트. 공고 확인부터 서류 준비까지.',
$b15$<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약 전 필수 확인사항</h2>
<h3 class="font-semibold mt-4 mb-2">1. 자격 확인</h3>
<ul class="list-none space-y-1 text-sm">
<li>☐ 청약통장 1순위 요건(가입기간·납입횟수) 충족 여부</li>
<li>☐ 세대주 여부 (해당 지역 필수인 경우)</li>
<li>☐ 세대원 전원 무주택 여부</li>
<li>☐ 5년 이내 당첨 이력 없음</li>
<li>☐ 특별공급 해당 자격 여부</li>
</ul>
<h3 class="font-semibold mt-4 mb-2">2. 공고문 확인</h3>
<ul class="list-none space-y-1 text-sm">
<li>☐ 공급 면적과 분양가 확인</li>
<li>☐ 청약 일정 (접수일, 당첨 발표일, 계약일)</li>
<li>☐ 전매제한 기간 확인</li>
<li>☐ 실거주 의무 여부</li>
<li>☐ 중도금 대출 가능 여부 및 조건</li>
</ul>
<h3 class="font-semibold mt-4 mb-2">3. 서류 준비</h3>
<ul class="list-none space-y-1 text-sm">
<li>☐ 주민등록등본 (전 세대원 포함)</li>
<li>☐ 가족관계증명서</li>
<li>☐ 건강보험료 납부확인서 (특별공급)</li>
<li>☐ 혼인관계증명서 (신혼부부 특공)</li>
<li>☐ 청약통장 가입확인서</li>
</ul>
<h3 class="font-semibold mt-4 mb-2">4. 자금 계획</h3>
<ul class="list-none space-y-1 text-sm">
<li>☐ 계약금 (분양가의 10~20%) 준비 여부</li>
<li>☐ 중도금 대출 사전 심사</li>
<li>☐ 잔금 마련 계획</li>
</ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약은 한 번의 실수로 수년간 재도전 기회가 막힐 수 있습니다. 신청 전 공고문을 반드시 꼼꼼히 읽으세요.</div>$b15$,
'guide', now() - interval '10 days', now() - interval '10 days');
```

- [ ] **Step 2: 전체 확인**

```sql
select slug, title, length(body) as body_len from articles where category = 'guide' order by published_at desc;
```
Expected: 15행, 모두 body_len > 500

---

### Task 8: Apply·Region 페이지 설명문 + 최종 빌드

**Files:**
- Modify: `src/app/apply/page.tsx`
- Modify: `src/app/region/[name]/page.tsx`

- [ ] **Step 1: apply/page.tsx 설명문 추가**

`<p className="text-gray-500 text-sm mb-4">` 아래에 아래 문구 추가:

```tsx
<p className="text-gray-400 text-xs mb-4">
  한국부동산원 청약홈 공공데이터 기준. 실제 청약 신청은{' '}
  <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer" className="underline">
    청약홈
  </a>
  에서 하세요.
</p>
```

- [ ] **Step 2: region/[name]/page.tsx 설명문 추가**

`src/app/region/[name]/page.tsx` 에서 `<ApartmentList` 위에 추가:

```tsx
<p className="text-gray-400 text-xs mb-4">
  청약홈 공공데이터 기준. 실제 청약 신청은{' '}
  <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer" className="underline">
    청약홈(applyhome.co.kr)
  </a>
  에서 확인하세요.
</p>
```

- [ ] **Step 3: 타입 체크 + 전체 빌드**

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit 2>&1
```
Expected: 출력 없음

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` 포함

- [ ] **Step 4: 최종 커밋**

```bash
git add src/app/apply/page.tsx "src/app/region/[name]/page.tsx"
git commit -m "feat: add source attribution to apply and region pages"
```

---

## 완료 체크리스트

- [ ] Task 1: FaqAccordion 컴포넌트
- [ ] Task 2: FAQ 페이지 (24문항)
- [ ] Task 3: About 페이지
- [ ] Task 4: Contact 페이지 + ads.txt
- [ ] Task 5: Footer + Sitemap 업데이트
- [ ] Task 6: 핵심 가이드 5개 SQL 삽입
- [ ] Task 7: 나머지 가이드 10개 SQL 삽입
- [ ] Task 8: Apply·Region 설명문 + 최종 빌드 통과
