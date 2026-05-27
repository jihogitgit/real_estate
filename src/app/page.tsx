// src/app/page.tsx
import Link from 'next/link'
import { getUpcomingApartments } from '@/lib/apartments'
import ApartmentList from '@/components/apartment/ApartmentList'

export const revalidate = 3600

export default async function HomePage() {
  const upcoming = await getUpcomingApartments(6)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 히어로 섹션 */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          전국 분양 청약 정보
        </h1>
        <p className="text-gray-500 text-lg mb-6">
          청약 일정, 가점 계산, 지역별 분양 정보를 한 곳에서
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/apply" className="h-9 gap-1.5 px-2.5 inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none bg-primary text-primary-foreground hover:bg-primary/80">
            분양 목록 보기
          </Link>
          <Link href="/calculator" className="h-9 gap-1.5 px-2.5 inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground">
            가점 계산하기
          </Link>
        </div>
      </section>

      {/* 빠른 지역 링크 */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {['서울', '경기', '인천', '부산', '대구', '대전'].map((region) => (
            <Link
              key={region}
              href={`/region/${region}`}
              className="px-4 py-2 rounded-full border text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              {region} 청약
            </Link>
          ))}
        </div>
      </section>

      {/* 임박한 청약 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">마감 임박 분양</h2>
          <Link href="/apply" className="text-sm text-blue-600 hover:underline">
            전체 보기
          </Link>
        </div>
        <ApartmentList apartments={upcoming} />
      </section>

      {/* 청약 캘린더 링크 */}
      <section className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">이번 달 청약 일정</h2>
        <p className="text-gray-500 text-sm mb-4">월별 청약 캘린더로 놓치지 마세요</p>
        <Link href="/calendar" className="h-8 gap-1.5 px-2.5 inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground">
          캘린더 보기
        </Link>
      </section>
    </div>
  )
}
