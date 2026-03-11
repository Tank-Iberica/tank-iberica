import { describe, it, expect } from 'vitest'
import {
  roundTwo,
  calculateFinancing,
  calculateTotalCost,
  estimateInsurance,
  estimateMaintenance,
  formatCurrencyFromCents,
  ITP_RATES,
} from '../../../app/utils/financeCalculator.helpers'

describe('financeCalculator.helpers — roundTwo', () => {
  it('rounds to 2 decimals', () => {
    expect(roundTwo(1.005)).toBe(1.01)
    expect(roundTwo(1.004)).toBe(1)
    expect(roundTwo(123.456)).toBe(123.46)
    expect(roundTwo(0)).toBe(0)
  })
})

describe('financeCalculator.helpers — calculateFinancing', () => {
  it('calculates standard loan', () => {
    const result = calculateFinancing({
      price: 50000,
      downPayment: 10000,
      interestRate: 5,
      termMonths: 60,
    })
    expect(result.monthlyPayment).toBeGreaterThan(0)
    expect(result.totalPayment).toBeGreaterThan(40000)
    expect(result.totalInterest).toBeGreaterThan(0)
    expect(result.amortizationSchedule).toHaveLength(60)
  })

  it('handles zero-interest loan', () => {
    const result = calculateFinancing({
      price: 12000,
      downPayment: 0,
      interestRate: 0,
      termMonths: 12,
    })
    expect(result.monthlyPayment).toBe(1000)
    expect(result.totalInterest).toBe(0)
  })

  it('returns zeros when principal <= 0', () => {
    const result = calculateFinancing({
      price: 5000,
      downPayment: 6000,
      interestRate: 5,
      termMonths: 12,
    })
    expect(result.monthlyPayment).toBe(0)
    expect(result.amortizationSchedule).toHaveLength(0)
  })

  it('returns zeros when termMonths <= 0', () => {
    const result = calculateFinancing({
      price: 5000,
      downPayment: 0,
      interestRate: 5,
      termMonths: 0,
    })
    expect(result.monthlyPayment).toBe(0)
  })

  it('last payment zeroes out balance', () => {
    const result = calculateFinancing({
      price: 30000,
      downPayment: 5000,
      interestRate: 7,
      termMonths: 36,
    })
    const lastRow = result.amortizationSchedule[35]
    expect(lastRow.balance).toBe(0)
  })
})

describe('financeCalculator.helpers — calculateTotalCost', () => {
  it('calculates total cost with ITP', () => {
    const result = calculateTotalCost({
      price: 40000,
      comunidad: 'Madrid',
      insuranceAnnual: 2000,
      maintenanceAnnual: 3000,
      years: 3,
    })
    expect(result.transferTax).toBe(1600) // 4% of 40000
    expect(result.insurance).toHaveLength(3)
    expect(result.grandTotal).toBeGreaterThan(40000 + 1600)
  })

  it('uses default 4% for unknown comunidad', () => {
    const result = calculateTotalCost({
      price: 10000,
      comunidad: 'Unknown',
      insuranceAnnual: 100,
      maintenanceAnnual: 100,
      years: 1,
    })
    expect(result.transferTax).toBe(400)
  })

  it('handles 0 years', () => {
    const result = calculateTotalCost({
      price: 10000,
      comunidad: 'Madrid',
      insuranceAnnual: 100,
      maintenanceAnnual: 100,
      years: 0,
    })
    expect(result.grandTotal).toBe(10400)
    expect(result.insurance).toHaveLength(0)
  })
})

describe('financeCalculator.helpers — estimateInsurance', () => {
  it('returns base for young vehicle', () => {
    expect(estimateInsurance('camión', 3)).toBe(2150)
  })

  it('adds age surcharge after 5 years', () => {
    const result = estimateInsurance('camión', 10)
    expect(result).toBeGreaterThan(2150)
  })

  it('identifies semirremolque', () => {
    expect(estimateInsurance('Semirremolque frigorífico', 3)).toBe(1000)
  })

  it('identifies cabeza tractora', () => {
    expect(estimateInsurance('Cabeza tractora', 3)).toBe(2750)
  })
})

describe('financeCalculator.helpers — estimateMaintenance', () => {
  it('returns base for low-age low-km vehicle', () => {
    expect(estimateMaintenance('camión', 3, 100000)).toBe(4000)
  })

  it('adds km surcharge over 200k', () => {
    const result = estimateMaintenance('camión', 3, 400000)
    expect(result).toBe(4000 + 1000) // 2 x 500 for 200k excess
  })

  it('adds age surcharge over 5 years', () => {
    const result = estimateMaintenance('camión', 10, 100000)
    expect(result).toBe(4000 + 4000 * 5 * 0.1) // 5 extra years * 10%
  })
})

describe('financeCalculator.helpers — formatCurrencyFromCents', () => {
  it('formats cents to EUR', () => {
    const result = formatCurrencyFromCents(1234567)
    expect(result).toContain('12.345,67')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = formatCurrencyFromCents(0)
    expect(result).toContain('0,00')
  })
})

describe('financeCalculator.helpers — ITP_RATES', () => {
  it('contains all 19 comunidades', () => {
    expect(ITP_RATES).toHaveLength(19)
  })

  it('Madrid has 4% rate', () => {
    const madrid = ITP_RATES.find((r) => r.comunidad === 'Madrid')
    expect(madrid?.rate).toBe(4)
  })

  it('Valencia has 6% rate', () => {
    const val = ITP_RATES.find((r) => r.comunidad === 'Valencia')
    expect(val?.rate).toBe(6)
  })
})
