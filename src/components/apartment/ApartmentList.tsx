import ApartmentCard from './ApartmentCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Apartment } from '@/types'

interface Props {
  apartments: Apartment[]
  loading?: boolean
}

export default function ApartmentList({ apartments, loading = false }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    )
  }

  if (apartments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">등록된 분양 정보가 없습니다.</p>
        <p className="text-sm mt-1">다른 지역을 선택해보세요.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {apartments.map((apt) => (
        <ApartmentCard key={apt.id} apartment={apt} />
      ))}
    </div>
  )
}
