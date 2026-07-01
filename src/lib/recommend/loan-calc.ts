export function calcMaxLoan(annualIncome: number, rate: number, termYears: number): number {
  if (annualIncome <= 0 || termYears <= 0) return 0
  const monthlyPayable = (annualIncome * 10000 * 0.4) / 12
  if (rate === 0) {
    return Math.floor((monthlyPayable * termYears * 12) / 10000)
  }
  const r = rate / 12 / 100
  const n = termYears * 12
  const maxLoan = monthlyPayable * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)))
  return Math.floor(maxLoan / 10000)
}
