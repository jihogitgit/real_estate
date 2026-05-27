'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ALL_REGIONS } from '@/types'

export default function ApartmentFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRegion = searchParams.get('region') ?? '전체'

  function handleRegionClick(region: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (region === '전체') {
      params.delete('region')
    } else {
      params.set('region', region)
    }
    router.push(`/apply?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {(['전체', ...ALL_REGIONS] as const).map((region) => (
        <button key={region} onClick={() => handleRegionClick(region)}>
          <Badge
            variant={currentRegion === region ? 'default' : 'outline'}
            className="cursor-pointer text-sm"
          >
            {region}
          </Badge>
        </button>
      ))}
    </div>
  )
}
