<script setup lang="ts">
/**
 * Rental Profitability Calculator (Free plan)
 * Client-side calculator with Chart.js line chart showing cumulative profit
 * over 60 months. No DB storage needed.
 */
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
)

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

// Form inputs
const purchasePrice = ref<number>(0)
const monthlyRent = ref<number>(0)
const annualInsurance = ref<number>(0)
const annualMaintenance = ref<number>(0)
const annualTaxes = ref<number>(0)

// Whether we have valid inputs to display results
const hasValidInputs = computed(() => purchasePrice.value > 0 && monthlyRent.value > 0)

// Core calculations
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

// Formatters
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
          <Line :data="chartData" :options="chartOptions" />
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

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
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

.input-unit {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  min-width: 32px;
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
  .form-section {
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
}

/* Responsive */
@media (min-width: 480px) {
  .form-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .input-group:first-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .calculator-page {
    padding: 24px;
  }

  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
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
}
</style>
