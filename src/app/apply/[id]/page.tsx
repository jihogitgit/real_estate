import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getApartmentById } from '@/lib/apartments'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Apartment } from '@/types'

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

  return (
    <>
      <JsonLd apartment={apartment} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="text-2xl font-bold">{apartment.name}</h1>
            <Badge>{apartment.region}</Badge>
          </div>
          <p className="text-gray-500">{apartment.address ?? `${apartment.region} ${apartment.district ?? ''}`}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">청약 기간</p>
            <p className="font-medium text-sm">
              {apartment.apply_start ?? '-'} ~ {apartment.apply_end ?? '-'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">총 세대수</p>
            <p className="font-medium">{apartment.total_units?.toLocaleString() ?? '-'}세대</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">분양가</p>
            <p className="font-medium text-sm">
              {apartment.min_price
                ? `${(apartment.min_price / 10000).toFixed(0)}억 ~`
                : '-'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="https://apply.lh.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            청약홈 바로가기
          </a>
          <Link
            href={`/region/${apartment.region}`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {apartment.region} 분양 더보기
          </Link>
        </div>
      </div>
    </>
  )
}
