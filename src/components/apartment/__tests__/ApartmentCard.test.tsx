import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ApartmentCard from '../ApartmentCard'
import type { Apartment } from '@/types'

const mockApartment: Apartment = {
  id: 'uuid-1',
  name: '테스트 아파트',
  region: '서울',
  district: '강남구',
  address: '서울 강남구 테스트로 1',
  lat: 37.5,
  lng: 127.0,
  supply_date: null,
  apply_start: '2025-06-01',
  apply_end: '2025-06-05',
  total_units: 100,
  min_price: 50000,
  max_price: 80000,
  source_id: 'SRC001',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('ApartmentCard', () => {
  it('단지명을 표시한다', () => {
    render(<ApartmentCard apartment={mockApartment} />)
    expect(screen.getByText('테스트 아파트')).toBeInTheDocument()
  })

  it('지역을 표시한다', () => {
    render(<ApartmentCard apartment={mockApartment} />)
    expect(screen.getByText(/서울/)).toBeInTheDocument()
  })

  it('세대수를 표시한다', () => {
    render(<ApartmentCard apartment={mockApartment} />)
    expect(screen.getByText(/100세대/)).toBeInTheDocument()
  })

  it('apply_start가 없어도 크래시 없이 렌더링된다', () => {
    render(<ApartmentCard apartment={{ ...mockApartment, apply_start: null }} />)
    expect(screen.getByText('테스트 아파트')).toBeInTheDocument()
  })
})
