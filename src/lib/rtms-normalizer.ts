import { createHash } from 'crypto'
import type {
  RtmsAptTradeItem, RtmsAptRentItem, RtmsOffiTradeItem, RtmsOffiRentItem,
  RtmsMultiTradeItem, RtmsMultiRentItem, RtmsServiceName,
  AptTradeInsert, AptRentInsert, OffiTradeInsert, OffiRentInsert,
  MultiTradeInsert, MultiRentInsert,
} from '@/types/rtms'

export function parsePrice(val: string | undefined): number {
  if (!val) return 0
  const n = parseInt(val.replace(/,/g, ''), 10)
  return isNaN(n) ? 0 : n
}

export function makeDealDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function makeSourceHash(parts: string[]): string {
  return createHash('md5').update(parts.join('|')).digest('hex')
}

export function normalizeAptTrade(
  item: RtmsAptTradeItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): AptTradeInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const price = parsePrice(item.거래금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.아파트 ?? '', area, floor, String(price), item.법정동본번코드 ?? ''])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    apt_dong: null,
    jibun: item.법정동본번코드 ? `${item.법정동본번코드}-${item.법정동부번코드 ?? '0'}` : null,
    bonbun: item.법정동본번코드 ?? null,
    bubun: item.법정동부번코드 ?? null,
    apt_nm: item.아파트 ?? null,
    apt_seq: item.단지코드 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    price,
    deal_date: dealDate,
    road_nm: item.도로명 ?? null,
    dealing_gbn: item.거래유형 ?? null,
    rgst_date: item.등기일자 ?? null,
    buyer_gbn: item.매수자 ?? null,
    seller_gbn: item.매도자 ?? null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeAptRent(
  item: RtmsAptRentItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): AptRentInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const deposit = parsePrice(item.보증금액)
  const monthlyRent = parsePrice(item.월세금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.아파트 ?? '', area, floor, String(deposit), String(monthlyRent)])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    apt_dong: null,
    jibun: null,
    apt_nm: item.아파트 ?? null,
    apt_seq: item.단지코드 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    deposit,
    monthly_rent: monthlyRent,
    deal_date: dealDate,
    contract_type: item.계약구분 ?? null,
    contract_term: item.계약기간 ?? null,
    use_rr_right: item.갱신요구권사용 ?? null,
    prev_deposit: item.종전계약보증금 ? parsePrice(item.종전계약보증금) : null,
    prev_monthly_rent: item.종전계약월세 ? parsePrice(item.종전계약월세) : null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeOffiTrade(
  item: RtmsOffiTradeItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): OffiTradeInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const price = parsePrice(item.거래금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.단지명 ?? '', area, floor, String(price), item.지번 ?? ''])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    offi_nm: item.단지명 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    price,
    deal_date: dealDate,
    dealing_gbn: item.거래유형 ?? null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeOffiRent(
  item: RtmsOffiRentItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): OffiRentInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const deposit = parsePrice(item.보증금)
  const monthlyRent = parsePrice(item.월세)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.단지명 ?? '', area, floor, String(deposit), String(monthlyRent)])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    offi_nm: item.단지명 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    deposit,
    monthly_rent: monthlyRent,
    deal_date: dealDate,
    contract_type: item.계약구분 ?? null,
    contract_term: item.계약기간 ?? null,
    use_rr_right: item.갱신요구권사용 ?? null,
    prev_deposit: item.종전계약보증금 ? parsePrice(item.종전계약보증금) : null,
    prev_monthly_rent: item.종전계약월세 ? parsePrice(item.종전계약월세) : null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeMultiTrade(
  item: RtmsMultiTradeItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): MultiTradeInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const price = parsePrice(item.거래금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.연립다세대 ?? '', area, floor, String(price), item.지번 ?? ''])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    bonbun: null,
    bubun: null,
    house_nm: item.연립다세대 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    price,
    deal_date: dealDate,
    dealing_gbn: item.거래유형 ?? null,
    rgst_date: item.등기일자 ?? null,
    buyer_gbn: item.매수자 ?? null,
    seller_gbn: item.매도자 ?? null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}

export function normalizeMultiRent(
  item: RtmsMultiRentItem,
  lawdCd: string,
  requestYm: string,
  sourceApi: RtmsServiceName,
): MultiRentInsert {
  const dealDate = makeDealDate(item.년 ?? '', item.월 ?? '', item.일 ?? '')
  const deposit = parsePrice(item.보증금액)
  const monthlyRent = parsePrice(item.월세금액)
  const area = item.전용면적 ? String(parseFloat(item.전용면적)) : ''
  const floor = item.층 ?? ''
  const hash = makeSourceHash([lawdCd, dealDate, item.연립다세대 ?? '', area, floor, String(deposit), String(monthlyRent)])

  return {
    lawd_cd: lawdCd,
    request_ym: requestYm,
    umd_nm: item.법정동 ?? null,
    jibun: item.지번 ?? null,
    house_nm: item.연립다세대 ?? null,
    build_year: item.건축년도 ? parseInt(item.건축년도, 10) : null,
    area: item.전용면적 ? parseFloat(item.전용면적) : null,
    floor: item.층 ? parseInt(item.층, 10) : null,
    deposit,
    monthly_rent: monthlyRent,
    deal_date: dealDate,
    contract_type: item.계약구분 ?? null,
    contract_term: item.계약기간 ?? null,
    use_rr_right: item.갱신요구권사용 ?? null,
    prev_deposit: item.종전계약보증금 ? parsePrice(item.종전계약보증금) : null,
    prev_monthly_rent: item.종전계약월세 ? parsePrice(item.종전계약월세) : null,
    source_api: sourceApi,
    source_hash: hash,
    raw_item: item as Record<string, unknown>,
  }
}
