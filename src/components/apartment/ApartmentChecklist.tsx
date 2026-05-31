interface Props {
  priceCap: boolean | null
  houseType: string | null
}

const COMMON_ITEMS = [
  '청약통장 1순위 조건 충족 여부 확인',
  '무주택 세대주 여부 확인',
  '계약금 준비 (분양가의 10~20%)',
  '중도금 대출 가능 여부 확인',
]

export default function ApartmentChecklist({ priceCap }: Props) {
  const conditionalItem = priceCap === true
    ? '분양가상한제 적용 — 실거주의무·전매제한 최장 10년 확인'
    : '전매제한 기간 공고문에서 확인'

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h2 className="text-base font-semibold mb-3">신청 전 확인 체크리스트</h2>
      <ul className="space-y-2">
        {[...COMMON_ITEMS, conditionalItem].map(item => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-yellow-600 shrink-0">☐</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 mt-3">
        본 체크리스트는 참고용입니다. 실제 자격 확인은 청약홈 공고문을 기준으로 하세요.
      </p>
    </div>
  )
}
