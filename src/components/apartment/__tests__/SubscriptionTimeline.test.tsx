import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import SubscriptionTimeline from '../SubscriptionTimeline'

describe('SubscriptionTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-28T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('모든 단계를 표시한다', async () => {
    render(
      <SubscriptionTimeline
        announceDate="2025-05-01"
        specialSupplyDate="2025-05-20"
        priority1Date="2025-05-31"
        applyEnd="2025-06-01"
        winnerDate="2025-06-10"
        contractStart="2025-06-20"
        contractEnd="2025-06-25"
      />
    )
    await waitFor(() => expect(screen.getByText('모집공고')).toBeInTheDocument())
    expect(screen.getByText('특별공급')).toBeInTheDocument()
    expect(screen.getByText('1순위 접수')).toBeInTheDocument()
    expect(screen.getByText('당첨자 발표')).toBeInTheDocument()
    expect(screen.getByText('계약')).toBeInTheDocument()
  })

  it('null인 단계는 생략한다', async () => {
    render(
      <SubscriptionTimeline
        announceDate="2025-05-01"
        specialSupplyDate={null}
        priority1Date={null}
        applyEnd="2025-06-01"
        winnerDate={null}
        contractStart={null}
        contractEnd={null}
      />
    )
    await waitFor(() => expect(screen.getByText('모집공고')).toBeInTheDocument())
    expect(screen.queryByText('특별공급')).not.toBeInTheDocument()
    expect(screen.queryByText('당첨자 발표')).not.toBeInTheDocument()
  })

  it('오늘 진행 중인 단계에 진행중 텍스트를 표시한다', async () => {
    render(
      <SubscriptionTimeline
        announceDate="2025-05-01"
        specialSupplyDate={null}
        priority1Date="2025-05-28"
        applyEnd="2025-05-29"
        winnerDate={null}
        contractStart={null}
        contractEnd={null}
      />
    )
    await waitFor(() => expect(screen.getByText('(진행중)')).toBeInTheDocument())
  })
})
