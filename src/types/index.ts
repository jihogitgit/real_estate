export interface Apartment {
  id: string
  name: string
  region: string
  district: string | null
  address: string | null
  lat: number | null
  lng: number | null
  supply_date: string | null
  apply_start: string | null
  apply_end: string | null
  total_units: number | null
  min_price: number | null
  max_price: number | null
  source_id: string
  created_at: string
  updated_at: string
  announce_date: string | null
  special_supply_date: string | null
  priority1_date: string | null
  winner_date: string | null
  contract_start: string | null
  contract_end: string | null
  move_in_month: string | null
  pblanc_url: string | null
  price_cap: boolean | null
  house_type: string | null
}

// 청약홈 공공 API 응답 원본 필드 (ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail)
export interface CheongahkItem {
  PBLANC_NO: string
  HOUSE_NM: string
  RCEPT_BGNDE: string
  RCEPT_ENDDE: string
  SUBSCRPT_AREA_CODE_NM: string
  HSSPLY_ADRES: string
  TOT_SUPLY_HSHLDCO: number
  HOUSE_MANAGE_NO: string
  RCRIT_PBLANC_DE: string
  SPSPLY_RCEPT_BGNDE: string
  GNRL_RNK1_CRSPAREA_RCPTDE: string
  PRZWNER_PRESNATN_DE: string
  CNTRCT_CNCLS_BGNDE: string
  CNTRCT_CNCLS_ENDDE: string
  MVN_PREARNGE_YM: string
  PBLANC_URL: string
  PARCPRC_ULS_AT: string
  HOUSE_DTL_SECD_NM: string
}

export type NormalizedApartment = Omit<Apartment, 'id' | 'lat' | 'lng' | 'supply_date' | 'min_price' | 'max_price' | 'created_at' | 'updated_at'>

export interface Article {
  id: string
  slug: string
  title: string
  summary: string | null
  body: string | null
  category: 'news' | 'guide'
  published_at: string
  updated_at: string
}

export interface AlertRecord {
  id: string
  user_id: string
  apartment_id: string
  alert_days_before: number
  is_active: boolean
}

export interface SavedApartment {
  user_id: string
  apartment_id: string
  created_at: string
  apartment?: Apartment
}

export type Region =
  | '서울' | '경기' | '인천' | '부산' | '대구' | '대전'
  | '광주' | '울산' | '세종' | '강원' | '충북' | '충남'
  | '전북' | '전남' | '경북' | '경남' | '제주'

export const ALL_REGIONS: Region[] = [
  '서울', '경기', '인천', '부산', '대구', '대전',
  '광주', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]
