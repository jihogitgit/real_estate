'use client'
import { Button } from '@/components/ui/button'

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

function nextDayIcsDate(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function makeIcs(events: Array<{ summary: string; date: string; url: string }>): string {
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//청약마당//KR']
  for (const e of events) {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@cheongahkdang`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${toIcsDate(e.date)}`,
      `DTEND;VALUE=DATE:${nextDayIcsDate(e.date)}`,
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
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${name}-청약일정.ics`
    link.click()
    // Defer revoke so browser has time to initiate the download
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  }

  return (
    <Button variant="outline" type="button" onClick={handleDownload}>
      📅 캘린더에 추가
    </Button>
  )
}
