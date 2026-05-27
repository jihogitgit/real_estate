import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

const mockCreateClient = vi.fn()
const mockGetOrSet = vi.fn((key, ttl, fetcher) => fetcher())

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/redis', () => ({
  getOrSet: mockGetOrSet,
  CACHE_KEYS: {
    apartmentsList: (region: string) => `apartments:list:${region}`,
    apartmentsDetail: (id: string) => `apartments:detail:${id}`,
    regionSummary: (name: string) => `region:summary:${name}`,
  },
  CACHE_TTL: {
    apartmentsList: 3600,
    apartmentsDetail: 21600,
    regionSummary: 7200,
  },
}))

describe('getApartmentsByRegion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [mockApartment], error: null }),
          }),
        }),
      }),
    })
  })

  it('region으로 필터링된 아파트 목록을 반환한다', async () => {
    const { getApartmentsByRegion } = await import('@/lib/apartments')
    const result = await getApartmentsByRegion('서울')
    expect(result).toHaveLength(1)
    expect(result[0].region).toBe('서울')
  })
})

describe('getApartmentById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockApartment, error: null }),
          }),
        }),
      }),
    })
  })

  it('id로 단지 상세 정보를 반환한다', async () => {
    const { getApartmentById } = await import('@/lib/apartments')
    const result = await getApartmentById('uuid-1')
    expect(result).not.toBeNull()
    expect(result?.name).toBe('테스트 아파트')
  })
})
