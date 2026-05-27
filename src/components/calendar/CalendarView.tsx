'use client'
import Link from 'next/link'
import type { Apartment } from '@/types'

interface Props {
  apartments: Apartment[]
  year: number
  month: number
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

export default function CalendarView({ apartments, year, month }: Props) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const aptsByDate: Record<number, Apartment[]> = {}
  apartments.forEach((apt) => {
    if (!apt.apply_start) return
    const start = new Date(apt.apply_start)
    const end = apt.apply_end ? new Date(apt.apply_end) : start
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        const day = d.getDate()
        if (!aptsByDate[day]) aptsByDate[day] = []
        aptsByDate[day].push(apt)
      }
    }
  })

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`min-h-[80px] border rounded p-1 text-xs ${
              day ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            {day && (
              <>
                <span className="font-medium text-gray-700">{day}</span>
                <div className="mt-1 space-y-0.5">
                  {(aptsByDate[day] ?? []).slice(0, 2).map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/apply/${apt.id}`}
                      className="block truncate bg-blue-100 text-blue-700 rounded px-1 py-0.5 text-[10px] hover:bg-blue-200"
                    >
                      {apt.name}
                    </Link>
                  ))}
                  {(aptsByDate[day]?.length ?? 0) > 2 && (
                    <span className="text-gray-400 text-[10px]">
                      +{(aptsByDate[day]?.length ?? 0) - 2}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
