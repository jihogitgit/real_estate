import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Apartment } from '@/types'

function getDdayLabel(applyEnd: string | null): string {
  if (!applyEnd) return '일정 미정'
  const diff = Math.ceil(
    (new Date(applyEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0) return '마감'
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

function formatPrice(price: number | null): string {
  if (!price) return '-'
  return `${(price / 10000).toFixed(0)}억`
}

interface Props {
  apartment: Apartment
}

export default function ApartmentCard({ apartment }: Props) {
  const dday = getDdayLabel(apartment.apply_end)
  const isClosed = dday === '마감'

  return (
    <Link href={`/apply/${apartment.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {apartment.name}
            </h3>
            <Badge
              variant={isClosed ? 'secondary' : 'default'}
              className="shrink-0 text-xs"
            >
              {dday}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {apartment.region} {apartment.district}
          </p>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-1">
          {apartment.total_units && (
            <p>{apartment.total_units.toLocaleString()}세대</p>
          )}
          {(apartment.min_price || apartment.max_price) && (
            <p>
              {formatPrice(apartment.min_price)} ~ {formatPrice(apartment.max_price)}
            </p>
          )}
          {apartment.apply_start && (
            <p className="text-xs text-gray-400">
              청약 {apartment.apply_start} ~ {apartment.apply_end ?? '?'}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
