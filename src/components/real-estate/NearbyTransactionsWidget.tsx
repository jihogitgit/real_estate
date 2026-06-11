import { createClient } from '@/lib/supabase/server'

interface Props {
  apartmentName: string
  district: string | null
}

interface TradeRow {
  deal_date: string
  area: number | null
  floor: number | null
  price: number | null
  apt_nm: string | null
}

async function getLawdCd(district: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('regions')
    .select('lawd_cd')
    .ilike('sigungu_nm', `%${district}%`)
    .limit(1)
    .single()
  return data?.lawd_cd ?? null
}

async function getNearbyTrades(lawdCd: string, aptNm: string): Promise<TradeRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apt_trades')
    .select('deal_date, area, floor, price, apt_nm')
    .eq('lawd_cd', lawdCd)
    .ilike('apt_nm', `%${aptNm}%`)
    .order('deal_date', { ascending: false })
    .limit(10)
  return (data ?? []) as TradeRow[]
}

function formatPrice(price: number | null): string {
  if (!price) return '-'
  if (price >= 10000) return `${(price / 10000).toFixed(1)}억`
  return `${price.toLocaleString()}만`
}

export default async function NearbyTransactionsWidget({ apartmentName, district }: Props) {
  if (!district) return null

  const lawdCd = await getLawdCd(district)
  if (!lawdCd) return null

  const trades = await getNearbyTrades(lawdCd, apartmentName)
  if (trades.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold mb-3">주변 실거래가</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b">
              <th className="text-left pb-2 font-medium">단지</th>
              <th className="text-right pb-2 font-medium">면적</th>
              <th className="text-right pb-2 font-medium">층</th>
              <th className="text-right pb-2 font-medium">거래가</th>
              <th className="text-right pb-2 font-medium">거래일</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700 max-w-[140px] truncate">{t.apt_nm ?? '-'}</td>
                <td className="py-2 text-right text-gray-600">{t.area ? `${t.area}㎡` : '-'}</td>
                <td className="py-2 text-right text-gray-600">{t.floor ? `${t.floor}층` : '-'}</td>
                <td className="py-2 text-right font-medium text-blue-600">{formatPrice(t.price)}</td>
                <td className="py-2 text-right text-gray-400">{t.deal_date?.slice(0, 7) ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">국토교통부 실거래가 공개시스템 제공</p>
    </div>
  )
}
