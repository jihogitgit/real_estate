import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRtmsPage, extractItems } from '@/lib/api/rtms'

describe('extractItems', () => {
  it('returns array when items.item is an array', () => {
    const body = { response: { body: { items: { item: [{ 아파트: 'A' }, { 아파트: 'B' }] }, numOfRows: 10, totalCount: 2 } } }
    expect(extractItems(body)).toHaveLength(2)
  })

  it('returns single-element array when items.item is an object', () => {
    const body = { response: { body: { items: { item: { 아파트: 'A' } }, numOfRows: 10, totalCount: 1 } } }
    expect(extractItems(body)).toHaveLength(1)
  })

  it('returns empty array when items is empty string', () => {
    const body = { response: { body: { items: '', numOfRows: 10, totalCount: 0 } } }
    expect(extractItems(body)).toEqual([])
  })

  it('returns empty array when items.item is absent', () => {
    const body = { response: { body: { items: {}, numOfRows: 10, totalCount: 0 } } }
    expect(extractItems(body)).toEqual([])
  })
})

describe('fetchRtmsPage', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('calls correct URL with params and returns items', async () => {
    const mockItems = [{ 아파트: 'TestApt', 거래금액: '55,000' }]
    const mockBody = {
      response: {
        body: {
          items: { item: mockItems },
          numOfRows: 1000,
          totalCount: 1,
        },
      },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBody),
    }))

    const result = await fetchRtmsPage({
      service: 'getRTMSDataSvcAptTradeDev',
      lawdCd: '11110',
      dealYmd: '202606',
      pageNo: 1,
      apiKey: 'test-key',
    })

    expect(fetch).toHaveBeenCalledOnce()
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('getRTMSDataSvcAptTradeDev')
    expect(calledUrl).toContain('LAWD_CD=11110')
    expect(calledUrl).toContain('DEAL_YMD=202606')
    expect(calledUrl).toContain('pageNo=1')
    expect(calledUrl).toContain('numOfRows=1000')
    expect(calledUrl).toContain('_type=json')
    expect(result.items).toEqual(mockItems)
    expect(result.totalCount).toBe(1)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(
      fetchRtmsPage({ service: 'getRTMSDataSvcAptTradeDev', lawdCd: '11110', dealYmd: '202606', pageNo: 1, apiKey: 'k' })
    ).rejects.toThrow('RTMS API error: 500')
  })
})
