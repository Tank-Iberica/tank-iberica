<script setup lang="ts">
/**
 * Calculator page with 3 tabs:
 * 1. Rental Profitability (existing)
 * 2. Financing simulator (new)
 * 3. Total cost of ownership (new)
 */
// Lazy-load Chart.js — chart only appears in the profitability tab
const LazyLine = defineAsyncComponent(() =>
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

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const {
  itpRates,
  selectedComunidad,
  calculateFinancing,
  calculateTotalCost,
  estimateInsurance,
  estimateMaintenance,
} = useFinanceCalculator()

// ===== ACTIVE TAB =====
type TabId = 'profitability' | 'financing' | 'totalCost'
const activeTab = ref<TabId>('profitability')

const tabs = computed(() => [
  { id: 'profitability' as TabId, label: t('dashboard.calculator.tabProfitability') },
  { id: 'financing' as TabId, label: t('dashboard.calculator.tabFinancing') },
  { id: 'totalCost' as TabId, label: t('dashboard.calculator.tabTotalCost') },
])

// ===== TAB 1: PROFITABILITY (existing) =====
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

// ===== TAB 2: FINANCING =====
const finVehiclePrice = ref<number>(0)
const finDownPaymentPct = ref<number>(20)
const finInterestRate = ref<number>(5.5)
const finTermMonths = ref<number>(60)

const termOptions = [12, 24, 36, 48, 60, 72, 84]

const finDownPaymentAmount = computed(() =>
  Math.round((finVehiclePrice.value * finDownPaymentPct.value) / 100),
)

const hasValidFinancing = computed(() => finVehiclePrice.value > 0 && finTermMonths.value > 0)

const financingResult = computed(() => {
  if (!hasValidFinancing.value) return null
  return calculateFinancing({
    price: finVehiclePrice.value,
    downPayment: finDownPaymentAmount.value,
    interestRate: finInterestRate.value,
    termMonths: finTermMonths.value,
  })
})

const amortizationPreview = computed(() => {
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

// ===== TAB 3: TOTAL COST =====
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

const totalCostResult = computed(() => {
  if (!hasValidTotalCost.value) return null
  return calculateTotalCost({
    price: tcPurchasePrice.value,
    comunidad: selectedComunidad.value,
    insuranceAnnual: tcInsuranceEstimate.value,
    maintenanceAnnual: tcMaintenanceEstimate.value,
    years: tcYears.value,
  })
})

// Auto-estimate insurance/maintenance when price changes
function autoEstimate(): void {
  if (tcPurchasePrice.value > 0) {
    tcInsuranceEstimate.value = Math.round(estimateInsurance('camion', 5))
    tcMaintenanceEstimate.value = Math.round(estimateMaintenance('camion', 5, 200000))
  }
}

// ===== FORMATTERS =====
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCurrencyDecimals(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`
  }
  return String(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatMonths(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return t('dashboard.calculator.never')
  return `${value} ${value === 1 ? t('dashboard.calculator.month') : t('dashboard.calculator.months')}`
}

// Metric card color class
function metricColorClass(value: number): string {
  if (value > 0) return 'metric-positive'
  if (value < 0) return 'metric-negative'
  return 'metric-neutral'
}

function roiColorClass(value: number): string {
  if (value >= 10) return 'metric-positive'
  if (value > 0) return 'metric-warning'
  return 'metric-negative'
}

// Print results
function printResults(): void {
  window.print()
}
</script>

<template>
  <div class="calculator-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">
        {{ t('dashboard.calculator.backToDashboard') }}
      </NuxtLink>
      <h1>{{ t('dashboard.calculator.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.calculator.subtitle') }}</p>
    </header>

    <!-- Tab bar -->
    <nav class="tab-bar" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        class="tab-button"
        :class="{ 'tab-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- ===== TAB 1: PROFITABILITY ===== -->
    <template v-if="activeTab === 'profitability'">
      <!-- Input form -->
      <section class="form-section">
        <div class="input-group">
          <label class="input-label" for="calc-purchase">
            {{ t('dashboard.calculator.purchasePrice') }}
          </label>
          <div class="input-with-unit">
            <input
              id="calc-purchase"
              v-model.number="purchasePrice"
              type="number"
              min="0"
              step="1000"
              class="input-field"
              placeholder="0"
            >
            <span class="input-unit">&euro;</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="calc-rent">
            {{ t('dashboard.calculator.monthlyRent') }}
          </label>
          <div class="input-with-unit">
            <input
              id="calc-rent"
              v-model.number="monthlyRent"
              type="number"
              min="0"
              step="100"
              class="input-field"
              placeholder="0"
            >
            <span class="input-unit">&euro;/{{ t('dashboard.calculator.month') }}</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="calc-insurance">
            {{ t('dashboard.calculator.annualInsurance') }}
          </label>
          <div class="input-with-unit">
            <input
              id="calc-insurance"
              v-model.number="annualInsurance"
              type="number"
              min="0"
              step="100"
              class="input-field"
              placeholder="0"
            >
            <span class="input-unit"
              >&euro;/{{ t('dashboard.calculator.annualTaxes').split(' ')[0] }}</span
            >
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="calc-maintenance">
            {{ t('dashboard.calculator.annualMaintenance') }}
          </label>
          <div class="input-with-unit">
            <input
              id="calc-maintenance"
              v-model.number="annualMaintenance"
              type="number"
              min="0"
              step="100"
              class="input-field"
              placeholder="0"
            >
            <span class="input-unit">&euro;</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="calc-taxes">
            {{ t('dashboard.calculator.annualTaxes') }}
          </label>
          <div class="input-with-unit">
            <input
              id="calc-taxes"
              v-model.number="annualTaxes"
              type="number"
              min="0"
              step="50"
              class="input-field"
              placeholder="0"
            >
            <span class="input-unit">&euro;</span>
          </div>
        </div>
      </section>

      <!-- Results -->
      <template v-if="hasValidInputs">
        <section class="results-section">
          <h2>{{ t('dashboard.calculator.results') }}</h2>

          <div class="metrics-grid">
            <!-- Gross annual income -->
            <div class="metric-card metric-positive">
              <span class="metric-value">{{ formatCurrency(grossAnnualIncome) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.grossAnnualIncome') }}</span>
            </div>

            <!-- Annual costs -->
            <div class="metric-card metric-negative">
              <span class="metric-value">{{ formatCurrency(annualCosts) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.annualCosts') }}</span>
            </div>

            <!-- Net annual profit -->
            <div class="metric-card" :class="metricColorClass(netAnnualProfit)">
              <span class="metric-value">{{ formatCurrency(netAnnualProfit) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.netAnnualProfit') }}</span>
            </div>

            <!-- Months to recover -->
            <div
              class="metric-card"
              :class="Number.isFinite(monthsToRecover) ? 'metric-neutral' : 'metric-negative'"
            >
              <span class="metric-value">{{ formatMonths(monthsToRecover) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.monthsToRecover') }}</span>
            </div>

            <!-- Annual ROI -->
            <div class="metric-card" :class="roiColorClass(annualRoi)">
              <span class="metric-value">{{ formatPercent(annualRoi) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.annualRoi') }}</span>
            </div>

            <!-- Break-even month -->
            <div
              class="metric-card"
              :class="Number.isFinite(breakEvenMonth) ? 'metric-neutral' : 'metric-negative'"
            >
              <span class="metric-value">{{ formatMonths(breakEvenMonth) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.breakEvenMonth') }}</span>
            </div>

            <!-- Residual value at 3y -->
            <div class="metric-card metric-neutral">
              <span class="metric-value">{{ formatCurrency(residualValue3y) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.residualValue3y') }}</span>
            </div>

            <!-- Total profitability 3y -->
            <div class="metric-card" :class="metricColorClass(totalProfitability3y)">
              <span class="metric-value">{{ formatCurrency(totalProfitability3y) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.totalProfitability3y') }}</span>
            </div>
          </div>
        </section>

        <!-- Chart -->
        <section class="chart-section">
          <h2>{{ t('dashboard.calculator.chartTitle') }}</h2>
          <div class="chart-container">
            <LazyLine :data="chartData" :options="chartOptions" />
          </div>
        </section>

        <!-- Print button -->
        <div class="actions-bar">
          <button type="button" class="btn-primary" @click="printResults">
            {{ t('dashboard.calculator.printResults') }}
          </button>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <p>{{ t('dashboard.calculator.enterValues') }}</p>
      </div>
    </template>

    <!-- ===== TAB 2: FINANCING ===== -->
    <template v-if="activeTab === 'financing'">
      <section class="form-section">
        <div class="input-group input-group--full">
          <label class="input-label" for="fin-price">
            {{ t('dashboard.calculator.vehiclePrice') }}
          </label>
          <div class="input-with-unit">
            <input
              id="fin-price"
              v-model.number="finVehiclePrice"
              type="number"
              min="0"
              step="1000"
              class="input-field"
              placeholder="0"
            >
            <span class="input-unit">&euro;</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="fin-down">
            {{ t('dashboard.calculator.downPaymentPercent') }}
          </label>
          <div class="input-with-unit">
            <input
              id="fin-down"
              v-model.number="finDownPaymentPct"
              type="number"
              min="0"
              max="100"
              step="5"
              class="input-field"
              placeholder="20"
            >
            <span class="input-unit">%</span>
          </div>
          <span class="input-hint">
            {{ t('dashboard.calculator.downPaymentAmount') }}:
            {{ formatCurrency(finDownPaymentAmount) }}
          </span>
        </div>

        <div class="input-group">
          <label class="input-label" for="fin-interest">
            {{ t('dashboard.calculator.interestRate') }}
          </label>
          <div class="input-with-unit">
            <input
              id="fin-interest"
              v-model.number="finInterestRate"
              type="number"
              min="0"
              max="30"
              step="0.1"
              class="input-field"
              placeholder="5.5"
            >
            <span class="input-unit">%</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="fin-term">
            {{ t('dashboard.calculator.termMonths') }}
          </label>
          <select id="fin-term" v-model.number="finTermMonths" class="input-field">
            <option v-for="term in termOptions" :key="term" :value="term">
              {{ term }} {{ t('dashboard.calculator.months') }}
            </option>
          </select>
        </div>
      </section>

      <template v-if="hasValidFinancing && financingResult">
        <section class="results-section">
          <h2>{{ t('dashboard.calculator.results') }}</h2>
          <div class="metrics-grid">
            <div class="metric-card metric-neutral">
              <span class="metric-value">{{
                formatCurrencyDecimals(financingResult.monthlyPayment)
              }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.monthlyPayment') }}</span>
            </div>
            <div class="metric-card metric-negative">
              <span class="metric-value">{{ formatCurrency(financingResult.totalInterest) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.totalInterest') }}</span>
            </div>
            <div class="metric-card metric-warning">
              <span class="metric-value">{{
                formatCurrency(financingResult.totalPayment + finDownPaymentAmount)
              }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.totalCostFinancing') }}</span>
            </div>
          </div>
        </section>

        <!-- Amortization summary table -->
        <section v-if="amortizationPreview.length > 0" class="table-section">
          <h2>{{ t('dashboard.calculator.amortizationSummary') }}</h2>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('dashboard.calculator.amortMonth') }}</th>
                  <th>{{ t('dashboard.calculator.amortPayment') }}</th>
                  <th>{{ t('dashboard.calculator.amortPrincipal') }}</th>
                  <th>{{ t('dashboard.calculator.amortInterest') }}</th>
                  <th>{{ t('dashboard.calculator.amortBalance') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(row, idx) in amortizationPreview" :key="idx">
                  <tr v-if="row === null" class="separator-row">
                    <td colspan="5">...</td>
                  </tr>
                  <tr v-else>
                    <td>{{ row.month }}</td>
                    <td>{{ formatCurrencyDecimals(row.payment) }}</td>
                    <td>{{ formatCurrencyDecimals(row.principal) }}</td>
                    <td>{{ formatCurrencyDecimals(row.interest) }}</td>
                    <td>{{ formatCurrencyDecimals(row.balance) }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>

        <div class="actions-bar">
          <button type="button" class="btn-primary" @click="printResults">
            {{ t('dashboard.calculator.printResults') }}
          </button>
        </div>
      </template>

      <div v-else class="empty-state">
        <p>{{ t('dashboard.calculator.enterFinancingValues') }}</p>
      </div>
    </template>

    <!-- ===== TAB 3: TOTAL COST ===== -->
    <template v-if="activeTab === 'totalCost'">
      <section class="form-section">
        <div class="input-group input-group--full">
          <label class="input-label" for="tc-price">
            {{ t('dashboard.calculator.purchasePrice') }}
          </label>
          <div class="input-with-unit">
            <input
              id="tc-price"
              v-model.number="tcPurchasePrice"
              type="number"
              min="0"
              step="1000"
              class="input-field"
              placeholder="0"
              @change="autoEstimate"
            >
            <span class="input-unit">&euro;</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="tc-comunidad">
            {{ t('dashboard.calculator.comunidadAutonoma') }}
          </label>
          <select id="tc-comunidad" v-model="selectedComunidad" class="input-field">
            <option v-for="entry in itpRates" :key="entry.comunidad" :value="entry.comunidad">
              {{ entry.comunidad }} ({{ entry.rate }}%)
            </option>
          </select>
        </div>

        <div class="input-group">
          <label class="input-label" for="tc-years">
            {{ t('dashboard.calculator.yearsOwnership') }}: {{ tcYears }}
            {{ tcYears === 1 ? t('dashboard.calculator.year') : t('dashboard.calculator.years') }}
          </label>
          <input
            id="tc-years"
            v-model.number="tcYears"
            type="range"
            min="1"
            max="10"
            step="1"
            class="range-slider"
          >
          <div class="range-labels">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="tc-insurance">
            {{ t('dashboard.calculator.estimatedInsurance') }}
          </label>
          <div class="input-with-unit">
            <input
              id="tc-insurance"
              v-model.number="tcInsuranceEstimate"
              type="number"
              min="0"
              step="100"
              class="input-field"
              placeholder="1500"
            >
            <span class="input-unit">&euro;/{{ t('dashboard.calculator.year') }}</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="tc-maintenance">
            {{ t('dashboard.calculator.estimatedMaintenance') }}
          </label>
          <div class="input-with-unit">
            <input
              id="tc-maintenance"
              v-model.number="tcMaintenanceEstimate"
              type="number"
              min="0"
              step="100"
              class="input-field"
              placeholder="3000"
            >
            <span class="input-unit">&euro;/{{ t('dashboard.calculator.year') }}</span>
          </div>
        </div>
      </section>

      <template v-if="hasValidTotalCost && totalCostResult">
        <section class="results-section">
          <h2>{{ t('dashboard.calculator.results') }}</h2>
          <div class="metrics-grid">
            <div class="metric-card metric-neutral">
              <span class="metric-value">{{ formatCurrency(tcPurchasePrice) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.purchasePrice') }}</span>
            </div>
            <div class="metric-card metric-negative">
              <span class="metric-value">{{ formatCurrency(itpAmount) }}</span>
              <span class="metric-label"
                >{{ t('dashboard.calculator.itpTax') }} ({{ itpRate }}%)</span
              >
            </div>
            <div class="metric-card metric-warning">
              <span class="metric-value">{{ formatCurrency(totalCostResult.grandTotal) }}</span>
              <span class="metric-label">{{ t('dashboard.calculator.grandTotal') }}</span>
            </div>
          </div>
        </section>

        <!-- Year-by-year breakdown table -->
        <section class="table-section">
          <h2>{{ t('dashboard.calculator.yearByYearBreakdown') }}</h2>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('dashboard.calculator.yearLabel') }}</th>
                  <th>{{ t('dashboard.calculator.insuranceLabel') }}</th>
                  <th>{{ t('dashboard.calculator.maintenanceLabel') }}</th>
                  <th>{{ t('dashboard.calculator.cumulativeTotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="yearIdx in tcYears" :key="yearIdx">
                  <td>{{ yearIdx }}</td>
                  <td>{{ formatCurrency(totalCostResult.insurance[yearIdx - 1] || 0) }}</td>
                  <td>{{ formatCurrency(totalCostResult.maintenance[yearIdx - 1] || 0) }}</td>
                  <td class="cell-highlight">
                    {{ formatCurrency(totalCostResult.totalByYear[yearIdx - 1] || 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="actions-bar">
          <button type="button" class="btn-primary" @click="printResults">
            {{ t('dashboard.calculator.printResults') }}
          </button>
        </div>
      </template>

      <div v-else class="empty-state">
        <p>{{ t('dashboard.calculator.enterTotalCostValues') }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.calculator-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  flex: 1;
  min-width: 0;
  padding: 12px 8px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition:
    color 0.2s,
    border-color 0.2s;
  text-align: center;
}

.tab-button:hover {
  color: var(--color-primary, #23424a);
}

.tab-active {
  color: var(--color-primary, #23424a);
  border-bottom-color: var(--color-primary, #23424a);
}

/* Form section */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group--full {
  grid-column: 1 / -1;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.input-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  color: #1e293b;
  background: white;
  min-height: 44px;
  transition: border-color 0.2s;
  font-variant-numeric: tabular-nums;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

select.input-field {
  appearance: auto;
  cursor: pointer;
}

.input-unit {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  min-width: 32px;
}

/* Range slider */
.range-slider {
  width: 100%;
  height: 6px;
  appearance: none;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
  margin: 8px 0;
}

.range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary, #23424a);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.range-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary, #23424a);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Results */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-section h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-card {
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.3;
}

/* Metric colors */
.metric-positive {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.metric-positive .metric-value {
  color: #16a34a;
}

.metric-positive .metric-label {
  color: #15803d;
}

.metric-negative {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.metric-negative .metric-value {
  color: #dc2626;
}

.metric-negative .metric-label {
  color: #b91c1c;
}

.metric-neutral {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.metric-neutral .metric-value {
  color: var(--color-primary, #23424a);
}

.metric-neutral .metric-label {
  color: #64748b;
}

.metric-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.metric-warning .metric-value {
  color: #d97706;
}

.metric-warning .metric-label {
  color: #92400e;
}

/* Chart */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

/* Table section */
.table-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.table-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.data-table th {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  font-size: 0.8rem;
  white-space: nowrap;
}

.data-table td {
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

.data-table .separator-row td {
  text-align: center;
  color: #94a3b8;
  font-weight: 600;
  padding: 4px 8px;
  border-bottom: none;
}

.cell-highlight {
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0;
}

/* Actions */
.actions-bar {
  display: flex;
  gap: 12px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Print styles */
@media print {
  .back-link,
  .actions-bar,
  .form-section,
  .tab-bar {
    display: none;
  }

  .calculator-page {
    padding: 0;
  }

  .metric-card {
    break-inside: avoid;
  }

  .chart-section {
    break-inside: avoid;
  }

  .table-section {
    break-inside: avoid;
  }
}

/* Responsive */
@media (min-width: 480px) {
  .form-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .input-group:first-child,
  .input-group--full {
    grid-column: 1 / -1;
  }

  .tab-button {
    font-size: 0.95rem;
    padding: 12px 16px;
  }
}

@media (min-width: 768px) {
  .calculator-page {
    padding: 24px;
  }

  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .chart-container {
    height: 380px;
  }

  .btn-primary {
    width: auto;
  }
}

@media (min-width: 1024px) {
  .metric-value {
    font-size: 1.5rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
