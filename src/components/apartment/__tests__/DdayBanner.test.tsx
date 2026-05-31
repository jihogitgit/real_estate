import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DdayBanner from '../DdayBanner'

describe('DdayBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-28T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('1순위 기준 D-3을 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-31"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('D-3')).toBeInTheDocument())
    expect(screen.getByText('1순위 접수 마감까지')).toBeInTheDocument()
  })

  it('priority1Date 없으면 applyEnd 기준으로 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date={null}
        applyEnd="2025-05-31"
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('D-3')).toBeInTheDocument())
    expect(screen.getByText('청약 마감까지')).toBeInTheDocument()
  })

  it('날짜가 지났으면 마감을 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-27"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('마감')).toBeInTheDocument())
  })

  it('오늘이 마감일이면 마감을 표시한다 (D-0은 마감)', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-28"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        moveInMonth={null}
      />
    )
    await waitFor(() => expect(screen.getByText('마감')).toBeInTheDocument())
  })

  it('winnerDate, contractStart, moveInMonth를 우측에 표시한다', async () => {
    render(
      <DdayBanner
        priority1Date="2025-05-31"
        applyEnd={null}
        winnerDate="2025-06-10"
        contractStart="2025-06-20"
        moveInMonth="202903"
      />
    )
    await waitFor(() => expect(screen.getByText(/당첨발표까지/)).toBeInTheDocument())
    expect(screen.getByText(/계약까지/)).toBeInTheDocument()
    expect(screen.getByText(/2029\.03/)).toBeInTheDocument()
  })
})
