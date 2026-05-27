# Real Estate Portal — Plan 3: User Features + Monetization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 뉴스/가이드 콘텐츠 페이지, 카카오 소셜 로그인, 관심 단지 저장, 청약 알림 설정, AdSense+AdFit 광고 슬롯, GA4+Sentry 모니터링, 법적 필수 페이지(개인정보처리방침/이용약관), 런칭 체크리스트 완성.

**Architecture:** Supabase Auth로 카카오 소셜 로그인 처리. 광고는 AdSlot 래퍼 컴포넌트 하나로 AdSense/AdFit을 교체 가능하게 추상화. GA4는 루트 레이아웃에 Script로 삽입. Sentry는 Next.js SDK로 에러 수집.

**Tech Stack:** @supabase/ssr (Auth), next/script (GA4/AdSense), Sentry Next.js SDK, Vitest + React Testing Library

---

## 파일 구조

```
src/
├── components/
│   ├── ads/
│   │   ├── AdSlot.tsx               # AdSense/AdFit 광고 슬롯 래퍼
│   │   └── AdFitBanner.tsx          # 카카오 AdFit 스크립트 로더
│   ├── auth/
│   │   ├── AuthProvider.tsx         # Supabase Auth 컨텍스트
│   │   └── LoginButton.tsx          # 카카오 소셜 로그인 버튼
│   └── user/
│       ├── SaveButton.tsx           # 관심 단지 저장 버튼
│       └── AlertButton.tsx          # 청약 알림 설정 버튼
├── lib/
│   └── user-actions.ts              # 관심 단지/알림 서버 액션
└── app/
    ├── layout.tsx                   # GA4 Script 추가
    ├── auth/
    │   └── callback/
    │       └── route.ts             # Supabase OAuth 콜백
    ├── news/
    │   ├── page.tsx                 # 뉴스 목록 (ISR)
    │   └── [slug]/
    │       └── page.tsx             # 뉴스 상세
    ├── guide/
    │   ├── page.tsx                 # 청약 가이드 목록
    │   └── [slug]/
    │       └── page.tsx             # 가이드 상세
    ├── my/
    │   ├── saved/
    │   │   └── page.tsx             # 관심 단지 목록
    │   └── alerts/
    │       └── page.tsx             # 알림 설정
    ├── privacy/
    │   └── page.tsx                 # 개인정보처리방침
    └── terms/
        └── page.tsx                 # 이용약관
```

---

## Task 1: 뉴스/가이드 콘텐츠 페이지

**Files:**
- Create: `src/app/news/page.tsx`
- Create: `src/app/news/[slug]/page.tsx`
- Create: `src/app/guide/page.tsx`
- Create: `src/app/guide/[slug]/page.tsx`

- [ ] **Step 1: 뉴스 목록 페이지 작성**

```typescript
// src/app/news/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 1800

export const metadata: Metadata = {
  title: '부동산 뉴스 — 최신 분양 시장 트렌드',
  description: '분양 시장 최신 뉴스와 부동산 트렌드를 확인하세요.',
}

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, summary, published_at')
    .eq('category', 'news')
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">부동산 뉴스</h1>
      {(articles ?? []).length === 0 ? (
        <p className="text-gray-400 text-center py-16">등록된 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {(articles ?? []).map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">뉴스</Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(article.published_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold mt-1">{article.title}</h2>
                </CardHeader>
                {article.summary && (
                  <CardContent className="text-sm text-gray-500 line-clamp-2">
                    {article.summary}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 뉴스 상세 페이지 작성**

```typescript
// src/app/news/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, summary')
    .eq('slug', slug)
    .eq('category', 'news')
    .single()

  if (!data) return { title: '뉴스를 찾을 수 없습니다' }
  return {
    title: data.title,
    description: data.summary ?? undefined,
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('category', 'news')
    .single()

  if (!article) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <span className="text-xs text-gray-400">
          {new Date(article.published_at).toLocaleDateString('ko-KR')}
        </span>
        <h1 className="text-2xl font-bold mt-2">{article.title}</h1>
        {article.summary && (
          <p className="text-gray-500 mt-2">{article.summary}</p>
        )}
      </div>
      <hr className="mb-6" />
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        {article.body ? (
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        ) : (
          <p className="text-gray-400">내용이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 가이드 목록 페이지 작성**

```typescript
// src/app/guide/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '청약 가이드 — 청약 처음이라면',
  description: '청약 가점 계산, 무주택자 기준, 생애최초 특별공급 등 청약 완전 가이드.',
}

export default async function GuidePage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, summary, published_at')
    .eq('category', 'guide')
    .order('published_at', { ascending: false })
    .limit(30)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">청약 가이드</h1>
        <p className="text-gray-500 mt-1">청약 처음이라면 여기서 시작하세요</p>
      </div>
      {(articles ?? []).length === 0 ? (
        <p className="text-gray-400 text-center py-16">등록된 가이드가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(articles ?? []).map((article) => (
            <Link key={article.id} href={`/guide/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-1">
                  <Badge variant="secondary" className="w-fit">가이드</Badge>
                  <h2 className="text-base font-semibold mt-1">{article.title}</h2>
                </CardHeader>
                {article.summary && (
                  <CardContent className="text-sm text-gray-500 line-clamp-3">
                    {article.summary}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 가이드 상세 페이지 작성**

```typescript
// src/app/guide/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, summary')
    .eq('slug', slug)
    .eq('category', 'guide')
    .single()

  if (!data) return { title: '가이드를 찾을 수 없습니다' }
  return {
    title: data.title,
    description: data.summary ?? undefined,
  }
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('category', 'guide')
    .single()

  if (!article) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.summary && (
          <p className="text-gray-500 mt-2 text-base">{article.summary}</p>
        )}
        <span className="text-xs text-gray-400 block mt-2">
          업데이트: {new Date(article.updated_at).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <hr className="mb-6" />
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        {article.body ? (
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        ) : (
          <p className="text-gray-400">내용이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /Users/mw/prodect/real_estate
npm run build
```

Expected: 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add src/app/news/ src/app/guide/
git commit -m "feat: add news and guide content pages"
```

---

## Task 2: 카카오 소셜 로그인 (Supabase Auth)

**Files:**
- Create: `src/app/auth/callback/route.ts`
- Create: `src/components/auth/AuthProvider.tsx`
- Create: `src/components/auth/LoginButton.tsx`
- Modify: `src/app/layout.tsx`

> **사전 작업:** Supabase 대시보드 → Authentication → Providers → Kakao 활성화. `KAKAO_CLIENT_ID`와 시크릿을 입력. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

- [ ] **Step 1: OAuth 콜백 라우트 작성**

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
```

- [ ] **Step 2: AuthProvider 작성**

```typescript
// src/components/auth/AuthProvider.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithKakao: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithKakao: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithKakao() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithKakao, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 3: LoginButton 컴포넌트 작성**

```typescript
// src/components/auth/LoginButton.tsx
'use client'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'

export default function LoginButton() {
  const { user, loading, signInWithKakao, signOut } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <Button variant="outline" size="sm" onClick={signOut}>
        로그아웃
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={signInWithKakao}
      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
    >
      카카오 로그인
    </Button>
  )
}
```

- [ ] **Step 4: Header에 LoginButton 추가**

`src/components/layout/Header.tsx`를 수정한다:

```typescript
// src/components/layout/Header.tsx
import Link from 'next/link'
import LoginButton from '@/components/auth/LoginButton'

const NAV_LINKS = [
  { href: '/apply', label: '분양정보' },
  { href: '/calendar', label: '청약캘린더' },
  { href: '/calculator', label: '가점계산기' },
  { href: '/guide', label: '청약가이드' },
  { href: '/news', label: '부동산뉴스' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center font-bold text-lg text-blue-600">
          청약마당
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <nav className="flex md:hidden items-center gap-3 text-xs font-medium">
            {NAV_LINKS.slice(0, 2).map(({ href, label }) => (
              <Link key={href} href={href} className="text-gray-700">
                {label}
              </Link>
            ))}
          </nav>
          <LoginButton />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: layout.tsx에 AuthProvider 추가**

`src/app/layout.tsx`의 `<body>` 안 `<Header />` 위에 `AuthProvider`로 감싼다:

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '청약마당 — 분양 청약 정보 포털',
    template: '%s | 청약마당',
  },
  description: '전국 분양 청약 일정, 가점 계산기, 지역별 청약 정보를 한눈에 확인하세요.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '청약마당',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add src/app/auth/ src/components/auth/ src/app/layout.tsx src/components/layout/Header.tsx
git commit -m "feat: add Kakao social login via Supabase Auth"
```

---

## Task 3: 관심 단지 저장 + 청약 알림

**Files:**
- Create: `src/lib/user-actions.ts`
- Create: `src/components/user/SaveButton.tsx`
- Create: `src/components/user/AlertButton.tsx`
- Create: `src/app/my/saved/page.tsx`
- Create: `src/app/my/alerts/page.tsx`

- [ ] **Step 1: 서버 액션 작성**

```typescript
// src/lib/user-actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveApartment(apartmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('saved_apartments')
    .insert({ user_id: user.id, apartment_id: apartmentId })

  if (error && error.code !== '23505') return { error: error.message }
  revalidatePath('/my/saved')
  return { success: true }
}

export async function unsaveApartment(apartmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('saved_apartments')
    .delete()
    .eq('user_id', user.id)
    .eq('apartment_id', apartmentId)

  if (error) return { error: error.message }
  revalidatePath('/my/saved')
  return { success: true }
}

export async function setAlert(apartmentId: string, daysBefore: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('alerts')
    .upsert(
      { user_id: user.id, apartment_id: apartmentId, alert_days_before: daysBefore, is_active: true },
      { onConflict: 'user_id,apartment_id,alert_days_before' }
    )

  if (error) return { error: error.message }
  revalidatePath('/my/alerts')
  return { success: true }
}

export async function removeAlert(alertId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/my/alerts')
  return { success: true }
}
```

- [ ] **Step 2: SaveButton 컴포넌트 작성**

```typescript
// src/components/user/SaveButton.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveApartment, unsaveApartment } from '@/lib/user-actions'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  apartmentId: string
  initialSaved?: boolean
}

export default function SaveButton({ apartmentId, initialSaved = false }: Props) {
  const { user, signInWithKakao } = useAuth()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!user) {
      await signInWithKakao()
      return
    }

    setLoading(true)
    if (saved) {
      await unsaveApartment(apartmentId)
      setSaved(false)
    } else {
      await saveApartment(apartmentId)
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <Button
      variant={saved ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {saved ? '★ 저장됨' : '☆ 관심 단지'}
    </Button>
  )
}
```

- [ ] **Step 3: AlertButton 컴포넌트 작성**

```typescript
// src/components/user/AlertButton.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { setAlert } from '@/lib/user-actions'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  apartmentId: string
}

export default function AlertButton({ apartmentId }: Props) {
  const { user, signInWithKakao } = useAuth()
  const [set, setSet] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!user) {
      await signInWithKakao()
      return
    }

    setLoading(true)
    await setAlert(apartmentId, 1)
    setSet(true)
    setLoading(false)
  }

  if (set) {
    return <p className="text-sm text-green-600">D-1 알림이 설정되었습니다.</p>
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      🔔 알림 받기
    </Button>
  )
}
```

- [ ] **Step 4: 분양 상세 페이지에 SaveButton + AlertButton 추가**

`src/app/apply/[id]/page.tsx`의 버튼 div를 다음으로 교체:

```typescript
// 상단 import에 추가:
import SaveButton from '@/components/user/SaveButton'
import AlertButton from '@/components/user/AlertButton'

// 기존 <div className="flex gap-3"> 를 다음으로 교체:
<div className="flex flex-wrap gap-3">
  <Button asChild>
    <a href="https://apply.lh.or.kr" target="_blank" rel="noopener noreferrer">
      청약홈 바로가기
    </a>
  </Button>
  <Button variant="outline" asChild>
    <a href={`/region/${apartment.region}`}>
      {apartment.region} 분양 더보기
    </a>
  </Button>
  <SaveButton apartmentId={apartment.id} />
  <AlertButton apartmentId={apartment.id} />
</div>
```

- [ ] **Step 5: 관심 단지 목록 페이지 작성**

```typescript
// src/app/my/saved/page.tsx
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ApartmentList from '@/components/apartment/ApartmentList'

export const metadata: Metadata = {
  title: '관심 단지',
  robots: { index: false, follow: false },
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?error=login_required')

  const { data: saved } = await supabase
    .from('saved_apartments')
    .select('apartments(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const apartments = (saved ?? [])
    .map((s: { apartments: unknown }) => s.apartments)
    .filter(Boolean) as Parameters<typeof ApartmentList>[0]['apartments']

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">관심 단지 ({apartments.length})</h1>
      <ApartmentList apartments={apartments} />
    </div>
  )
}
```

- [ ] **Step 6: 알림 설정 페이지 작성**

```typescript
// src/app/my/alerts/page.tsx
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { removeAlert } from '@/lib/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '청약 알림 설정',
  robots: { index: false, follow: false },
}

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?error=login_required')

  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, alert_days_before, is_active, apartments(name, apply_end)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">청약 알림 설정</h1>

      {(alerts ?? []).length === 0 ? (
        <p className="text-gray-400">설정된 알림이 없습니다. 관심 단지 상세 페이지에서 알림을 추가하세요.</p>
      ) : (
        <div className="space-y-3">
          {(alerts ?? []).map((alert) => {
            const apt = alert.apartments as { name: string; apply_end: string | null } | null
            return (
              <div key={alert.id} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">{apt?.name ?? '알 수 없는 단지'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">D-{alert.alert_days_before} 알림</Badge>
                    {apt?.apply_end && (
                      <span className="text-xs text-gray-400">마감: {apt.apply_end}</span>
                    )}
                  </div>
                </div>
                <form action={removeAlert.bind(null, alert.id)}>
                  <Button variant="ghost" size="sm" type="submit">삭제</Button>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/lib/user-actions.ts src/components/user/ src/app/my/
git commit -m "feat: add save apartment and alert features with Supabase server actions"
```

---

## Task 4: AdSense + Kakao AdFit 광고 슬롯

**Files:**
- Create: `src/components/ads/AdSlot.tsx`
- Create: `src/components/ads/AdFitBanner.tsx`

> **사전 작업:** Google AdSense 계정 생성 → 사이트 추가 → 광고 단위 생성 → `data-ad-client`(ca-pub-xxxx)와 `data-ad-slot` 값 메모. Kakao AdFit → 앱 등록 → 광고 코드 발급.

- [ ] **Step 1: AdSlot 컴포넌트 작성**

```typescript
// src/components/ads/AdSlot.tsx
'use client'
import { useEffect, useRef } from 'react'

interface Props {
  type: 'adsense' | 'adfit'
  // AdSense 전용
  adClient?: string
  adSlot?: string
  adFormat?: string
  // AdFit 전용
  adUnit?: string
  adWidth?: number
  adHeight?: number
  className?: string
}

function AdsenseSlot({ adClient, adSlot, adFormat }: {
  adClient: string
  adSlot: string
  adFormat: string
}) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle ?? []).push({})
    } catch {
      // AdSense 초기화 실패 무시
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  )
}

function AdFitSlot({ adUnit, adWidth, adHeight }: {
  adUnit: string
  adWidth: number
  adHeight: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current || !containerRef.current) return
    initialized.current = true

    const ins = document.createElement('ins')
    ins.className = 'kakao_ad_area'
    ins.setAttribute('data-ad-unit', adUnit)
    ins.setAttribute('data-ad-width', String(adWidth))
    ins.setAttribute('data-ad-height', String(adHeight))
    containerRef.current.appendChild(ins)

    const script = document.createElement('script')
    script.async = true
    script.type = 'text/javascript'
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js'
    containerRef.current.appendChild(script)
  }, [adUnit, adWidth, adHeight])

  return <div ref={containerRef} />
}

export default function AdSlot({
  type,
  adClient = '',
  adSlot = '',
  adFormat = 'auto',
  adUnit = '',
  adWidth = 320,
  adHeight = 100,
  className = '',
}: Props) {
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 ${className}`}
        style={{ minHeight: adHeight || 90 }}>
        광고 영역 ({type})
      </div>
    )
  }

  return (
    <div className={className}>
      {type === 'adsense' && adClient && adSlot ? (
        <AdsenseSlot adClient={adClient} adSlot={adSlot} adFormat={adFormat} />
      ) : type === 'adfit' && adUnit ? (
        <AdFitSlot adUnit={adUnit} adWidth={adWidth} adHeight={adHeight} />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: AdSense 스크립트를 layout.tsx에 추가**

`src/app/layout.tsx`의 `<Script>` 태그 아래에 추가:

```typescript
{process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
  <Script
    async
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
    crossOrigin="anonymous"
    strategy="afterInteractive"
  />
)}
```

- [ ] **Step 3: .env.local.example에 광고 키 추가**

`.env.local.example`과 `.env.local`에 추가:

```bash
# Google AdSense (https://www.google.com/adsense → 사이트 추가 → 광고 단위)
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxx

# Kakao AdFit (https://adfit.kakao.com → 앱 등록)
# 각 슬롯의 adUnit은 컴포넌트에서 직접 prop으로 전달
```

- [ ] **Step 4: 분양 목록 페이지에 광고 삽입**

`src/app/apply/page.tsx`에 목록 중간에 AdSlot 추가:

```typescript
// 상단 import에 추가:
import AdSlot from '@/components/ads/AdSlot'

// ApartmentList 위에 추가 (목록 상단):
<AdSlot
  type="adsense"
  adClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ''}
  adSlot="YOUR_AD_SLOT_ID"
  className="my-4"
/>
```

- [ ] **Step 5: 가이드/뉴스 상세 페이지에 광고 삽입**

`src/app/guide/[slug]/page.tsx`의 콘텐츠 하단에 추가:

```typescript
// 상단 import에 추가:
import AdSlot from '@/components/ads/AdSlot'

// </div> 닫는 태그 위 (본문 하단):
<AdSlot
  type="adfit"
  adUnit="YOUR_ADFIT_UNIT_ID"
  adWidth={320}
  adHeight={100}
  className="mt-8 flex justify-center"
/>
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/ads/ src/app/layout.tsx src/app/apply/page.tsx src/app/guide/ .env.local.example
git commit -m "feat: add AdSense and Kakao AdFit ad slots"
```

---

## Task 5: GA4 + Sentry 모니터링

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`

- [ ] **Step 1: Sentry SDK 설치**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs --no-install
```

> 마법사가 DSN을 묻는다. Sentry 대시보드 → 프로젝트 생성 → DSN 복사해서 입력.

Expected: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` 생성됨

- [ ] **Step 2: sentry.client.config.ts 확인 및 수정**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  integrations: [
    Sentry.replayIntegration(),
  ],
})
```

- [ ] **Step 3: sentry.server.config.ts 확인 및 수정**

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

- [ ] **Step 4: GA4 스크립트를 layout.tsx에 추가**

`src/app/layout.tsx`의 `<AuthProvider>` 위에 GA4 Script 추가 (전체 파일):

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '청약마당 — 분양 청약 정보 포털',
    template: '%s | 청약마당',
  },
  description: '전국 분양 청약 일정, 가점 계산기, 지역별 청약 정보를 한눈에 확인하세요.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '청약마당',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 카카오맵 SDK */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />

        {/* Google AdSense */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}

        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: .env.local.example에 모니터링 키 추가**

```bash
# Google Analytics 4 (https://analytics.google.com → 스트림 → 측정 ID)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry (https://sentry.io → 프로젝트 → DSN)
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
```

- [ ] **Step 6: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add sentry.*.config.ts src/app/layout.tsx .env.local.example
git commit -m "feat: add GA4 analytics and Sentry error tracking"
```

---

## Task 6: 법적 필수 페이지

**Files:**
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/terms/page.tsx`

> **중요:** AdSense 심사 통과를 위해 이 두 페이지는 런칭 전 반드시 있어야 한다.

- [ ] **Step 1: 개인정보처리방침 페이지 작성**

```typescript
// src/app/privacy/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
}

export default function PrivacyPage() {
  const today = new Date().toLocaleDateString('ko-KR')

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      <p className="text-gray-500 text-sm mb-8">시행일: {today}</p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">1. 수집하는 개인정보</h2>
          <p>
            청약마당(이하 "서비스")은 카카오 소셜 로그인 시 이메일 주소를 수집합니다.
            광고 서비스(Google AdSense, Kakao AdFit) 운영을 위해 쿠키 및 광고 식별자가 수집될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. 수집 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>관심 단지 저장 및 청약 알림 발송</li>
            <li>서비스 이용 통계 분석 (Google Analytics 4)</li>
            <li>맞춤형 광고 제공 (Google AdSense, Kakao AdFit)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. 보유 및 이용기간</h2>
          <p>회원 탈퇴 시 즉시 삭제합니다. 광고 쿠키는 브라우저 설정으로 거부 가능합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. 제3자 제공</h2>
          <p>
            개인정보를 제3자에게 제공하지 않습니다. 단, Google 및 Kakao의 광고 서비스 이용에
            따른 데이터 처리는 각사의 개인정보처리방침을 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. 쿠키 사용</h2>
          <p>
            본 서비스는 로그인 세션 유지 및 광고 최적화를 위해 쿠키를 사용합니다.
            브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. 권리 행사</h2>
          <p>
            개인정보 열람·수정·삭제 요청은 아래 이메일로 연락 주세요.
            <br />
            <strong>이메일: contact@example.com</strong>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. 개인정보보호책임자</h2>
          <p>이름: 운영자 / 이메일: contact@example.com</p>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 이용약관 페이지 작성**

```typescript
// src/app/terms/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">이용약관</h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">제1조 (목적)</h2>
          <p>
            이 약관은 청약마당(이하 "서비스")의 이용 조건 및 절차, 이용자와 운영자의 권리·의무를 규정합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제2조 (서비스 내용)</h2>
          <p>
            청약마당은 공공데이터포털 API를 활용한 분양·청약 정보 제공 서비스입니다.
            정보의 정확성을 위해 노력하나, 실제 청약 신청은 반드시 <strong>청약홈(apply.lh.or.kr)</strong>에서 확인하세요.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제3조 (면책)</h2>
          <p>
            본 서비스에서 제공하는 정보는 참고용이며, 투자·청약 결과에 대한 책임을 지지 않습니다.
            공공 API 데이터 오류로 인한 손해에 대해 운영자는 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제4조 (회원)</h2>
          <p>
            카카오 소셜 로그인으로 가입한 회원은 관심 단지 저장 및 알림 서비스를 이용할 수 있습니다.
            회원은 언제든지 탈퇴를 요청할 수 있으며, 탈퇴 시 모든 데이터는 즉시 삭제됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제5조 (광고)</h2>
          <p>
            본 서비스는 Google AdSense 및 Kakao AdFit 광고를 게재합니다.
            광고 내용은 광고주의 책임이며 서비스와 무관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제6조 (문의)</h2>
          <p>이메일: contact@example.com</p>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/privacy/ src/app/terms/
git commit -m "feat: add privacy policy and terms of service pages"
```

---

## Task 7: 전체 테스트 + 빌드 최종 확인

- [ ] **Step 1: 전체 테스트 실행**

```bash
npm run test:run
```

Expected: 모든 테스트 통과

- [ ] **Step 2: TypeScript 컴파일**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 프로덕션 빌드**

```bash
npm run build
```

Expected: 빌드 성공. 아래 항목 확인:
- `/region/[name]` 17개 정적 페이지 생성
- `/calculator` 정적 페이지 생성
- 나머지 페이지 ISR 또는 Dynamic

- [ ] **Step 4: 개발 서버에서 주요 경로 전체 확인**

```bash
npm run dev
```

브라우저에서 순서대로 확인:
1. `http://localhost:3000` — 홈
2. `http://localhost:3000/apply` — 분양 목록
3. `http://localhost:3000/region/서울` — 지역 페이지
4. `http://localhost:3000/calculator` — 가점 계산기 (슬라이더 동작 확인)
5. `http://localhost:3000/calendar` — 캘린더
6. `http://localhost:3000/guide` — 가이드 목록
7. `http://localhost:3000/news` — 뉴스 목록
8. `http://localhost:3000/privacy` — 개인정보처리방침
9. `http://localhost:3000/terms` — 이용약관
10. `http://localhost:3000/sitemap.xml` — XML 확인

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: final integration check — all pages verified"
```

---

## Plan 3 완료 체크리스트

- [ ] `npm run test:run` — 전체 테스트 통과
- [ ] `npx tsc --noEmit` — TypeScript 에러 없음
- [ ] `npm run build` — 빌드 성공
- [ ] 카카오 로그인 버튼 헤더에 표시됨
- [ ] 개발 환경에서 광고 슬롯이 placeholder로 표시됨
- [ ] `/privacy`, `/terms` 페이지 존재함 (AdSense 심사 필수)
- [ ] `.env.local.example`에 모든 환경변수 문서화됨

---

## 런칭 체크리스트

### 1단계: 배포 전 준비

- [ ] Vercel에 프로젝트 연결 (`vercel` CLI 또는 GitHub import)
- [ ] Vercel 환경변수 모두 입력 (`.env.local.example` 참고)
- [ ] Supabase → Authentication → Kakao Provider → Redirect URL을 Vercel 도메인으로 변경
- [ ] `NEXT_PUBLIC_SITE_URL`을 실제 Vercel 도메인으로 업데이트
- [ ] `src/app/layout.tsx`의 `metadataBase` URL을 실제 도메인으로 업데이트

### 2단계: 콘텐츠 먼저 (배포 후 2~3주)

- [ ] Supabase SQL Editor에서 가이드 아티클 15개 직접 삽입

  ```sql
  INSERT INTO articles (slug, title, summary, body, category, published_at) VALUES
  ('cheongahk-gajeom-guide', '청약 가점 계산 방법 완전 정리', '무주택기간·부양가족·통장으로 내 점수 계산하기', '<p>청약 가점제는...</p>', 'guide', NOW()),
  ('muhujutaek-gijun', '무주택자 기준 총정리 2025', '무주택자 인정 범위와 예외사항', '<p>무주택자란...</p>', 'guide', NOW()),
  ('saengae-special', '생애최초 특별공급 조건과 신청 방법', '생애최초 특공 자격과 당첨 전략', '<p>생애최초 특별공급은...</p>', 'guide', NOW());
  -- 나머지 12개 동일한 형식으로 추가
  ```

- [ ] Cron Job이 분양 데이터를 정상 수집하는지 확인 (`/api/cron/sync` 수동 호출)

### 3단계: SEO 등록

- [ ] Google Search Console에 사이트 등록 및 소유권 확인
- [ ] `sitemap.xml` URL 서치콘솔에 제출
- [ ] Google Analytics 4 실시간 보고서에서 방문자 확인

### 4단계: 광고 신청 (월 1,000 PV 이상 후)

- [ ] Google AdSense 신청 (사이트에 콘텐츠 충분, 개인정보처리방침 페이지 존재 확인)
- [ ] 심사 통과 후 `NEXT_PUBLIC_ADSENSE_CLIENT`와 각 슬롯 ID를 실제 값으로 업데이트
- [ ] Kakao AdFit 앱 등록 및 광고 단위 ID를 AdSlot prop으로 업데이트

### 5단계: 광고 최적화

- [ ] Vercel Analytics에서 Core Web Vitals 확인 (LCP < 2.5s, CLS < 0.1)
- [ ] 광고 배치 A/B 테스트: 상단 vs 중단 배치 CTR 비교
- [ ] 월간 수익 리포트 확인 (AdSense + AdFit 합산)
