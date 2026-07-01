import { describe, it, expect } from 'vitest'
import { calcMaxLoan } from '../loan-calc'

describe('calcMaxLoan', () => {
  it('연소득 0 → 0', () => {
    expect(calcMaxLoan(0, 4, 30)).toBe(0)
  })

  it('기간 0 → 0', () => {
    expect(calcMaxLoan(5000, 4, 0)).toBe(0)
  })

  it('금리 0 → 원금 단순 합산 (연소득 5000, 30년)', () => {
    expect(calcMaxLoan(5000, 0, 30)).toBe(60000)
  })

  it('연소득 5000만, 금리 4%, 30년 → 3억 이상 4억 이하', () => {
    const result = calcMaxLoan(5000, 4, 30)
    expect(result).toBeGreaterThan(30000)
    expect(result).toBeLessThan(40000)
  })

  it('연소득이 높을수록 대출 한도가 높음', () => {
    expect(calcMaxLoan(8000, 4, 30)).toBeGreaterThan(calcMaxLoan(5000, 4, 30))
  })

  it('금리가 낮을수록 대출 한도가 높음', () => {
    expect(calcMaxLoan(5000, 3, 30)).toBeGreaterThan(calcMaxLoan(5000, 5, 30))
  })
})
