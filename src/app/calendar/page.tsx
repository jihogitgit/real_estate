import type { Metadata } from 'next'
import { getApartmentsForCalendar } from '@/lib/apartments'
import CalendarView from '@/components/calendar/CalendarView'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '청약 캘린더 — 월별 분양 일정',
  description: '이번 달 청약 신청 일정을 한눈에 확인하세요.',
}

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams
  const now = new Date()
  const year = sp.year ? parseInt(sp.year) : now.getFullYear()
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1

  const apartments = await getApartmentsForCalendar(year, month)

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">청약 캘린더</h1>
        <div className="flex items-center gap-4">
          <a
            href={`/calendar?year=${prevYear}&month=${prevMonth}`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 이전 달
          </a>
          <span className="font-semibold">{year}년 {month}월</span>
          <a
            href={`/calendar?year=${nextYear}&month=${nextMonth}`}
            className="text-sm text-blue-600 hover:underline"
          >
            다음 달 →
          </a>
        </div>
      </div>
      <CalendarView apartments={apartments} year={year} month={month} />
    </div>
  )
}
