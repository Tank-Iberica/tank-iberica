/**
 * Admin Metrics Composable — Orchestrator
 * Coordinates all KPI/metrics data for the admin dashboard (Session 27).
 *
 * Revenue & leads queries → useAdminMetricsRevenue
 * Activity & rankings    → useAdminMetricsActivity
 * CSV export             → utils/adminMetricsExport
 * Types                  → utils/adminMetricsTypes
 */
import { useAdminMetricsRevenue } from '~/composables/admin/useAdminMetricsRevenue'
import { useAdminMetricsActivity } from '~/composables/admin/useAdminMetricsActivity'
import { exportMetricsCSV } from '~/utils/adminMetricsExport'

// Re-export types so consumers keep a single import point
export type {
  KpiValue,
  KpiSummary,
  RevenuePoint,
  VehicleActivityPoint,
  LeadsPoint,
  TopDealer,
  TopVehicle,
  ConversionFunnel,
  ChurnRate,
} from '~/utils/adminMetricsTypes'

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAdminMetrics() {
  const loading = ref(false)
  const error = ref<string>('')

  const revenue = useAdminMetricsRevenue()
  const activity = useAdminMetricsActivity()

  // -------------------------------------------------------------------------
  // Load all metrics in parallel
  // -------------------------------------------------------------------------

  async function loadMetrics(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const results = await Promise.allSettled([
        revenue.loadKpiSummary(),
        revenue.loadRevenueSeries(),
        activity.loadVehicleActivity(),
        revenue.loadLeadsSeries(),
        activity.loadTopDealers(),
        activity.loadTopVehicles(),
        activity.loadConversionFunnel(),
        activity.loadChurnRate(),
      ])

      const labels = [
        'KPI Summary',
        'Revenue Series',
        'Vehicle Activity',
        'Leads Series',
        'Top Dealers',
        'Top Vehicles',
        'Conversion Funnel',
        'Churn Rate',
      ]

      const failures: string[] = []
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const reason =
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          failures.push(`${labels[index]}: ${reason}`)
        }
      })

      if (failures.length > 0) error.value = failures.join('; ')
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading metrics'
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // CSV Export (delegates to pure utility)
  // -------------------------------------------------------------------------

  function exportMetrics(): void {
    exportMetricsCSV({
      kpiSummary: revenue.kpiSummary.value,
      revenueSeries: revenue.revenueSeries.value,
      leadsSeries: revenue.leadsSeries.value,
      vehicleActivity: activity.vehicleActivity.value,
      topDealers: activity.topDealers.value,
      topVehicles: activity.topVehicles.value,
      conversionFunnel: activity.conversionFunnel.value,
      churnRate: activity.churnRate.value,
    })
  }

  // -------------------------------------------------------------------------
  // Return (readonly to prevent external mutation)
  // -------------------------------------------------------------------------

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    // KPI data
    kpiSummary: readonly(revenue.kpiSummary),
    revenueSeries: readonly(revenue.revenueSeries),
    leadsSeries: readonly(revenue.leadsSeries),
    vehicleActivity: readonly(activity.vehicleActivity),
    topDealers: readonly(activity.topDealers),
    topVehicles: readonly(activity.topVehicles),
    conversionFunnel: readonly(activity.conversionFunnel),
    churnRate: readonly(activity.churnRate),
    // Actions
    loadMetrics,
    exportMetricsCSV: exportMetrics,
  }
}
