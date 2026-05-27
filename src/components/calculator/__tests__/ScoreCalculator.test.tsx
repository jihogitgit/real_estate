import { describe, it, expect } from 'vitest'
import { calculateScore, MAX_SCORE } from '../ScoreCalculator'

describe('calculateScore', () => {
  it('최고 점수를 계산한다', () => {
    const score = calculateScore({
      homelessYears: 15,
      savingsYears: 15,
      dependents: 6,
    })
    expect(score).toBe(84)
  })

  it('최저 점수를 계산한다', () => {
    const score = calculateScore({
      homelessYears: 0,
      savingsYears: 0,
      dependents: 0,
    })
    expect(score).toBe(8) // 무주택0년=2 + 부양0명=5 + 통장0년=1
  })

  it('MAX_SCORE는 84이다', () => {
    expect(MAX_SCORE).toBe(84)
  })

  it('부양가족 점수 범위를 준수한다', () => {
    // 부양가족 0명 = 5점, 6명 이상 = 35점
    expect(calculateScore({ homelessYears: 0, savingsYears: 0, dependents: 0 })).toBe(8)  // 2+5+1
    expect(calculateScore({ homelessYears: 0, savingsYears: 0, dependents: 6 })).toBe(38) // 2+35+1
  })
})
