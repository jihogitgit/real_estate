import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getApartmentsByRegion } from '@/lib/apartments'
import ApartmentList from '@/components/apartment/ApartmentList'
import { ALL_REGIONS } from '@/types'
import type { Region } from '@/types'

export const dynamicParams = false

export function generateStaticParams() {
  return ALL_REGIONS.map((name) => ({ name }))
}

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  return {
    title: `${name} 분양 청약 일정`,
    description: `${name} 지역 아파트 분양 청약 일정, 가격, 세대수 정보를 확인하세요. ${name} 청약 신청 방법과 자격 안내.`,
    openGraph: {
      title: `${name} 분양 청약 정보 | 청약마당`,
      description: `${name} 지역 최신 분양 청약 일정`,
    },
  }
}

export default async function RegionPage({ params }: Props) {
  const { name } = await params

  if (!ALL_REGIONS.includes(name as Region)) notFound()

  const apartments = await getApartmentsByRegion(name)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name} 분양 청약 목록`,
    description: `${name} 지역 분양 중인 아파트 목록`,
    numberOfItems: apartments.length,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{name} 분양 청약 정보</h1>
          <p className="text-gray-500 mt-1">
            {name} 지역 분양 청약 일정과 단지 정보 — 총 {apartments.length}개 단지
          </p>
        </div>

        <section className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-gray-700">
          <p>
            <strong>{name}</strong> 지역의 최신 아파트 분양 청약 정보입니다.
            청약 자격, 일정, 공급 세대수를 확인하고 관심 단지를 저장하세요.
            청약 신청은 <a href="https://apply.lh.or.kr" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">청약홈(apply.lh.or.kr)</a>에서 하실 수 있습니다.
          </p>
        </section>

        <ApartmentList apartments={apartments} />

        {apartments.length === 0 && (
          <p className="text-center text-gray-400 mt-4">
            현재 {name} 지역에 진행 중인 분양이 없습니다.
          </p>
        )}
      </div>
    </>
  )
}
