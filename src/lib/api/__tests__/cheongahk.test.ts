import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchApartmentList, normalizeApartment } from '../cheongahk'
import type { CheongahkItem } from '@/types'

const mockItem: CheongahkItem = {
  pblancNo: 'TEST001',
  pblancNm: '테스트 아파트',
  rceptBgnde: '20250601',
  rceptEndde: '20250605',
  suplyRgnde: '서울 강남구',
  totSuplyHshldco: 100,
}

describe('normalizeApartment', () => {
  it('공공 API 필드를 Apartment 형태로 변환한다', () => {
    const result = normalizeApartment(mockItem)
    expect(result).toEqual({
      source_id: 'TEST001',
      name: '테스트 아파트',
      region: '서울',
      district: '강남구',
      address: null,
      apply_start: '2025-06-01',
      apply_end: '2025-06-05',
      total_units: 100,
    })
  })

  it('지역이 없으면 빈 문자열로 처리한다', () => {
    const result = normalizeApartment({ ...mockItem, suplyRgnde: '' })
    expect(result.region).toBe('')
    expect(result.district).toBe('')
  })

  it('세대수 없으면 0으로 처리한다', () => {
    const result = normalizeApartment({ ...mockItem, totSuplyHshldco: undefined as unknown as number })
    expect(result.total_units).toBe(0)
  })
})

describe('fetchApartmentList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('API 응답에서 items 배열을 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: { body: { items: { item: [mockItem] } } },
      }),
    } as Response)

    const result = await fetchApartmentList()
    expect(result).toHaveLength(1)
    expect(result[0].pblancNo).toBe('TEST001')
  })

  it('items가 없으면 빈 배열을 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: { body: { items: {} } },
      }),
    } as Response)

    const result = await fetchApartmentList()
    expect(result).toEqual([])
  })

  it('HTTP 오류 시 에러를 던진다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    await expect(fetchApartmentList()).rejects.toThrow('청약홈 API error: 500')
  })
})
