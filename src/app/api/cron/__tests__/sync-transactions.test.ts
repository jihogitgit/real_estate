import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cron/sync-transactions/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        data: [{ lawd_cd: '11680' }],
        error: null,
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

vi.mock('@/lib/api/rtms', () => ({
  fetchAllRtmsItems: vi.fn().mockResolvedValue([]),
}))

describe('GET /api/cron/sync-transactions', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns 401 without correct Bearer token', async () => {
    process.env.CRON_SECRET = 'secret'
    const req = new NextRequest('http://localhost/api/cron/sync-transactions')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid Bearer token', async () => {
    process.env.CRON_SECRET = 'secret'
    process.env.CHEONGAHK_API_KEY = 'test-key'
    const req = new NextRequest('http://localhost/api/cron/sync-transactions', {
      headers: { authorization: 'Bearer secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('ym')
    expect(body).toHaveProperty('regions')
  })
})
