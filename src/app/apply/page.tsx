import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getApartmentsByRegion } from '@/lib/apartments'
import { createClient } from '@/lib/supabase/server'
import ApartmentList from '@/components/apartment/ApartmentList'
import ApartmentFilter from '@/components/apartment/ApartmentFilter'
import { Skeleton } from '@/components/ui/skeleton'
import type { Apartment } from '@/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '전국 분양 청약 목록',
  description: '전국 아파트 분양 청약 일정과 정보를 지역별로 확인하세요.',
}

async function getApartments(region?: string): Promise<Apartment[]> {
  if (region) return getApartmentsByRegion(region)

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('apartments')
    .select('*')
    .gte('apply_end', today)
    .order('apply_start', { ascending: true })
    .limit(50)
  return data ?? []
}

interface Props {
  searchParams: Promise<{ region?: string }>
}

export default async function ApplyPage({ searchParams }: Props) {
  const { region } = await searchParams
  const apartments = await getApartments(region)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {region ? `${region} 분양 정보` : '전국 분양 청약 목록'}
      </h1>
      <p className="text-gray-500 text-sm mb-4">
        총 {apartments.length}개 단지
      </p>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ApartmentFilter />
      </Suspense>

      <div className="mt-4">
        <ApartmentList apartments={apartments} />
      </div>
    </div>
  )
}
