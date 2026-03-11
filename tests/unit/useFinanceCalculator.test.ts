import { describe, it, expect } from 'vitest'
import { useFinanceCalculator } from '../../app/composables/useFinanceCalculator'

// ─── Setup ────────────────────────────────────────────────────────────────

function getCalc() {
  return useFinanceCalculator()
}

// ─── itpRates & selectedComunidad ─────────────────────────────────────────

describe('itpRates', () => {
  it('includes Madrid with rate 4', () => {
    const { itpRates } = getCalc()
    const madrid = itpRates.find((r) => r.comunidad === 'Madrid')
    expect(madrid?.rate).toBe(4)
  })

  it('includes Canarias with rate 5.5', () => {
    const { itpRates } = getCalc()
    const canarias = itpRates.find((r) => r.comunidad === 'Canarias')
    expect(canarias?.rate).toBe(5.5)
  })

  it('includes all 19 comunidades', () => {
    const { itpRates } = getCalc()
    expect(itpRates.length).toBe(19)
  })
})

describe('selectedComunidad', () => {
  it('defaults to Madrid', () => {
    const { selectedComunidad } = getCalc()
    expect(selectedComunidad.value).toBe('Madrid')
  })
})

// ─── calculateFinancing ───────────────────────────────────────────────────

describe('calculateFinancing', () => {
  const { calculateFinancing } = getCalc()

  it('returns zeros when principal is zero (downPayment >= price)', () => {
    const result = calculateFinancing({
      price: 50000, downPayment: 50000, interestRate: 5, termMonths: 60,
    })
    expect(result.monthlyPayment).toBe(0)
    expect(result.totalPayment).toBe(0)
    expect(result.totalInterest).toBe(0)
    expect(result.amortizationSchedule).toEqual([])
  })

  it('returns zeros when termMonths is 0', () => {
    const result = calculateFinancing({
      price: 50000, downPayment: 0, interestRate: 5, termMonths: 0,
    })
    expect(result.monthlyPayment).toBe(0)
    expect(result.amortizationSchedule).toEqual([])
  })

  it('zero-interest loan: monthly = principal / months', () => {
    const result = calculateFinancing({
      price: 12000, downPayment: 0, interestRate: 0, termMonths: 12,
    })
    expect(result.monthlyPayment).toBe(1000)
    expect(result.amortizationSchedule).toHaveLength(12)
  })

  it('builds amortization schedule with correct length', () => {
    const result = calculateFinancing({
      price: 60000, downPayment: 10000, interestRate: 4, termMonths: 24,
    })
    expect(result.amortizationSchedule).toHaveLength(24)
  })

  it('last amortization row has balance ~0', () => {
    const result = calculateFinancing({
      price: 50000, downPayment: 5000, interestRate: 5, termMonths: 36,
    })
    const lastRow = result.amortizationSchedule.at(-1)!
    expect(lastRow.balance).toBe(0)
  })

  it('totalPayment > principal for positive interest', () => {
    const result = calculateFinancing({
      price: 50000, downPayment: 0, interestRate: 6, termMonths: 48,
    })
    expect(result.totalPayment).toBeGreaterThan(50000)
    expect(result.totalInterest).toBeGreaterThan(0)
  })

  it('each schedule row has: month, payment, principal, interest, balance', () => {
    const result = calculateFinancing({
      price: 30000, downPayment: 0, interestRate: 3, termMonths: 12,
    })
    const row = result.amortizationSchedule[0]!
    expect(row).toHaveProperty('month')
    expect(row).toHaveProperty('payment')
    expect(row).toHaveProperty('principal')
    expect(row).toHaveProperty('interest')
    expect(row).toHaveProperty('balance')
  })

  it('month numbers are 1-based sequential', () => {
    const result = calculateFinancing({
      price: 10000, downPayment: 0, interestRate: 0, termMonths: 3,
    })
    expect(result.amortizationSchedule.map((r) => r.month)).toEqual([1, 2, 3])
  })
})

// ─── calculateTotalCost ───────────────────────────────────────────────────

describe('calculateTotalCost', () => {
  const { calculateTotalCost } = getCalc()

  it('applies Madrid ITP of 4%', () => {
    const result = calculateTotalCost({
      price: 100000, comunidad: 'Madrid', insuranceAnnual: 2000, maintenanceAnnual: 3000, years: 1,
    })
    expect(result.transferTax).toBe(4000)
  })

  it('applies Canarias ITP of 5.5%', () => {
    const result = calculateTotalCost({
      price: 100000, comunidad: 'Canarias', insuranceAnnual: 0, maintenanceAnnual: 0, years: 0,
    })
    expect(result.transferTax).toBe(5500)
  })

  it('defaults to 4% ITP for unknown comunidad', () => {
    const result = calculateTotalCost({
      price: 100000, comunidad: 'Unknown', insuranceAnnual: 0, maintenanceAnnual: 0, years: 0,
    })
    expect(result.transferTax).toBe(4000)
  })

  it('insurance and maintenance arrays have correct length', () => {
    const result = calculateTotalCost({
      price: 50000, comunidad: 'Madrid', insuranceAnnual: 2000, maintenanceAnnual: 3000, years: 5,
    })
    expect(result.insurance).toHaveLength(5)
    expect(result.maintenance).toHaveLength(5)
    expect(result.totalByYear).toHaveLength(5)
  })

  it('returns empty arrays and just price+ITP when years=0', () => {
    const result = calculateTotalCost({
      price: 50000, comunidad: 'Madrid', insuranceAnnual: 2000, maintenanceAnnual: 3000, years: 0,
    })
    expect(result.insurance).toHaveLength(0)
    expect(result.grandTotal).toBe(50000 + 2000) // price + 4% ITP
  })

  it('grandTotal increases with more years', () => {
    const params = { price: 50000, comunidad: 'Madrid', insuranceAnnual: 2000, maintenanceAnnual: 3000 }
    const r1 = calculateTotalCost({ ...params, years: 1 })
    const r5 = calculateTotalCost({ ...params, years: 5 })
    expect(r5.grandTotal).toBeGreaterThan(r1.grandTotal)
  })

  it('purchasePrice matches input price', () => {
    const result = calculateTotalCost({
      price: 75000, comunidad: 'Madrid', insuranceAnnual: 1000, maintenanceAnnual: 2000, years: 3,
    })
    expect(result.purchasePrice).toBe(75000)
  })
})

// ─── estimateInsurance ────────────────────────────────────────────────────

describe('estimateInsurance', () => {
  const { estimateInsurance } = getCalc()

  it('semirremolque base is 1000', () => {
    expect(estimateInsurance('semirremolque', 0)).toBe(1000)
  })

  it('cabeza tractora base is 2750', () => {
    expect(estimateInsurance('Cabeza Tractora', 0)).toBe(2750)
  })

  it('camión base is 2150', () => {
    expect(estimateInsurance('camión', 0)).toBe(2150)
  })

  it('other category base is 1500', () => {
    expect(estimateInsurance('remolque', 0)).toBe(1500)
  })

  it('no age surcharge for vehicles <= 5 years', () => {
    expect(estimateInsurance('semirremolque', 5)).toBe(1000)
  })

  it('adds 5% per year over 5', () => {
    // 2 extra years: base * (1 + 2*0.05) = 1000 * 1.10 = 1100
    expect(estimateInsurance('semirremolque', 7)).toBe(1100)
  })
})

// ─── estimateMaintenance ─────────────────────────────────────────────────

describe('estimateMaintenance', () => {
  const { estimateMaintenance } = getCalc()

  it('semirremolque base is 2000 (no extra age or km)', () => {
    expect(estimateMaintenance('semirremolque', 0, 100_000)).toBe(2000)
  })

  it('cabeza tractora base is 5000', () => {
    expect(estimateMaintenance('cabeza tractora', 0, 0)).toBe(5000)
  })

  it('camion base is 4000', () => {
    expect(estimateMaintenance('camion', 0, 0)).toBe(4000)
  })

  it('other base is 3000', () => {
    expect(estimateMaintenance('autocar', 0, 0)).toBe(3000)
  })

  it('no surcharge for age <= 5 and km <= 200k', () => {
    expect(estimateMaintenance('camion', 5, 200_000)).toBe(4000)
  })

  it('adds 10% of base per year over 5', () => {
    // 2 extra years: 4000 + 4000 * 2 * 0.10 = 4000 + 800 = 4800
    expect(estimateMaintenance('camion', 7, 0)).toBe(4800)
  })

  it('adds 500 per 100k km over 200k', () => {
    // 300k km: 100k excess → 1 * 500 = 500 surcharge → 4000 + 500 = 4500
    expect(estimateMaintenance('camion', 0, 300_000)).toBe(4500)
  })

  it('combines age and km surcharges', () => {
    // age=7 → +800; km=300k → +500: 4000+800+500=5300
    expect(estimateMaintenance('camion', 7, 300_000)).toBe(5300)
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────

describe('formatCurrency', () => {
  const { formatCurrency } = getCalc()

  it('formats 100 cents as "1,00 €"', () => {
    expect(formatCurrency(100)).toBe('1,00 €')
  })

  it('formats 0 cents as "0,00 €"', () => {
    expect(formatCurrency(0)).toBe('0,00 €')
  })

  it('adds thousands separator for large amounts', () => {
    // 1234567 cents = 12345.67 EUR → "12.345,67 €"
    expect(formatCurrency(1_234_567)).toBe('12.345,67 €')
  })

  it('formats millions correctly', () => {
    // 100000000 cents = 1,000,000 EUR → "1.000.000,00 €"
    expect(formatCurrency(100_000_000)).toBe('1.000.000,00 €')
  })

  it('formats odd cents (e.g., 99 cents = 0.99 EUR)', () => {
    expect(formatCurrency(99)).toBe('0,99 €')
  })
})
