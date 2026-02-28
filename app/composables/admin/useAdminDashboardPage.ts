/**
 * Admin Dashboard Page Composable
 *
 * Extracts ALL script-level logic from pages/admin/dashboard.vue:
 * - Formatter utilities
 * - Chart color palette
 * - Chart data computeds (revenue, vehicles, leads, funnel)
 * - Chart options computeds (bar, line, doughnut)
 * - Empty-state flags
 * - Re-exports from useAdminMetrics
 *
 * The page calls `init()` inside `onMounted`.
 */

import type { ChartData, ChartOptions } from 'chart.js'
import { useAdminMetrics } from './useAdminMetrics'

// ---------------------------------------------------------------------------
// Types (module-local)
// ---------------------------------------------------------------------------

export interface DashboardChartColors {
  primary: string
  accent: string
  warning: string
  error: string
  primaryLight: string
  accentLight: string
}

// ---------------------------------------------------------------------------
// Pure formatters (importable by sub-components)
// ---------------------------------------------------------------------------

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Chart color palette
// ---------------------------------------------------------------------------

export const CHART_COLORS: DashboardChartColors = {
  primary: '#23424A',
  accent: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  primaryLight: 'rgba(35, 66, 74, 0.6)',
  accentLight: 'rgba(16, 185, 129, 0.6)',
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAdminDashboardPage() {
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

  // -----------------------------------------------------------------------
  // Chart data computeds
  // -----------------------------------------------------------------------

  const revenueChartData = computed<ChartData<'bar'>>(() => {
    const series = revenueSeries.value || []
    return {
      labels: series.map((s) => s.month),
      datasets: [
        {
          label: t('admin.metrics.revenue'),
          data: series.map((s) => s.revenue / 100),
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 4,
        },
        {
          label: t('admin.metrics.tax'),
          data: series.map((s) => s.tax / 100),
          backgroundColor: CHART_COLORS.primaryLight,
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
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(35, 66, 74, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: t('admin.metrics.sales'),
          data: series.map((s) => s.sold),
          borderColor: CHART_COLORS.accent,
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
          backgroundColor: CHART_COLORS.accent,
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
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.accent,
            CHART_COLORS.warning,
            CHART_COLORS.error,
          ],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    }
  })

  // -----------------------------------------------------------------------
  // Chart options computeds
  // -----------------------------------------------------------------------

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
            const val = ctx.parsed.y ?? 0
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
            const val = ctx.parsed.y ?? 0
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

  // -----------------------------------------------------------------------
  // Empty-state flags
  // -----------------------------------------------------------------------

  const hasRevenueData = computed(() => Boolean(revenueSeries.value?.length))
  const hasVehiclesData = computed(() => Boolean(vehicleActivity.value?.length))
  const hasLeadsData = computed(() => Boolean(leadsSeries.value?.length))
  const hasFunnelData = computed(() => Boolean(conversionFunnel.value))

  // -----------------------------------------------------------------------
  // Init (page calls this in onMounted)
  // -----------------------------------------------------------------------

  async function init(): Promise<void> {
    await loadMetrics()
  }

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    // State
    loading,
    error,

    // KPI
    kpiSummary,

    // Raw series (for rankings / churn)
    topDealers,
    topVehicles,
    churnData,

    // Chart data
    revenueChartData,
    vehiclesChartData,
    leadsChartData,
    funnelChartData,

    // Chart options
    barChartOptions,
    lineChartOptions,
    doughnutChartOptions,

    // Empty-state flags
    hasRevenueData,
    hasVehiclesData,
    hasLeadsData,
    hasFunnelData,

    // Actions
    init,
    exportMetricsCSV,
  }
}
