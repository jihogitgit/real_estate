'use client'
import { useState, useEffect } from 'react'

interface Props {
  applyEnd: string | null
  priority1Date: string | null
  winnerDate: string | null
  contractStart: string | null
  moveInMonth: string | null
}

function daysUntil(dateStr: string | null, today: Date): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (isNaN(target.getTime())) return null
  target.setHours(0, 0, 0, 0)
  const base = new Date(today)
  base.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
}

function formatMoveIn(ym: string | null): string | null {
  if (!ym || ym.length < 6) return null
  return `${ym.slice(0, 4)}.${ym.slice(4, 6)}`
}

export default function DdayBanner({ applyEnd, priority1Date, winnerDate, contractStart, moveInMonth }: Props) {
  const [today, setToday] = useState<Date | null>(null)

  useEffect(() => {
    setToday(new Date())
  }, [])

  if (!today) return null

  const mainRef = priority1Date ?? applyEnd
  const mainDays = daysUntil(mainRef, today)
  const winnerDays = daysUntil(winnerDate, today)
  const contractDays = daysUntil(contractStart, today)
  const moveIn = formatMoveIn(moveInMonth)
  const isExpired = mainDays !== null && mainDays <= 0

  return (
    <div className={`rounded-lg p-4 mb-6 flex gap-6 ${isExpired ? 'bg-gray-100' : 'bg-blue-50'}`}>
      <div className="flex-1">
        <p className={`text-3xl font-bold ${isExpired ? 'text-gray-400' : 'text-blue-600'}`}>
          {mainDays === null ? '-' : mainDays <= 0 ? '마감' : `D-${mainDays}`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {priority1Date ? '1순위 접수 마감까지' : '청약 마감까지'}
        </p>
      </div>
      <div className="text-right text-sm space-y-1 self-center">
        {winnerDays !== null && (
          <p className="text-gray-600">당첨발표까지 {winnerDays > 0 ? `D-${winnerDays}` : '완료'}</p>
        )}
        {contractDays !== null && (
          <p className="text-gray-600">계약까지 {contractDays > 0 ? `D-${contractDays}` : '완료'}</p>
        )}
        {moveIn && <p className="text-gray-600">입주 예정 {moveIn}</p>}
      </div>
    </div>
  )
}
