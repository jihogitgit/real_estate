import type { CheongahkItem, NormalizedApartment } from '@/types'

const BASE_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1'

export function normalizeApartment(item: CheongahkItem): NormalizedApartment {
  const addrParts = (item.HSSPLY_ADRES ?? '').split(' ')
  return {
    source_id: item.PBLANC_NO,
    name: item.HOUSE_NM,
    region: item.SUBSCRPT_AREA_CODE_NM ?? '',
    district: addrParts[1] ?? null,
    address: item.HSSPLY_ADRES ?? null,
    apply_start: item.RCEPT_BGNDE ?? null,
    apply_end: item.RCEPT_ENDDE ?? null,
    total_units: item.TOT_SUPLY_HSHLDCO ?? 0,
    announce_date: item.RCRIT_PBLANC_DE || null,
    special_supply_date: item.SPSPLY_RCEPT_BGNDE || null,
    priority1_date: item.GNRL_RNK1_CRSPAREA_RCPTDE || null,
    winner_date: item.PRZWNER_PRESNATN_DE || null,
    contract_start: item.CNTRCT_CNCLS_BGNDE || null,
    contract_end: item.CNTRCT_CNCLS_ENDDE || null,
    move_in_month: item.MVN_PREARNGE_YM || null,
    pblanc_url: item.PBLANC_URL || null,
    price_cap: item.PARCPRC_ULS_AT === 'Y',
    house_type: item.HOUSE_DTL_SECD_NM || null,
  }
}

export async function fetchApartmentList(params: {
  pageNo?: number
  numOfRows?: number
} = {}): Promise<CheongahkItem[]> {
  const { pageNo = 1, numOfRows = 100 } = params
  const apiKey = process.env.CHEONGAHK_API_KEY

  const url = new URL(`${BASE_URL}/getAPTLttotPblancDetail`)
  url.searchParams.set('serviceKey', apiKey ?? '')
  url.searchParams.set('page', String(pageNo))
  url.searchParams.set('perPage', String(numOfRows))

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`청약홈 API error: ${res.status}`)

  const data = await res.json()
  return data?.data ?? []
}
