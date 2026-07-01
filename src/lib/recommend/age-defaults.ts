export type AgeGroup = '3040' | '5060'
export type DealType = 'trade' | 'jeonse'

export interface RecentTrade {
  apt_nm: string
  area: number
  price: number
  deal_date: string
}

export interface RegionStat {
  lawd_cd: string
  name: string
  avg_price: number
  count: number
  recent_trades: RecentTrade[]
}

// 출처: 통계청 가계금융복지조사 참고 (2025 기준 추정치)
// 실제 개인 상황에 따라 크게 다를 수 있음 — 반드시 직접 수정할 것
export const AGE_DEFAULTS: Record<AgeGroup, { savings: number; loan: number }> = {
  '3040': { savings: 15000, loan: 20000 },
  '5060': { savings: 30000, loan: 15000 },
}
