/**
 * useFinanceCalculator
 * Pure client-side composable for financing, total cost, and tax calculations
 * for vehicle purchases on the Spanish market.
 */

interface FinancingResult {
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

interface TotalCostResult {
  purchasePrice: number
  transferTax: number
  insurance: number[]
  maintenance: number[]
  totalByYear: number[]
  grandTotal: number
}

interface ITPRate {
  comunidad: string
  rate: number
}

interface FinancingParams {
  price: number
  downPayment: number
  interestRate: number
  termMonths: number
}

interface TotalCostParams {
  price: number
  comunidad: string
  insuranceAnnual: number
  maintenanceAnnual: number
  years: number
}

const ITP_RATES: ITPRate[] = [
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

/**
 * Round a number to two decimal places using standard rounding.
 */
function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function useFinanceCalculator() {
  const itpRates: Readonly<ITPRate[]> = ITP_RATES
  const selectedComunidad = ref<string>('Madrid')

  /**
   * Calculate financing using standard amortization formula.
   * M = P[r(1+r)^n] / [(1+r)^n - 1]
   */
  function calculateFinancing(params: FinancingParams): FinancingResult {
    const { price, downPayment, interestRate, termMonths } = params
    const principal = price - downPayment

    if (principal <= 0) {
      return {
        monthlyPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        amortizationSchedule: [],
      }
    }

    if (termMonths <= 0) {
      return {
        monthlyPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        amortizationSchedule: [],
      }
    }

    // Monthly interest rate (annual percentage converted to decimal, then divided by 12)
    const monthlyRate = interestRate / 100 / 12

    let monthlyPayment: number

    if (monthlyRate === 0) {
      // Zero-interest loan: simply divide principal by months
      monthlyPayment = principal / termMonths
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, termMonths)
      monthlyPayment = (principal * (monthlyRate * compoundFactor)) / (compoundFactor - 1)
    }

    monthlyPayment = roundTwo(monthlyPayment)

    // Build amortization schedule
    const amortizationSchedule: FinancingResult['amortizationSchedule'] = []
    let remainingBalance = principal

    for (let month = 1; month <= termMonths; month++) {
      const interestPortion = roundTwo(remainingBalance * monthlyRate)
      let principalPortion: number
      let payment: number

      if (month === termMonths) {
        // Last payment covers remaining balance exactly to avoid rounding drift
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

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
      amortizationSchedule,
    }
  }

  /**
   * Calculate total cost of ownership over N years.
   * Includes purchase price, ITP transfer tax, insurance (3% annual increase),
   * and maintenance (5% annual increase).
   */
  function calculateTotalCost(params: TotalCostParams): TotalCostResult {
    const { price, comunidad, insuranceAnnual, maintenanceAnnual, years } = params

    const itpEntry = ITP_RATES.find((r) => r.comunidad === comunidad)
    const itpRate = itpEntry ? itpEntry.rate : 4
    const transferTax = roundTwo((price * itpRate) / 100)

    const insurance: number[] = []
    const maintenance: number[] = []
    const totalByYear: number[] = []

    let cumulativeTotal = price + transferTax

    for (let year = 0; year < years; year++) {
      // Insurance: base + 3% compounding increase per year
      const yearInsurance = roundTwo(insuranceAnnual * Math.pow(1.03, year))
      insurance.push(yearInsurance)

      // Maintenance: base + 5% compounding increase per year
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

  /**
   * Estimate annual insurance cost based on vehicle category and age.
   * Ranges:
   *   - Semirremolques: 800-1200 EUR
   *   - Cabezas tractoras: 2000-3500 EUR
   *   - Camiones: 1500-2800 EUR
   *   - Others: 1000-2000 EUR
   * Adjust +5% per year of age over 5.
   */
  function estimateInsurance(category: string, vehicleAge: number): number {
    const normalized = category.toLowerCase().trim()

    let base: number

    if (normalized.includes('semirremolque')) {
      base = 1000 // midpoint of 800-1200
    } else if (normalized.includes('cabeza') || normalized.includes('tractora')) {
      base = 2750 // midpoint of 2000-3500
    } else if (normalized.includes('camion') || normalized.includes('camión')) {
      base = 2150 // midpoint of 1500-2800
    } else {
      base = 1500 // midpoint of 1000-2000
    }

    // +5% per year of age beyond 5 years
    const extraYears = Math.max(0, vehicleAge - 5)
    const ageFactor = 1 + extraYears * 0.05

    return roundTwo(base * ageFactor)
  }

  /**
   * Estimate annual maintenance cost based on category, age, and mileage.
   * Base: 2000-5000 EUR depending on category.
   * +10% per year over 5.
   * +500 EUR per 100k km over 200k.
   */
  function estimateMaintenance(category: string, vehicleAge: number, km: number): number {
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

    // +10% per year over 5
    const extraYears = Math.max(0, vehicleAge - 5)
    const ageSurcharge = base * extraYears * 0.1

    // +500 EUR per 100k km over 200k
    const excessKm = Math.max(0, km - 200_000)
    const kmSurcharge = Math.floor(excessKm / 100_000) * 500

    return roundTwo(base + ageSurcharge + kmSurcharge)
  }

  /**
   * Format a numeric amount (in cents) to Spanish currency format.
   * Example: 1234567 -> "12.345,67 €"
   */
  function formatCurrency(cents: number): string {
    const euros = cents / 100
    const parts = euros.toFixed(2).split('.')
    const integerPart = parts[0] ?? '0'
    const decimalPart = parts[1] ?? '00'

    // Add thousand separators with dots
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return `${formatted},${decimalPart} €`
  }

  return {
    itpRates,
    selectedComunidad,
    calculateFinancing,
    calculateTotalCost,
    estimateInsurance,
    estimateMaintenance,
    formatCurrency,
  }
}
