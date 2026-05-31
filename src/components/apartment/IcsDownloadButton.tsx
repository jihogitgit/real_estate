'use client'

interface Props {
  name: string
  priority1Date: string | null
  applyEnd: string | null
  winnerDate: string | null
  contractStart: string | null
  pblancUrl: string | null
}

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function makeIcs(events: Array<{ summary: string; date: string; url: string }>): string {
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//청약마당//KR']
  for (const e of events) {
    const d = toIcsDate(e.date)
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${d}`,
      `SUMMARY:${e.summary}`,
      `URL:${e.url}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export default function IcsDownloadButton({ name, priority1Date, applyEnd, winnerDate, contractStart, pblancUrl }: Props) {
  const hasEvents = priority1Date || applyEnd || winnerDate || contractStart
  if (!hasEvents) return null

  const url = pblancUrl ?? 'https://www.applyhome.co.kr'

  function handleDownload() {
    const events: Array<{ summary: string; date: string; url: string }> = []
    const applyDate = priority1Date ?? applyEnd
    if (applyDate) events.push({ summary: `${name} 1순위 접수`, date: applyDate, url })
    if (winnerDate) events.push({ summary: `${name} 당첨자 발표`, date: winnerDate, url })
    if (contractStart) events.push({ summary: `${name} 계약 시작`, date: contractStart, url })
    if (events.length === 0) return

    const blob = new Blob([makeIcs(events)], { type: 'text/calendar' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${name}-청약일정.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
    >
      📅 캘린더에 추가
    </button>
  )
}
