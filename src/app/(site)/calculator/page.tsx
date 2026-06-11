import type { Metadata } from 'next'
import ScoreCalculator from '@/components/calculator/ScoreCalculator'

export const metadata: Metadata = {
  title: '청약 가점 계산기 — 내 청약 점수 확인',
  description: '무주택 기간, 부양가족 수, 청약통장 가입기간으로 나의 청약 가점을 계산하세요. 청약 당첨 가능성을 미리 확인해보세요.',
  openGraph: {
    title: '청약 가점 계산기 | 청약마당',
    description: '무주택 기간, 부양가족, 청약통장으로 가점 자동 계산',
  },
}

export default function CalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">청약 가점 계산기</h1>
        <p className="text-gray-500">나의 청약 가점을 계산하고 당첨 가능성을 확인하세요</p>
      </div>

      <ScoreCalculator />

      <section className="max-w-2xl mx-auto mt-12 text-sm text-gray-600 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">청약 가점제 안내</h2>
        <p>청약 가점제는 무주택기간(32점), 부양가족 수(35점), 청약통장 가입기간(17점) 3가지 항목으로 구성되며 최고 84점입니다.</p>
        <p>가점제는 85㎡ 이하 민영주택 일반공급에 적용됩니다. 투기과열지구·청약과열지역에서는 100% 가점제, 그 외 지역은 40%~75% 가점제로 운영됩니다.</p>
      </section>
    </div>
  )
}
