import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getApartmentById } from '@/lib/apartments'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Apartment } from '@/types'
import KakaoMapEmbed from '@/components/map/KakaoMapEmbed'
import NearbyTransactionsWidget from '@/components/real-estate/NearbyTransactionsWidget'
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.vercel.app'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const apartment = await getApartmentById(id)
  if (!apartment) return { title: '단지를 찾을 수 없습니다' }
  return {
    title: `${apartment.name} 분양 정보`,
    description: `${apartment.region} ${apartment.district ?? ''} ${apartment.name} 청약 일정, 세대수, 위치 정보.`,
    alternates: { canonical: `${BASE_URL}/apply/${id}` },
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

        <NearbyTransactionsWidget
          apartmentName={apartment.name}
          district={apartment.district}
        />

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
