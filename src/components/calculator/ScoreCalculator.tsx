'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// 무주택기간 점수 (연수 → 점수)
const HOMELESS_SCORES: [number, number][] = [
  [0, 2], [1, 4], [2, 6], [3, 8], [4, 10], [5, 12],
  [6, 14], [7, 16], [8, 18], [9, 20], [10, 22],
  [11, 24], [12, 26], [13, 28], [14, 30], [15, 32],
]

// 청약통장 가입기간 점수 (연수 → 점수)
const SAVINGS_SCORES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [6, 7], [7, 8], [8, 9], [9, 10], [10, 11],
  [11, 12], [12, 13], [13, 14], [14, 15], [15, 17],
]

// 부양가족 점수 (명 수 → 점수)
const DEPENDENTS_SCORES: [number, number][] = [
  [0, 5], [1, 10], [2, 15], [3, 20], [4, 25], [5, 30], [6, 35],
]

function lookupScore(table: [number, number][], years: number): number {
  const clamped = Math.max(0, Math.min(years, table[table.length - 1][0]))
  const entry = [...table].reverse().find(([y]) => y <= clamped)
  return entry ? entry[1] : table[0][1]
}

export interface ScoreInput {
  homelessYears: number
  savingsYears: number
  dependents: number
}

export function calculateScore({ homelessYears, savingsYears, dependents }: ScoreInput): number {
  return (
    lookupScore(HOMELESS_SCORES, homelessYears) +
    lookupScore(DEPENDENTS_SCORES, Math.min(dependents, 6)) +
    lookupScore(SAVINGS_SCORES, savingsYears)
  )
}

export const MAX_SCORE = 84

export default function ScoreCalculator() {
  const [homelessYears, setHomelessYears] = useState(0)
  const [savingsYears, setSavingsYears] = useState(0)
  const [dependents, setDependents] = useState(0)
  const [result, setResult] = useState<number | null>(null)

  function handleCalculate() {
    setResult(calculateScore({ homelessYears, savingsYears, dependents }))
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">청약 가점 계산기</h2>
        <p className="text-sm text-gray-500">최고 점수: {MAX_SCORE}점</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            무주택 기간: <span className="text-blue-600">{homelessYears}년</span>
          </label>
          <input
            type="range"
            min={0}
            max={15}
            value={homelessYears}
            onChange={(e) => setHomelessYears(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0년 (2점)</span>
            <span>15년 이상 (32점)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            청약통장 가입기간: <span className="text-blue-600">{savingsYears}년</span>
          </label>
          <input
            type="range"
            min={0}
            max={15}
            value={savingsYears}
            onChange={(e) => setSavingsYears(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>6개월 미만 (1점)</span>
            <span>15년 이상 (17점)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            부양가족 수: <span className="text-blue-600">{dependents}명</span>
          </label>
          <input
            type="range"
            min={0}
            max={6}
            value={dependents}
            onChange={(e) => setDependents(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0명 (5점)</span>
            <span>6명 이상 (35점)</span>
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          가점 계산하기
        </Button>

        {result !== null && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-700">{result}점</p>
            <p className="text-sm text-gray-500 mt-1">최고 {MAX_SCORE}점 중</p>
            <p className="text-xs text-gray-400 mt-2">
              * 본 계산기는 참고용입니다. 정확한 가점은 청약홈에서 확인하세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
