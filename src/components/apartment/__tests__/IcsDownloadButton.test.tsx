import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IcsDownloadButton from '../IcsDownloadButton'

describe('IcsDownloadButton', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('날짜가 있으면 버튼을 표시한다', () => {
    render(
      <IcsDownloadButton
        name="테스트 아파트"
        priority1Date="2025-06-01"
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        pblancUrl={null}
      />
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('모든 날짜가 null이면 렌더링하지 않는다', () => {
    const { container } = render(
      <IcsDownloadButton
        name="테스트 아파트"
        priority1Date={null}
        applyEnd={null}
        winnerDate={null}
        contractStart={null}
        pblancUrl={null}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('클릭 시 createObjectURL을 호출하고 링크를 클릭한다', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(
      <IcsDownloadButton
        name="테스트 아파트"
        priority1Date="2025-06-01"
        applyEnd={null}
        winnerDate="2025-06-10"
        contractStart={null}
        pblancUrl={null}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
  })
})
