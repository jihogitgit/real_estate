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
}

// 청약홈 공공 API 응답 원본 필드
export interface CheongahkItem {
  pblancNo: string       // 공고번호
  pblancNm: string       // 공고명
  rceptBgnde: string     // 접수 시작일 (YYYYMMDD)
  rceptEndde: string     // 접수 종료일 (YYYYMMDD)
  suplyRgnde: string     // 공급 지역 (예: "서울 강남구")
  totSuplyHshldco: number // 총 공급 세대수
  mnareaExcludePrivateRoadar?: number // 전용면적
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
