import type { RtmsApiItem, RtmsServiceName } from '@/types/rtms'

const BASE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvc'

export interface FetchRtmsPageParams {
  service: RtmsServiceName
  lawdCd: string
  dealYmd: string
  pageNo: number
  apiKey: string
}

export interface FetchRtmsPageResult {
  items: RtmsApiItem[]
  totalCount: number
  numOfRows: number
}

export function extractItems(body: unknown): RtmsApiItem[] {
  const items = (body as Record<string, unknown>)?.response
    ? ((body as Record<string, unknown>).response as Record<string, unknown>)?.body
      ? (((body as Record<string, unknown>).response as Record<string, unknown>).body as Record<string, unknown>)?.items
      : undefined
    : undefined

  if (!items || typeof items === 'string') return []

  const item = (items as Record<string, unknown>).item
  if (!item) return []
  if (Array.isArray(item)) return item as RtmsApiItem[]
  return [item as RtmsApiItem]
}

export async function fetchRtmsPage({
  service,
  lawdCd,
  dealYmd,
  pageNo,
  apiKey,
}: FetchRtmsPageParams): Promise<FetchRtmsPageResult> {
  const url = new URL(`${BASE_URL}/${service}`)
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('LAWD_CD', lawdCd)
  url.searchParams.set('DEAL_YMD', dealYmd)
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', '1000')
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`RTMS API error: ${res.status}`)

  const data = await res.json()
  const body = (data as Record<string, unknown>)?.response as Record<string, unknown> | undefined
  const bodyData = body?.body as Record<string, unknown> | undefined
  const totalCount = Number(bodyData?.totalCount ?? 0)
  const numOfRows = Number(bodyData?.numOfRows ?? 1000)
  const items = extractItems(data)

  return { items, totalCount, numOfRows }
}

export async function fetchAllRtmsItems({
  service,
  lawdCd,
  dealYmd,
  apiKey,
}: Omit<FetchRtmsPageParams, 'pageNo'>): Promise<RtmsApiItem[]> {
  const all: RtmsApiItem[] = []
  let pageNo = 1

  while (true) {
    const { items, numOfRows } = await fetchRtmsPage({ service, lawdCd, dealYmd, pageNo, apiKey })
    all.push(...items)
    if (items.length < numOfRows) break
    pageNo++
  }

  return all
}
