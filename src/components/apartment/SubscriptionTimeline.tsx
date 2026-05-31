'use client'
import { useState, useEffect } from 'react'

interface Props {
  announceDate: string | null
  specialSupplyDate: string | null
  priority1Date: string | null
  applyEnd: string | null
  winnerDate: string | null
  contractStart: string | null
  contractEnd: string | null
}

type StepStatus = 'done' | 'today' | 'future'

interface Step {
  label: string
  date: string
  dateEnd: string | null
  status: StepStatus
}

function buildSteps(props: Props, now: Date): Step[] {
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)

  const raw: Array<{ label: string; date: string | null; dateEnd?: string | null }> = [
    { label: '모집공고', date: props.announceDate },
    { label: '특별공급', date: props.specialSupplyDate },
    // priority1Date가 없으면 applyEnd 기준으로 표시 (명시적 접수일 없는 공고 대비)
    { label: '1순위 접수', date: props.priority1Date ?? props.applyEnd, dateEnd: props.applyEnd },
    { label: '당첨자 발표', date: props.winnerDate },
    { label: '계약', date: props.contractStart, dateEnd: props.contractEnd },
  ]

  return raw
    .filter(s => s.date !== null)
    .map(s => {
      const d = new Date(s.date!)
      if (isNaN(d.getTime())) return null
      d.setHours(0, 0, 0, 0)
      const diff = d.getTime() - base.getTime()
      const status: StepStatus = diff < 0 ? 'done' : diff === 0 ? 'today' : 'future'
      return { label: s.label, date: s.date!, dateEnd: s.dateEnd ?? null, status }
    })
    .filter((s): s is Step => s !== null)
}

export default function SubscriptionTimeline(props: Props) {
  const [now, setNow] = useState<Date | null>(null)

  // Run once on mount to capture client-side date (avoids SSR/CSR mismatch).
  // Subsequent prop changes re-derive steps from the captured `now`.
  useEffect(() => { setNow(new Date()) }, [])

  const steps = now ? buildSteps(props, now) : null
  if (!steps) return null

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold mb-3">청약 일정</h2>
      <ol className="space-y-3 ml-1">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`h-3 w-3 rounded-full shrink-0 mt-0.5 ${
                step.status === 'done' ? 'bg-gray-300' :
                step.status === 'today' ? 'bg-red-500' : 'bg-blue-300'
              }`} />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 mt-1 min-h-3" />
              )}
            </div>
            <div className="pb-1 -mt-0.5">
              <p className={`text-sm font-medium ${
                step.status === 'today' ? 'text-red-600' :
                step.status === 'done' ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {step.label}
                {step.status === 'today' && (
                  <span className="text-xs ml-1">(진행중)</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {step.date}
                {step.dateEnd && step.dateEnd !== step.date ? ` ~ ${step.dateEnd}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
