import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ApartmentChecklist from '../ApartmentChecklist'

describe('ApartmentChecklist', () => {
  it('공통 항목 4개를 표시한다', () => {
    render(<ApartmentChecklist priceCap={null} houseType={null} />)
    expect(screen.getByText(/청약통장 1순위 조건/)).toBeInTheDocument()
    expect(screen.getByText(/무주택 세대주/)).toBeInTheDocument()
    expect(screen.getByText(/계약금 준비/)).toBeInTheDocument()
    expect(screen.getByText(/중도금 대출/)).toBeInTheDocument()
  })

  it('price_cap이 true이면 실거주의무 항목을 표시한다', () => {
    render(<ApartmentChecklist priceCap={true} houseType={null} />)
    expect(screen.getByText(/분양가상한제 적용/)).toBeInTheDocument()
    expect(screen.getByText(/실거주의무/)).toBeInTheDocument()
  })

  it('price_cap이 false이면 전매제한 항목을 표시한다', () => {
    render(<ApartmentChecklist priceCap={false} houseType={null} />)
    expect(screen.getByText(/전매제한 기간/)).toBeInTheDocument()
    expect(screen.queryByText(/분양가상한제 적용/)).not.toBeInTheDocument()
  })

  it('price_cap이 null이면 전매제한 항목을 표시한다', () => {
    render(<ApartmentChecklist priceCap={null} houseType={null} />)
    expect(screen.getByText(/전매제한 기간/)).toBeInTheDocument()
  })

  it('면책 문구를 표시한다', () => {
    render(<ApartmentChecklist priceCap={null} houseType={null} />)
    expect(screen.getByText(/참고용입니다/)).toBeInTheDocument()
  })
})
