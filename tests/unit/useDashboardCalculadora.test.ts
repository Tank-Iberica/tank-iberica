import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useDashboardCalculadora,
  formatCurrency,
  formatCurrencyDecimals,
  formatCompact,
  formatPercent,
  metricColorClass,
  roiColorClass,
} from '../../app/composables/dashboard/useDashboardCalculadora'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockFinanceCalc = {
  itpRates: [{ comunidad: 'Madrid', rate: 4 }, { comunidad: 'Cataluña', rate: 5 }],
  selectedComunidad: { value: 'Madrid' },
  calculateFinancing: vi.fn().mockReturnValue({ monthlyPayment: 800, totalInterest: 5000, totalAmount: 53000, loanAmount: 40000 }),
  calculateTotalCost: vi.fn().mockReturnValue({ itpAmount: 2000, totalCost: 45000, annualCost: 9000 }),
  estimateInsurance: vi.fn().mockReturnValue(1500),
  estimateMaintenance: vi.fn().mockReturnValue(3000),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useFinanceCalculator', () => mockFinanceCalc)
  vi.stubGlobal('defineAsyncComponent', () => ({}))
})

// ─── Pure formatters ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('formats positive number', () => {
    const result = formatCurrency(50000)
    expect(result).toContain('50')
    expect(result).toContain('€')
  })

  it('formats negative number', () => {
    const result = formatCurrency(-1000)
    expect(result).toContain('-')
    expect(result).toContain('€')
  })
})

describe('formatCurrencyDecimals', () => {
  it('includes decimal places', () => {
    const result = formatCurrencyDecimals(1500.5)
    expect(result).toContain('€')
    // has at least one comma or period for decimals
    expect(result.length).toBeGreaterThan(4)
  })
})

describe('formatCompact', () => {
  it('returns string for small numbers', () => {
    expect(formatCompact(500)).toBe('500')
  })

  it('returns k suffix for thousands', () => {
    expect(formatCompact(1000)).toBe('1k')
    expect(formatCompact(25000)).toBe('25k')
  })

  it('handles negative thousands', () => {
    expect(formatCompact(-5000)).toBe('-5k')
  })
})

describe('formatPercent', () => {
  it('formats with 1 decimal', () => {
    expect(formatPercent(10)).toBe('10.0%')
    expect(formatPercent(5.5)).toBe('5.5%')
  })
})

describe('metricColorClass', () => {
  it('returns metric-positive for positive value', () => {
    expect(metricColorClass(1)).toBe('metric-positive')
  })

  it('returns metric-negative for negative value', () => {
    expect(metricColorClass(-1)).toBe('metric-negative')
  })

  it('returns metric-neutral for zero', () => {
    expect(metricColorClass(0)).toBe('metric-neutral')
  })
})

describe('roiColorClass', () => {
  it('returns metric-positive for ROI >= 10', () => {
    expect(roiColorClass(10)).toBe('metric-positive')
    expect(roiColorClass(15)).toBe('metric-positive')
  })

  it('returns metric-warning for ROI between 0 and 10', () => {
    expect(roiColorClass(5)).toBe('metric-warning')
    expect(roiColorClass(0.1)).toBe('metric-warning')
  })

  it('returns metric-negative for ROI <= 0', () => {
    expect(roiColorClass(0)).toBe('metric-negative')
    expect(roiColorClass(-5)).toBe('metric-negative')
  })
})

// ─── useDashboardCalculadora composable ──────────────────────────────────────

describe('initial state', () => {
  it('activeTab starts as profitability', () => {
    const c = useDashboardCalculadora()
    expect(c.activeTab.value).toBe('profitability')
  })

  it('purchasePrice starts as 0', () => {
    const c = useDashboardCalculadora()
    expect(c.purchasePrice.value).toBe(0)
  })

  it('monthlyRent starts as 0', () => {
    const c = useDashboardCalculadora()
    expect(c.monthlyRent.value).toBe(0)
  })

  it('hasValidInputs is false by default', () => {
    const c = useDashboardCalculadora()
    expect(c.hasValidInputs.value).toBe(false)
  })
})

describe('Tab 1 — Profitability computed', () => {
  it('hasValidInputs is true when purchasePrice and monthlyRent > 0', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 50000
    c.monthlyRent.value = 1000
    expect(c.hasValidInputs.value).toBe(true)
  })

  it('grossAnnualIncome = monthlyRent * 12', () => {
    const c = useDashboardCalculadora()
    c.monthlyRent.value = 1000
    expect(c.grossAnnualIncome.value).toBe(12000)
  })

  it('annualCosts = sum of insurance + maintenance + taxes', () => {
    const c = useDashboardCalculadora()
    c.annualInsurance.value = 1200
    c.annualMaintenance.value = 3000
    c.annualTaxes.value = 800
    expect(c.annualCosts.value).toBe(5000)
  })

  it('netAnnualProfit = grossAnnualIncome - annualCosts', () => {
    const c = useDashboardCalculadora()
    c.monthlyRent.value = 2000 // 24000/yr
    c.annualInsurance.value = 2000
    c.annualMaintenance.value = 2000
    c.annualTaxes.value = 0
    expect(c.netAnnualProfit.value).toBe(20000)
  })

  it('monthsToRecover returns Infinity when netMonthlyProfit <= 0', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 50000
    c.monthlyRent.value = 0
    c.annualInsurance.value = 5000
    expect(c.monthsToRecover.value).toBe(Infinity)
  })

  it('monthsToRecover calculates correctly', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 12000
    c.monthlyRent.value = 1000
    c.annualInsurance.value = 0
    c.annualMaintenance.value = 0
    c.annualTaxes.value = 0
    // netMonthly = 1000, months = ceil(12000/1000) = 12
    expect(c.monthsToRecover.value).toBe(12)
  })

  it('annualRoi returns 0 when purchasePrice is 0', () => {
    const c = useDashboardCalculadora()
    expect(c.annualRoi.value).toBe(0)
  })

  it('annualRoi calculates correctly', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 100000
    c.monthlyRent.value = 1000 // 12000/yr
    // netAnnualProfit = 12000 (no costs), roi = 12000/100000*100 = 12
    expect(c.annualRoi.value).toBe(12)
  })

  it('residualValue3y = purchasePrice * 0.62', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 100000
    expect(c.residualValue3y.value).toBe(62000)
  })
})

describe('Tab 2 — Financing computed', () => {
  it('finDownPaymentPct starts at 20', () => {
    const c = useDashboardCalculadora()
    expect(c.finDownPaymentPct.value).toBe(20)
  })

  it('finDownPaymentAmount = vehiclePrice * pct/100', () => {
    const c = useDashboardCalculadora()
    c.finVehiclePrice.value = 50000
    c.finDownPaymentPct.value = 20
    expect(c.finDownPaymentAmount.value).toBe(10000)
  })

  it('hasValidFinancing requires price > 0', () => {
    const c = useDashboardCalculadora()
    expect(c.hasValidFinancing.value).toBe(false)
    c.finVehiclePrice.value = 50000
    expect(c.hasValidFinancing.value).toBe(true)
  })
})

describe('Tab 3 — Total Cost computed', () => {
  it('tcPurchasePrice starts at 0', () => {
    const c = useDashboardCalculadora()
    expect(c.tcPurchasePrice.value).toBe(0)
  })

  it('hasValidTotalCost requires purchase price > 0', () => {
    const c = useDashboardCalculadora()
    expect(c.hasValidTotalCost.value).toBe(false)
    c.tcPurchasePrice.value = 30000
    expect(c.hasValidTotalCost.value).toBe(true)
  })
})

describe('tabs', () => {
  it('has 3 tabs', () => {
    const c = useDashboardCalculadora()
    expect(c.tabs.value).toHaveLength(3)
  })

  it('first tab is profitability', () => {
    const c = useDashboardCalculadora()
    expect(c.tabs.value[0].id).toBe('profitability')
  })
})

// ─── printResults ───────────────────────────────────────────────────────────────

describe('printResults', () => {
  it('calls globalThis.print', () => {
    const printSpy = vi.fn()
    vi.stubGlobal('print', printSpy)
    const c = useDashboardCalculadora()
    c.printResults()
    expect(printSpy).toHaveBeenCalledOnce()
  })
})

// ─── breakEvenMonth ─────────────────────────────────────────────────────────────

describe('breakEvenMonth', () => {
  it('returns Infinity when net monthly profit <= 0', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 50000
    c.monthlyRent.value = 0
    expect(c.breakEvenMonth.value).toBe(Infinity)
  })

  it('calculates break-even month correctly', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 12000
    c.monthlyRent.value = 1000
    // netMonthly = 1000 (no costs), months = ceil(12000/1000) = 12
    expect(c.breakEvenMonth.value).toBe(12)
  })
})

// ─── totalProfitability3y ───────────────────────────────────────────────────────

describe('totalProfitability3y', () => {
  it('calculates 3-year profit with residual value', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 100000
    c.monthlyRent.value = 5000 // 60000/yr net
    // netAnnualProfit = 60000, residual = 62000
    // total = 60000*3 + 62000 - 100000 = 142000
    expect(c.totalProfitability3y.value).toBe(142000)
  })
})

// ─── autoEstimate ───────────────────────────────────────────────────────────────

describe('autoEstimate', () => {
  it('sets insurance and maintenance estimates when tcPurchasePrice > 0', () => {
    const c = useDashboardCalculadora()
    c.tcPurchasePrice.value = 50000
    c.autoEstimate()
    expect(mockFinanceCalc.estimateInsurance).toHaveBeenCalledWith('camion', 5)
    expect(mockFinanceCalc.estimateMaintenance).toHaveBeenCalledWith('camion', 5, 200000)
    expect(c.tcInsuranceEstimate.value).toBe(1500)
    expect(c.tcMaintenanceEstimate.value).toBe(3000)
  })

  it('does nothing when tcPurchasePrice is 0', () => {
    const c = useDashboardCalculadora()
    c.autoEstimate()
    expect(mockFinanceCalc.estimateInsurance).not.toHaveBeenCalled()
  })
})

// ─── formatMonths ───────────────────────────────────────────────────────────────

describe('formatMonths', () => {
  it('returns "never" for Infinity', () => {
    const c = useDashboardCalculadora()
    expect(c.formatMonths(Infinity)).toBe('dashboard.calculator.never')
  })

  it('returns "never" for 0 or negative', () => {
    const c = useDashboardCalculadora()
    expect(c.formatMonths(0)).toBe('dashboard.calculator.never')
    expect(c.formatMonths(-5)).toBe('dashboard.calculator.never')
  })

  it('returns singular month for 1', () => {
    const c = useDashboardCalculadora()
    expect(c.formatMonths(1)).toBe('1 dashboard.calculator.month')
  })

  it('returns plural months for > 1', () => {
    const c = useDashboardCalculadora()
    expect(c.formatMonths(12)).toBe('12 dashboard.calculator.months')
  })
})

// ─── chartData ──────────────────────────────────────────────────────────────────

describe('chartData', () => {
  it('has 61 labels (0-60 months)', () => {
    const c = useDashboardCalculadora()
    c.purchasePrice.value = 10000
    c.monthlyRent.value = 1000
    expect(c.chartData.value.labels).toHaveLength(61)
  })

  it('datasets include cumulative profit and break-even', () => {
    const c = useDashboardCalculadora()
    expect(c.chartData.value.datasets).toHaveLength(2)
  })
})

// ─── chartOptions callbacks ─────────────────────────────────────────────────────

describe('chartOptions callbacks', () => {
  it('x-axis callback returns empty for non-12-multiple index', () => {
    const c = useDashboardCalculadora()
    const xCb = c.chartOptions.value.scales.x.ticks.callback
    expect(xCb('', 0)).toBe('0')
    expect(xCb('', 6)).toBe('')
    expect(xCb('', 12)).toBe('12')
  })

  it('y-axis callback uses formatCompact', () => {
    const c = useDashboardCalculadora()
    const yCb = c.chartOptions.value.scales.y.ticks.callback
    expect(yCb(5000)).toBe('5k')
    expect(yCb(500)).toBe('500')
  })

  it('tooltip callback formats currency', () => {
    const c = useDashboardCalculadora()
    const tooltipCb = c.chartOptions.value.plugins.tooltip.callbacks.label
    const result = tooltipCb({ dataset: { label: 'Profit' }, parsed: { y: 5000 } })
    expect(result).toContain('5')
    expect(result).toContain('€')
  })
})

// ─── financingResult ────────────────────────────────────────────────────────────

describe('financingResult', () => {
  it('returns null when no valid financing', () => {
    const c = useDashboardCalculadora()
    expect(c.financingResult.value).toBeNull()
  })

  it('returns result when valid financing', () => {
    const c = useDashboardCalculadora()
    c.finVehiclePrice.value = 50000
    expect(c.financingResult.value).toBeTruthy()
    expect(mockFinanceCalc.calculateFinancing).toHaveBeenCalled()
  })
})

// ─── itpRate / itpAmount ────────────────────────────────────────────────────────

describe('itpRate', () => {
  it('returns rate for matching comunidad', () => {
    const c = useDashboardCalculadora()
    expect(c.itpRate.value).toBe(4) // Madrid
  })
})

describe('itpAmount', () => {
  it('calculates ITP from purchase price and rate', () => {
    const c = useDashboardCalculadora()
    c.tcPurchasePrice.value = 50000
    // Madrid rate=4, 50000*4/100 = 2000
    expect(c.itpAmount.value).toBe(2000)
  })
})

// ─── totalCostResult ────────────────────────────────────────────────────────────

describe('totalCostResult', () => {
  it('returns null when no valid total cost', () => {
    const c = useDashboardCalculadora()
    expect(c.totalCostResult.value).toBeNull()
  })

  it('returns result when tcPurchasePrice > 0', () => {
    const c = useDashboardCalculadora()
    c.tcPurchasePrice.value = 30000
    expect(c.totalCostResult.value).toBeTruthy()
    expect(mockFinanceCalc.calculateTotalCost).toHaveBeenCalled()
  })
})
