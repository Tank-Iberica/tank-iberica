/**
 * Pure functions for financial calculations.
 * Extracted from useFinanceCalculator to enable testing without Vue reactivity.
 */

export interface FinancingResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  amortizationSchedule: Array<{
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
  }>
}

export interface TotalCostResult {
  purchasePrice: number
  transferTax: number
  insurance: number[]
  maintenance: number[]
  totalByYear: number[]
  grandTotal: number
}

export interface ITPRate {
  comunidad: string
  rate: number
}

export interface FinancingParams {
  price: number
  downPayment: number
  interestRate: number
  termMonths: number
}

export interface TotalCostParams {
  price: number
  comunidad: string
  insuranceAnnual: number
  maintenanceAnnual: number
  years: number
}

export const ITP_RATES: Readonly<ITPRate[]> = [
  { comunidad: 'Andalucía', rate: 4 },
  { comunidad: 'Aragón', rate: 4 },
  { comunidad: 'Asturias', rate: 4 },
  { comunidad: 'Baleares', rate: 4 },
  { comunidad: 'Canarias', rate: 5.5 },
  { comunidad: 'Cantabria', rate: 4 },
  { comunidad: 'Castilla-La Mancha', rate: 6 },
  { comunidad: 'Castilla y León', rate: 5 },
  { comunidad: 'Cataluña', rate: 5 },
  { comunidad: 'Extremadura', rate: 6 },
  { comunidad: 'Galicia', rate: 4 },
  { comunidad: 'Madrid', rate: 4 },
  { comunidad: 'Murcia', rate: 4 },
  { comunidad: 'Navarra', rate: 4 },
  { comunidad: 'País Vasco', rate: 4 },
  { comunidad: 'La Rioja', rate: 4 },
  { comunidad: 'Valencia', rate: 6 },
  { comunidad: 'Ceuta', rate: 4 },
  { comunidad: 'Melilla', rate: 4 },
]

export function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateFinancing(params: FinancingParams): FinancingResult {
  const { price, downPayment, interestRate, termMonths } = params
  const principal = price - downPayment

  if (principal <= 0 || termMonths <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, amortizationSchedule: [] }
  }

  const monthlyRate = interestRate / 100 / 12

  let monthlyPayment: number
  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths
  } else {
    const compoundFactor = Math.pow(1 + monthlyRate, termMonths)
    monthlyPayment = (principal * (monthlyRate * compoundFactor)) / (compoundFactor - 1)
  }

  monthlyPayment = roundTwo(monthlyPayment)

  const amortizationSchedule: FinancingResult['amortizationSchedule'] = []
  let remainingBalance = principal

  for (let month = 1; month <= termMonths; month++) {
    const interestPortion = roundTwo(remainingBalance * monthlyRate)
    let principalPortion: number
    let payment: number

    if (month === termMonths) {
      principalPortion = roundTwo(remainingBalance)
      payment = roundTwo(principalPortion + interestPortion)
    } else {
      payment = monthlyPayment
      principalPortion = roundTwo(payment - interestPortion)
    }

    remainingBalance = roundTwo(remainingBalance - principalPortion)

    amortizationSchedule.push({
      month,
      payment,
      principal: principalPortion,
      interest: interestPortion,
      balance: Math.max(remainingBalance, 0),
    })
  }

  const totalPayment = roundTwo(amortizationSchedule.reduce((sum, row) => sum + row.payment, 0))
  const totalInterest = roundTwo(totalPayment - principal)

  return { monthlyPayment, totalPayment, totalInterest, amortizationSchedule }
}

export function calculateTotalCost(params: TotalCostParams): TotalCostResult {
  const { price, comunidad, insuranceAnnual, maintenanceAnnual, years } = params

  const itpEntry = ITP_RATES.find((r) => r.comunidad === comunidad)
  const itpRate = itpEntry ? itpEntry.rate : 4
  const transferTax = roundTwo((price * itpRate) / 100)

  const insurance: number[] = []
  const maintenance: number[] = []
  const totalByYear: number[] = []

  let cumulativeTotal = price + transferTax

  for (let year = 0; year < years; year++) {
    const yearInsurance = roundTwo(insuranceAnnual * Math.pow(1.03, year))
    insurance.push(yearInsurance)

    const yearMaintenance = roundTwo(maintenanceAnnual * Math.pow(1.05, year))
    maintenance.push(yearMaintenance)

    cumulativeTotal = roundTwo(cumulativeTotal + yearInsurance + yearMaintenance)
    totalByYear.push(cumulativeTotal)
  }

  const grandTotal =
    years > 0 ? (totalByYear[years - 1] ?? price + transferTax) : price + transferTax

  return {
    purchasePrice: price,
    transferTax,
    insurance,
    maintenance,
    totalByYear,
    grandTotal: roundTwo(grandTotal),
  }
}

export function estimateInsurance(category: string, vehicleAge: number): number {
  const normalized = category.toLowerCase().trim()

  let base: number
  if (normalized.includes('semirremolque')) {
    base = 1000
  } else if (normalized.includes('cabeza') || normalized.includes('tractora')) {
    base = 2750
  } else if (normalized.includes('camion') || normalized.includes('camión')) {
    base = 2150
  } else {
    base = 1500
  }

  const extraYears = Math.max(0, vehicleAge - 5)
  const ageFactor = 1 + extraYears * 0.05
  return roundTwo(base * ageFactor)
}

export function estimateMaintenance(category: string, vehicleAge: number, km: number): number {
  const normalized = category.toLowerCase().trim()

  let base: number
  if (normalized.includes('semirremolque')) {
    base = 2000
  } else if (normalized.includes('cabeza') || normalized.includes('tractora')) {
    base = 5000
  } else if (normalized.includes('camion') || normalized.includes('camión')) {
    base = 4000
  } else {
    base = 3000
  }

  const extraYears = Math.max(0, vehicleAge - 5)
  const ageSurcharge = base * extraYears * 0.1

  const excessKm = Math.max(0, km - 200_000)
  const kmSurcharge = Math.floor(excessKm / 100_000) * 500

  return roundTwo(base + ageSurcharge + kmSurcharge)
}

export function formatCurrencyFromCents(cents: number): string {
  const euros = cents / 100
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
    .format(euros)
    .replace('\u00A0', ' ')
}
