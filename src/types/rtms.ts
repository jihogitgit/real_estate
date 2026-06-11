// ── Raw API response types ────────────────────────────────────

export interface RtmsAptTradeItem {
  법정동?: string
  법정동본번코드?: string
  법정동부번코드?: string
  아파트?: string
  단지코드?: string
  건축년도?: string
  전용면적?: string
  층?: string
  거래금액?: string
  년?: string
  월?: string
  일?: string
  도로명?: string
  거래유형?: string
  등기일자?: string
  매수자?: string
  매도자?: string
  [key: string]: string | undefined
}

export interface RtmsAptRentItem {
  법정동?: string
  아파트?: string
  단지코드?: string
  건축년도?: string
  전용면적?: string
  층?: string
  보증금액?: string
  월세금액?: string
  년?: string
  월?: string
  일?: string
  계약구분?: string
  계약기간?: string
  갱신요구권사용?: string
  종전계약보증금?: string
  종전계약월세?: string
  [key: string]: string | undefined
}

export interface RtmsOffiTradeItem {
  법정동?: string
  지번?: string
  단지명?: string
  건축년도?: string
  전용면적?: string
  층?: string
  거래금액?: string
  년?: string
  월?: string
  일?: string
  거래유형?: string
  [key: string]: string | undefined
}

export interface RtmsOffiRentItem {
  법정동?: string
  지번?: string
  단지명?: string
  건축년도?: string
  전용면적?: string
  층?: string
  보증금?: string
  월세?: string
  년?: string
  월?: string
  일?: string
  계약구분?: string
  계약기간?: string
  갱신요구권사용?: string
  종전계약보증금?: string
  종전계약월세?: string
  [key: string]: string | undefined
}

export interface RtmsMultiTradeItem {
  법정동?: string
  지번?: string
  연립다세대?: string
  건축년도?: string
  전용면적?: string
  층?: string
  거래금액?: string
  년?: string
  월?: string
  일?: string
  거래유형?: string
  등기일자?: string
  매수자?: string
  매도자?: string
  [key: string]: string | undefined
}

export interface RtmsMultiRentItem {
  법정동?: string
  지번?: string
  연립다세대?: string
  건축년도?: string
  전용면적?: string
  층?: string
  보증금액?: string
  월세금액?: string
  년?: string
  월?: string
  일?: string
  계약구분?: string
  계약기간?: string
  갱신요구권사용?: string
  종전계약보증금?: string
  종전계약월세?: string
  [key: string]: string | undefined
}

export type RtmsApiItem =
  | RtmsAptTradeItem
  | RtmsAptRentItem
  | RtmsOffiTradeItem
  | RtmsOffiRentItem
  | RtmsMultiTradeItem
  | RtmsMultiRentItem

// ── DB row insert types ───────────────────────────────────────

export interface AptTradeInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  apt_dong?: string | null
  jibun?: string | null
  bonbun?: string | null
  bubun?: string | null
  apt_nm?: string | null
  apt_seq?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  price: number
  deal_date: string
  road_nm?: string | null
  dealing_gbn?: string | null
  rgst_date?: string | null
  buyer_gbn?: string | null
  seller_gbn?: string | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface AptRentInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  apt_dong?: string | null
  jibun?: string | null
  apt_nm?: string | null
  apt_seq?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  deposit: number
  monthly_rent: number
  deal_date: string
  contract_type?: string | null
  contract_term?: string | null
  use_rr_right?: string | null
  prev_deposit?: number | null
  prev_monthly_rent?: number | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface OffiTradeInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  offi_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  price: number
  deal_date: string
  dealing_gbn?: string | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface OffiRentInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  offi_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  deposit: number
  monthly_rent: number
  deal_date: string
  contract_type?: string | null
  contract_term?: string | null
  use_rr_right?: string | null
  prev_deposit?: number | null
  prev_monthly_rent?: number | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface MultiTradeInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  bonbun?: string | null
  bubun?: string | null
  house_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  price: number
  deal_date: string
  dealing_gbn?: string | null
  rgst_date?: string | null
  buyer_gbn?: string | null
  seller_gbn?: string | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export interface MultiRentInsert {
  lawd_cd: string
  request_ym: string
  umd_nm?: string | null
  jibun?: string | null
  house_nm?: string | null
  build_year?: number | null
  area?: number | null
  floor?: number | null
  deposit: number
  monthly_rent: number
  deal_date: string
  contract_type?: string | null
  contract_term?: string | null
  use_rr_right?: string | null
  prev_deposit?: number | null
  prev_monthly_rent?: number | null
  source_api: string
  source_hash: string
  raw_item: Record<string, unknown>
}

export type RtmsInsertRow =
  | AptTradeInsert
  | AptRentInsert
  | OffiTradeInsert
  | OffiRentInsert
  | MultiTradeInsert
  | MultiRentInsert

// ── Service config ────────────────────────────────────────────

export type RtmsServiceName =
  | 'getRTMSDataSvcAptTradeDev'
  | 'getRTMSDataSvcAptRent'
  | 'getRTMSDataSvcOffiTrade'
  | 'getRTMSDataSvcOffiRent'
  | 'getRTMSDataSvcRHDwelling'
  | 'getRTMSDataSvcRHDwellingRent'

export type RtmsTableName =
  | 'apt_trades'
  | 'apt_rents'
  | 'offi_trades'
  | 'offi_rents'
  | 'multi_trades'
  | 'multi_rents'

export interface RtmsServiceConfig {
  service: RtmsServiceName
  table: RtmsTableName
}

export const RTMS_SERVICES: RtmsServiceConfig[] = [
  { service: 'getRTMSDataSvcAptTradeDev', table: 'apt_trades' },
  { service: 'getRTMSDataSvcAptRent',     table: 'apt_rents' },
  { service: 'getRTMSDataSvcOffiTrade',   table: 'offi_trades' },
  { service: 'getRTMSDataSvcOffiRent',    table: 'offi_rents' },
  { service: 'getRTMSDataSvcRHDwelling',  table: 'multi_trades' },
  { service: 'getRTMSDataSvcRHDwellingRent', table: 'multi_rents' },
]
