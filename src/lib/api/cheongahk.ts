import type { CheongahkItem, NormalizedApartment } from '@/types'

const BASE_URL = 'https://apis.data.go.kr/B552555/APTLttotPblancDetail'

function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export function normalizeApartment(item: CheongahkItem): NormalizedApartment {
  const parts = (item.suplyRgnde ?? '').split(' ')
  return {
    source_id: item.pblancNo,
    name: item.pblancNm,
    region: parts[0] ?? '',
    district: parts[1] ?? '',
    address: null,
    apply_start: formatDate(item.rceptBgnde),
    apply_end: formatDate(item.rceptEndde),
    total_units: item.totSuplyHshldco ?? 0,
  }
}

export async function fetchApartmentList(params: {
  pageNo?: number
  numOfRows?: number
} = {}): Promise<CheongahkItem[]> {
  const { pageNo = 1, numOfRows = 100 } = params
  const apiKey = process.env.CHEONGAHK_API_KEY

  const url = new URL(`${BASE_URL}/getLttotPblancSummaryList`)
  url.searchParams.set('serviceKey', apiKey ?? '')
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', String(numOfRows))
  url.searchParams.set('_type', 'json')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`청약홈 API error: ${res.status}`)

  const data = await res.json()
  return data?.response?.body?.items?.item ?? []
}
