/**
 * useDashboardCalculadora
 *
 * All reactive state, computed properties, formatters and helpers for the
 * Calculator page (/dashboard/herramientas/calculadora).
 *
 * The composable does NOT call onMounted — lifecycle management stays in the page.
 */
import type { Component } from 'vue'

// ────────────────────────────────────────────
// Types (module-scoped — only used by this feature)
// ────────────────────────────────────────────

export type TabId = 'profitability' | 'financing' | 'totalCost'

export interface TabItem {
  id: TabId
  label: string
}

export interface AmortizationRow {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface FinancingResultView {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  amortizationSchedule: AmortizationRow[]
}

export interface TotalCostResultView {
  purchasePrice: number
  transferTax: number
  insurance: number[]
  maintenance: number[]
  totalByYear: number[]
  grandTotal: number
}

export interface ItpRateEntry {
  comunidad: string
  rate: number
}

// ────────────────────────────────────────────
// Pure helper / formatter functions (exported
// so subcomponents can import them directly)
// ────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrencyDecimals(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`
  }
  return String(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function metricColorClass(value: number): string {
  if (value > 0) return 'metric-positive'
  if (value < 0) return 'metric-negative'
  return 'metric-neutral'
}

export function roiColorClass(value: number): string {
  if (value >= 10) return 'metric-positive'
  if (value > 0) return 'metric-warning'
  return 'metric-negative'
}

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useDashboardCalculadora() {
  const { t } = useI18n()

  const {
    itpRates,
    selectedComunidad,
    calculateFinancing,
    calculateTotalCost,
    estimateInsurance,
    estimateMaintenance,
  } = useFinanceCalculator()

  // ── Lazy-loaded Chart.js component ──
  const LazyLine: Component = defineAsyncComponent(() =>
    import('chart.js').then(
      ({
        Chart,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler,
      }) => {
        Chart.register(
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          Title,
          Tooltip,
          Legend,
          Filler,
        )
        return import('vue-chartjs').then((m) => m.Line)
      },
    ),
  )

  // ═══════════════════════════════════════════
  // Active tab
  // ═══════════════════════════════════════════

  const activeTab = ref<TabId>('profitability')

  const tabs = computed<TabItem[]>(() => [
    { id: 'profitability', label: t('dashboard.calculator.tabProfitability') },
    { id: 'financing', label: t('dashboard.calculator.tabFinancing') },
    { id: 'totalCost', label: t('dashboard.calculator.tabTotalCost') },
  ])

  // ═══════════════════════════════════════════
  // TAB 1 — Profitability
  // ═══════════════════════════════════════════

  const purchasePrice = ref<number>(0)
  const monthlyRent = ref<number>(0)
  const annualInsurance = ref<number>(0)
  const annualMaintenance = ref<number>(0)
  const annualTaxes = ref<number>(0)

  const hasValidInputs = computed(() => purchasePrice.value > 0 && monthlyRent.value > 0)

  const grossAnnualIncome = computed(() => monthlyRent.value * 12)

  const annualCosts = computed(
    () => annualInsurance.value + annualMaintenance.value + annualTaxes.value,
  )

  const netAnnualProfit = computed(() => grossAnnualIncome.value - annualCosts.value)

  const netMonthlyProfit = computed(() => netAnnualProfit.value / 12)

  const monthsToRecover = computed(() => {
    if (netMonthlyProfit.value <= 0) return Infinity
    return Math.ceil(purchasePrice.value / netMonthlyProfit.value)
  })

  const annualRoi = computed(() => {
    if (purchasePrice.value <= 0) return 0
    return (netAnnualProfit.value / purchasePrice.value) * 100
  })

  const breakEvenMonth = computed(() => {
    if (netMonthlyProfit.value <= 0) return Infinity
    return Math.ceil(purchasePrice.value / netMonthlyProfit.value)
  })

  const residualValue3y = computed(() => purchasePrice.value * 0.62)

  const totalProfitability3y = computed(
    () => netAnnualProfit.value * 3 + residualValue3y.value - purchasePrice.value,
  )

  // Chart data — cumulative profit over 60 months
  const chartData = computed(() => {
    const labels: string[] = []
    const cumulativeData: number[] = []
    const breakEvenData: number[] = []

    const monthlyCost = annualCosts.value / 12

    for (let month = 0; month <= 60; month++) {
      labels.push(String(month))
      const cumulative = month * monthlyRent.value - month * monthlyCost - purchasePrice.value
      cumulativeData.push(Math.round(cumulative))
      breakEvenData.push(0)
    }

    return {
      labels,
      datasets: [
        {
          label: t('dashboard.calculator.chartCumulativeProfit'),
          data: cumulativeData,
          borderColor: '#23424a',
          backgroundColor: 'rgba(35, 66, 74, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
        },
        {
          label: t('dashboard.calculator.chartBreakEven'),
          data: breakEvenData,
          borderColor: '#ef4444',
          borderWidth: 1,
          borderDash: [6, 4],
          fill: false,
          pointRadius: 0,
          pointHitRadius: 0,
        },
      ],
    }
  })

  const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${formatCurrency(value)}`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('dashboard.calculator.months'),
          font: { size: 12, weight: 'bold' as const },
          color: '#64748b',
        },
        ticks: {
          callback: function (_val: string | number, index: number) {
            return index % 12 === 0 ? String(index) : ''
          },
          maxRotation: 0,
          font: { size: 11 },
          color: '#94a3b8',
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'EUR',
          font: { size: 12, weight: 'bold' as const },
          color: '#64748b',
        },
        ticks: {
          callback: function (val: string | number) {
            return formatCompact(Number(val))
          },
          font: { size: 11 },
          color: '#94a3b8',
        },
        grid: {
          color: '#f1f5f9',
        },
      },
    },
  }))

  // ═══════════════════════════════════════════
  // TAB 2 — Financing
  // ═══════════════════════════════════════════

  const finVehiclePrice = ref<number>(0)
  const finDownPaymentPct = ref<number>(20)
  const finInterestRate = ref<number>(5.5)
  const finTermMonths = ref<number>(60)

  const termOptions: number[] = [12, 24, 36, 48, 60, 72, 84]

  const finDownPaymentAmount = computed(() =>
    Math.round((finVehiclePrice.value * finDownPaymentPct.value) / 100),
  )

  const hasValidFinancing = computed(() => finVehiclePrice.value > 0 && finTermMonths.value > 0)

  const financingResult = computed<FinancingResultView | null>(() => {
    if (!hasValidFinancing.value) return null
    return calculateFinancing({
      price: finVehiclePrice.value,
      downPayment: finDownPaymentAmount.value,
      interestRate: finInterestRate.value,
      termMonths: finTermMonths.value,
    })
  })

  const amortizationPreview = computed<Array<AmortizationRow | null>>(() => {
    if (!financingResult.value) return []
    const schedule = financingResult.value.amortizationSchedule
    if (schedule.length <= 6) return schedule
    // First 3 + last 3
    return [
      ...schedule.slice(0, 3),
      null, // separator
      ...schedule.slice(-3),
    ]
  })

  // ═══════════════════════════════════════════
  // TAB 3 — Total Cost
  // ═══════════════════════════════════════════

  const tcPurchasePrice = ref<number>(0)
  const tcYears = ref<number>(5)
  const tcInsuranceEstimate = ref<number>(1500)
  const tcMaintenanceEstimate = ref<number>(3000)

  const hasValidTotalCost = computed(() => tcPurchasePrice.value > 0)

  const itpRate = computed(() => {
    const entry = itpRates.find(
      (r: { comunidad: string; rate: number }) => r.comunidad === selectedComunidad.value,
    )
    return entry ? entry.rate : 4
  })

  const itpAmount = computed(() => Math.round((tcPurchasePrice.value * itpRate.value) / 100))

  const totalCostResult = computed<TotalCostResultView | null>(() => {
    if (!hasValidTotalCost.value) return null
    return calculateTotalCost({
      price: tcPurchasePrice.value,
      comunidad: selectedComunidad.value,
      insuranceAnnual: tcInsuranceEstimate.value,
      maintenanceAnnual: tcMaintenanceEstimate.value,
      years: tcYears.value,
    })
  })

  function autoEstimate(): void {
    if (tcPurchasePrice.value > 0) {
      tcInsuranceEstimate.value = Math.round(estimateInsurance('camion', 5))
      tcMaintenanceEstimate.value = Math.round(estimateMaintenance('camion', 5, 200000))
    }
  }

  // ═══════════════════════════════════════════
  // Shared helpers
  // ═══════════════════════════════════════════

  function formatMonths(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return t('dashboard.calculator.never')
    return `${value} ${value === 1 ? t('dashboard.calculator.month') : t('dashboard.calculator.months')}`
  }

  function printResults(): void {
    window.print()
  }

  // ═══════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════

  return {
    // Lazy chart component
    LazyLine,

    // Tab management
    activeTab,
    tabs,

    // Tab 1 — Profitability
    purchasePrice,
    monthlyRent,
    annualInsurance,
    annualMaintenance,
    annualTaxes,
    hasValidInputs,
    grossAnnualIncome,
    annualCosts,
    netAnnualProfit,
    monthsToRecover,
    annualRoi,
    breakEvenMonth,
    residualValue3y,
    totalProfitability3y,
    chartData,
    chartOptions,

    // Tab 2 — Financing
    finVehiclePrice,
    finDownPaymentPct,
    finInterestRate,
    finTermMonths,
    termOptions,
    finDownPaymentAmount,
    hasValidFinancing,
    financingResult,
    amortizationPreview,

    // Tab 3 — Total Cost
    tcPurchasePrice,
    tcYears,
    tcInsuranceEstimate,
    tcMaintenanceEstimate,
    selectedComunidad,
    itpRates,
    hasValidTotalCost,
    itpRate,
    itpAmount,
    totalCostResult,
    autoEstimate,

    // Formatters / helpers
    formatMonths,
    printResults,
  }
}
