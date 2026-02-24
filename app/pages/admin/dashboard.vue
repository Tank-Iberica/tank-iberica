<script setup lang="ts">
import type { ChartOptions } from 'chart.js'

// Lazy-load Chart.js components — admin dashboard is SSR: false
const chartReady = ref(false)
const LazyBar = defineAsyncComponent(() =>
  import('chart.js').then(
    ({
      Chart,
      CategoryScale,
      LinearScale,
      BarElement,
      PointElement,
      LineElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
      Filler,
    }) => {
      Chart.register(
        CategoryScale,
        LinearScale,
        BarElement,
        PointElement,
        LineElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
        Filler,
      )
      chartReady.value = true
      return import('vue-chartjs').then((m) => m.Bar)
    },
  ),
)
const LazyLine = defineAsyncComponent(() =>
  chartReady.value
    ? import('vue-chartjs').then((m) => m.Line)
    : import('chart.js').then(
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
const LazyDoughnut = defineAsyncComponent(() =>
  chartReady.value
    ? import('vue-chartjs').then((m) => m.Doughnut)
    : import('chart.js').then(({ Chart, ArcElement, Tooltip, Legend }) => {
        Chart.register(ArcElement, Tooltip, Legend)
        return import('vue-chartjs').then((m) => m.Doughnut)
      }),
)

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  kpiSummary,
  revenueSeries,
  vehicleActivity,
  leadsSeries,
  topDealers,
  topVehicles,
  conversionFunnel,
  churnRate: churnData,
  loading,
  error,
  loadMetrics,
  exportMetricsCSV,
} = useAdminMetrics()

onMounted(() => {
  loadMetrics()
})

// --- Formatters ---

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// --- Chart colors ---

const COLORS = {
  primary: '#23424A',
  accent: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  primaryLight: 'rgba(35, 66, 74, 0.6)',
  accentLight: 'rgba(16, 185, 129, 0.6)',
}

// --- Chart data computeds ---

const revenueChartData = computed<ChartData<'bar'>>(() => {
  const series = revenueSeries.value || []
  return {
    labels: series.map((s) => s.month),
    datasets: [
      {
        label: t('admin.metrics.revenue'),
        data: series.map((s) => s.revenue / 100),
        backgroundColor: COLORS.primary,
        borderRadius: 4,
      },
      {
        label: t('admin.metrics.tax'),
        data: series.map((s) => s.tax / 100),
        backgroundColor: COLORS.primaryLight,
        borderRadius: 4,
      },
    ],
  }
})

const vehiclesChartData = computed<ChartData<'line'>>(() => {
  const series = vehicleActivity.value || []
  return {
    labels: series.map((s) => s.month),
    datasets: [
      {
        label: t('admin.metrics.vehicles'),
        data: series.map((s) => s.published),
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(35, 66, 74, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('admin.metrics.sales'),
        data: series.map((s) => s.sold),
        borderColor: COLORS.accent,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
})

const leadsChartData = computed<ChartData<'bar'>>(() => {
  const series = leadsSeries.value || []
  return {
    labels: series.map((s) => s.month),
    datasets: [
      {
        label: t('admin.metrics.leads'),
        data: series.map((s) => s.leads),
        backgroundColor: COLORS.accent,
        borderRadius: 4,
      },
    ],
  }
})

const funnelChartData = computed<ChartData<'doughnut'>>(() => {
  const funnel = conversionFunnel.value
  if (!funnel) {
    return { labels: [], datasets: [] }
  }
  return {
    labels: [
      t('admin.metrics.visits'),
      t('admin.metrics.vehicleViews'),
      t('admin.metrics.conversions'),
      t('admin.metrics.sales'),
    ],
    datasets: [
      {
        data: [funnel.visits, funnel.vehicleViews, funnel.leads, funnel.sales],
        backgroundColor: [COLORS.primary, COLORS.accent, COLORS.warning, COLORS.error],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }
})

// --- Chart options ---

const barChartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 16,
        usePointStyle: true,
        font: { family: 'Inter', size: 12 },
      },
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          const val = ctx.parsed.y
          return `${ctx.dataset.label}: ${new Intl.NumberFormat('es-ES').format(val)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 11 } },
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: { family: 'Inter', size: 11 },
        callback(value) {
          return new Intl.NumberFormat('es-ES', { notation: 'compact' }).format(Number(value))
        },
      },
    },
  },
}))

const lineChartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 16,
        usePointStyle: true,
        font: { family: 'Inter', size: 12 },
      },
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          const val = ctx.parsed.y
          return `${ctx.dataset.label}: ${new Intl.NumberFormat('es-ES').format(val)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 11 } },
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: { family: 'Inter', size: 11 },
        callback(value) {
          return new Intl.NumberFormat('es-ES').format(Number(value))
        },
      },
    },
  },
}))

const doughnutChartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '55%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 16,
        usePointStyle: true,
        font: { family: 'Inter', size: 12 },
      },
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          const val = ctx.parsed
          return `${ctx.label}: ${new Intl.NumberFormat('es-ES').format(val)}`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="metrics-page">
    <!-- 1. Page Header -->
    <header class="page-header">
      <h1 class="page-title">{{ $t('admin.metrics.title') }}</h1>
      <button class="btn-export" :disabled="loading" @click="exportMetricsCSV()">
        <svg
          class="btn-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {{ $t('admin.metrics.exportCsv') }}
      </button>
    </header>

    <!-- Error state -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <!-- 2. KPI Summary Cards -->
      <section class="kpi-grid">
        <!-- Revenue -->
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('admin.metrics.revenue') }}</span>
          <span class="kpi-value">{{
            formatCurrency(kpiSummary.monthlyRevenue.current / 100)
          }}</span>
          <span
            class="kpi-change"
            :class="{
              'kpi-change--up': kpiSummary.monthlyRevenue.changePercent > 0,
              'kpi-change--down': kpiSummary.monthlyRevenue.changePercent < 0,
            }"
          >
            <template v-if="kpiSummary.monthlyRevenue.changePercent > 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
              </svg>
              {{ formatPercent(kpiSummary.monthlyRevenue.changePercent) }}
            </template>
            <template v-else-if="kpiSummary.monthlyRevenue.changePercent < 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
              </svg>
              {{ formatPercent(kpiSummary.monthlyRevenue.changePercent) }}
            </template>
            <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
          </span>
          <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
        </div>

        <!-- Active Vehicles -->
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('admin.metrics.activeVehicles') }}</span>
          <span class="kpi-value">{{ formatNumber(kpiSummary.activeVehicles.current) }}</span>
          <span
            class="kpi-change"
            :class="{
              'kpi-change--up': kpiSummary.activeVehicles.changePercent > 0,
              'kpi-change--down': kpiSummary.activeVehicles.changePercent < 0,
            }"
          >
            <template v-if="kpiSummary.activeVehicles.changePercent > 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
              </svg>
              {{ formatPercent(kpiSummary.activeVehicles.changePercent) }}
            </template>
            <template v-else-if="kpiSummary.activeVehicles.changePercent < 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
              </svg>
              {{ formatPercent(kpiSummary.activeVehicles.changePercent) }}
            </template>
            <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
          </span>
          <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
        </div>

        <!-- Active Dealers -->
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('admin.metrics.activeDealers') }}</span>
          <span class="kpi-value">{{ formatNumber(kpiSummary.activeDealers.current) }}</span>
          <span
            class="kpi-change"
            :class="{
              'kpi-change--up': kpiSummary.activeDealers.changePercent > 0,
              'kpi-change--down': kpiSummary.activeDealers.changePercent < 0,
            }"
          >
            <template v-if="kpiSummary.activeDealers.changePercent > 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
              </svg>
              {{ formatPercent(kpiSummary.activeDealers.changePercent) }}
            </template>
            <template v-else-if="kpiSummary.activeDealers.changePercent < 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
              </svg>
              {{ formatPercent(kpiSummary.activeDealers.changePercent) }}
            </template>
            <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
          </span>
          <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
        </div>

        <!-- Monthly Leads -->
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('admin.metrics.monthlyLeads') }}</span>
          <span class="kpi-value">{{ formatNumber(kpiSummary.monthlyLeads.current) }}</span>
          <span
            class="kpi-change"
            :class="{
              'kpi-change--up': kpiSummary.monthlyLeads.changePercent > 0,
              'kpi-change--down': kpiSummary.monthlyLeads.changePercent < 0,
            }"
          >
            <template v-if="kpiSummary.monthlyLeads.changePercent > 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
              </svg>
              {{ formatPercent(kpiSummary.monthlyLeads.changePercent) }}
            </template>
            <template v-else-if="kpiSummary.monthlyLeads.changePercent < 0">
              <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
              </svg>
              {{ formatPercent(kpiSummary.monthlyLeads.changePercent) }}
            </template>
            <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
          </span>
          <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
        </div>
      </section>

      <!-- 3. Charts Section -->
      <section class="charts-grid">
        <!-- Monthly Revenue (Bar) -->
        <div class="chart-card">
          <h2 class="chart-card__title">{{ $t('admin.metrics.revenueChart') }}</h2>
          <div class="chart-card__body">
            <div v-if="!revenueSeries?.length" class="chart-card__empty">
              {{ $t('admin.metrics.noData') }}
            </div>
            <LazyBar v-else :data="revenueChartData" :options="barChartOptions" />
          </div>
        </div>

        <!-- Vehicles Published vs Sold (Line) -->
        <div class="chart-card">
          <h2 class="chart-card__title">{{ $t('admin.metrics.vehiclesChart') }}</h2>
          <div class="chart-card__body">
            <div v-if="!vehicleActivity?.length" class="chart-card__empty">
              {{ $t('admin.metrics.noData') }}
            </div>
            <LazyLine v-else :data="vehiclesChartData" :options="lineChartOptions" />
          </div>
        </div>

        <!-- Leads per Month (Bar) -->
        <div class="chart-card">
          <h2 class="chart-card__title">{{ $t('admin.metrics.leadsChart') }}</h2>
          <div class="chart-card__body">
            <div v-if="!leadsSeries?.length" class="chart-card__empty">
              {{ $t('admin.metrics.noData') }}
            </div>
            <LazyBar v-else :data="leadsChartData" :options="barChartOptions" />
          </div>
        </div>

        <!-- Conversion Funnel (Doughnut) -->
        <div class="chart-card">
          <h2 class="chart-card__title">{{ $t('admin.metrics.funnelChart') }}</h2>
          <div class="chart-card__body">
            <div v-if="!conversionFunnel" class="chart-card__empty">
              {{ $t('admin.metrics.noData') }}
            </div>
            <LazyDoughnut v-else :data="funnelChartData" :options="doughnutChartOptions" />
          </div>
        </div>
      </section>

      <!-- 4. Rankings Section -->
      <section class="rankings-grid">
        <!-- Top 10 Dealers -->
        <div class="ranking-card">
          <h2 class="ranking-card__title">{{ $t('admin.metrics.topDealers') }}</h2>
          <div v-if="!topDealers?.length" class="ranking-card__empty">
            {{ $t('admin.metrics.noData') }}
          </div>
          <div v-else class="ranking-card__table-wrapper">
            <table class="ranking-table">
              <thead>
                <tr>
                  <th class="col-rank">{{ $t('admin.metrics.rank') }}</th>
                  <th class="col-name">{{ $t('admin.metrics.name') }}</th>
                  <th class="col-num">{{ $t('admin.metrics.vehicles') }}</th>
                  <th class="col-num">{{ $t('admin.metrics.leads') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dealer, idx) in topDealers" :key="dealer.dealerId">
                  <td class="col-rank">{{ idx + 1 }}</td>
                  <td class="col-name">{{ dealer.name }}</td>
                  <td class="col-num">{{ formatNumber(dealer.vehicleCount) }}</td>
                  <td class="col-num">{{ formatNumber(dealer.leadCount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top 10 Vehicles -->
        <div class="ranking-card">
          <h2 class="ranking-card__title">{{ $t('admin.metrics.topVehicles') }}</h2>
          <div v-if="!topVehicles?.length" class="ranking-card__empty">
            {{ $t('admin.metrics.noData') }}
          </div>
          <div v-else class="ranking-card__table-wrapper">
            <table class="ranking-table">
              <thead>
                <tr>
                  <th class="col-rank">{{ $t('admin.metrics.rank') }}</th>
                  <th class="col-name">{{ $t('admin.metrics.name') }}</th>
                  <th class="col-num">{{ $t('admin.metrics.views') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(vehicle, idx) in topVehicles" :key="vehicle.vehicleId">
                  <td class="col-rank">{{ idx + 1 }}</td>
                  <td class="col-name">{{ vehicle.title }}</td>
                  <td class="col-num">{{ formatNumber(vehicle.views) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 5. Churn Rate Card -->
      <section class="churn-card">
        <h2 class="churn-card__title">{{ $t('admin.metrics.churnTitle') }}</h2>
        <div v-if="!churnData" class="churn-card__empty">
          {{ $t('admin.metrics.noData') }}
        </div>
        <div v-else class="churn-card__body">
          <div class="churn-stats">
            <div class="churn-stat">
              <span class="churn-stat__label">{{ $t('admin.metrics.totalDealers') }}</span>
              <span class="churn-stat__value">{{ formatNumber(churnData.totalDealers) }}</span>
            </div>
            <div class="churn-stat">
              <span class="churn-stat__label">{{ $t('admin.metrics.cancelledDealers') }}</span>
              <span class="churn-stat__value churn-stat__value--cancelled">{{
                formatNumber(churnData.cancelledDealers)
              }}</span>
            </div>
            <div class="churn-stat">
              <span class="churn-stat__label">{{ $t('admin.metrics.churnRate') }}</span>
              <span class="churn-stat__value churn-stat__value--rate"
                >{{ churnData.churnRate.toFixed(1) }}%</span
              >
            </div>
          </div>
          <div class="churn-progress">
            <div class="churn-progress__track">
              <div
                class="churn-progress__bar"
                :style="{ width: `${Math.min(churnData.churnRate, 100)}%` }"
                :class="{
                  'churn-progress__bar--low': churnData.churnRate < 5,
                  'churn-progress__bar--medium':
                    churnData.churnRate >= 5 && churnData.churnRate < 15,
                  'churn-progress__bar--high': churnData.churnRate >= 15,
                }"
              />
            </div>
            <span class="churn-progress__label">{{ churnData.churnRate.toFixed(1) }}%</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* ========================================
   Metrics Dashboard — Mobile-first
   Base: 360px
   ======================================== */

.metrics-page {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

/* --- Page Header --- */

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.btn-export {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-export:hover {
  background: var(--color-primary-dark);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .btn-export {
    width: auto;
  }
}

/* --- Error & Loading --- */

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  border: 1px solid rgba(239, 68, 68, 0.3);
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-sm);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* --- KPI Summary Cards --- */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.kpi-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
  padding: 2px 0;
}

.kpi-change--up {
  color: var(--color-success);
}

.kpi-change--down {
  color: var(--color-error);
}

.change-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.kpi-sublabel {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
}

@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }

  .kpi-value {
    font-size: var(--font-size-2xl);
  }
}

/* --- Charts Section --- */

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.chart-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.chart-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.chart-card__body {
  position: relative;
  height: 280px;
}

.chart-card__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-card__body {
    height: 320px;
  }
}

/* --- Rankings Section --- */

.rankings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.ranking-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.ranking-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.ranking-card__empty {
  padding: var(--spacing-8) 0;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.ranking-card__table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.ranking-table thead th {
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.ranking-table tbody td {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--border-color-light);
  color: var(--text-primary);
  vertical-align: middle;
  min-height: 44px;
}

.ranking-table tbody tr:last-child td {
  border-bottom: none;
}

.col-rank {
  width: 48px;
  text-align: center;
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
}

.col-name {
  min-width: 120px;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ranking-table thead th.col-num {
  text-align: right;
}

@media (min-width: 768px) {
  .rankings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* --- Churn Rate Card --- */

.churn-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.churn-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.churn-card__empty {
  padding: var(--spacing-8) 0;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.churn-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.churn-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3);
}

.churn-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-1);
}

.churn-stat__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
}

.churn-stat__value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.churn-stat__value--cancelled {
  color: var(--color-error);
}

.churn-stat__value--rate {
  color: var(--color-warning);
}

.churn-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.churn-progress__track {
  flex: 1;
  height: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.churn-progress__bar {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width var(--transition-normal);
  min-width: 4px;
}

.churn-progress__bar--low {
  background: var(--color-success);
}

.churn-progress__bar--medium {
  background: var(--color-warning);
}

.churn-progress__bar--high {
  background: var(--color-error);
}

.churn-progress__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  min-width: 48px;
  text-align: right;
}

@media (min-width: 768px) {
  .churn-stat__value {
    font-size: var(--font-size-2xl);
  }
}
</style>
