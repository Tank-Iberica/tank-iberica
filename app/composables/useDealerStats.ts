/**
 * Composable for dealer statistics and analytics.
 * Plan-gated access to metrics with daily and monthly aggregations.
 * Pure functions extracted to ~/utils/dealerStats.helpers.ts
 */

import type { Database } from '~~/types/supabase'
import { canAccessMetric } from '~/utils/dealerStats.helpers'

type DealerStatsRow = Database['public']['Tables']['dealer_stats']['Row']

interface MonthlyStatsEntry {
  month: string // Format: 'YYYY-MM'
  vehicle_views: number
  profile_views: number
  leads_received: number
  leads_responded: number
  favorites_added: number
  avg_response_minutes: number | null
  conversion_rate: number | null
}

interface BestPerformingVehicle {
  vehicle_id: string
  brand: string
  model: string
  views: number
  leads: number
}

/** Composable for dealer stats. */
export function useDealerStats() {
  const supabase = useSupabaseClient<Database>()

  const dailyStats = ref<DealerStatsRow[]>([])
  const monthlyStats = ref<MonthlyStatsEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if a plan has access to a specific metric.
   * @param plan - Subscription plan tier
   * @param metric - Metric identifier
   */
  /**
   * Fetch daily stats for a dealer over the last N days.
   * @param dealerId - The dealer's unique ID
   * @param days - Number of days to fetch (default: 30)
   */
  async function loadDailyStats(dealerId: string, days: number = 30): Promise<void> {
    if (!dealerId) {
      error.value = 'Dealer ID is required'
      return
    }

    loading.value = true
    error.value = null

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffISO = cutoffDate.toISOString().split('T')[0] // YYYY-MM-DD

      const { data, error: err } = await supabase
        .from('dealer_stats')
        .select(
          'period_date, vehicle_views, profile_views, leads_received, leads_responded, favorites_added',
        )
        .eq('dealer_id', dealerId)
        .gte('period_date', cutoffISO)
        .order('period_date', { ascending: true })

      if (err) throw err

      dailyStats.value = (data || []) as DealerStatsRow[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading daily stats'
      dailyStats.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch and aggregate stats by month for the last N months.
   * @param dealerId - The dealer's unique ID
   * @param months - Number of months to aggregate (default: 12)
   */
  async function loadMonthlyStats(dealerId: string, months: number = 12): Promise<void> {
    if (!dealerId) {
      error.value = 'Dealer ID is required'
      return
    }

    loading.value = true
    error.value = null

    try {
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() - months)
      const cutoffISO = cutoffDate.toISOString().split('T')[0] // YYYY-MM-DD

      const { data, error: err } = await supabase
        .from('dealer_stats')
        .select(
          'period_date, vehicle_views, profile_views, leads_received, leads_responded, favorites_added',
        )
        .eq('dealer_id', dealerId)
        .gte('period_date', cutoffISO)
        .order('period_date', { ascending: true })

      if (err) throw err

      // Aggregate by month
      const monthlyMap = new Map<string, MonthlyStatsEntry>()

      for (const row of (data || []) as DealerStatsRow[]) {
        const month = row.period_date.substring(0, 7) // Extract 'YYYY-MM'

        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, {
            month,
            vehicle_views: 0,
            profile_views: 0,
            leads_received: 0,
            leads_responded: 0,
            favorites_added: 0,
            avg_response_minutes: null,
            conversion_rate: null,
          })
        }

        const entry = monthlyMap.get(month)!
        entry.vehicle_views += row.vehicle_views || 0
        entry.profile_views += row.profile_views || 0
        entry.leads_received += row.leads_received || 0
        entry.leads_responded += row.leads_responded || 0
        entry.favorites_added += row.favorites_added || 0
      }

      // Calculate avg_response_minutes and conversion_rate per month
      for (const entry of monthlyMap.values()) {
        if (entry.leads_received > 0) {
          entry.conversion_rate = (entry.leads_responded / entry.leads_received) * 100
        }
        // avg_response_minutes could be recalculated if raw data exists, but we'll leave it null for now
      }

      monthlyStats.value = Array.from(monthlyMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
      )
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading monthly stats'
      monthlyStats.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Computed: Total views across all days in dailyStats.
   */
  const totalViews = computed<number>(() => {
    return dailyStats.value.reduce((sum, entry) => {
      return sum + (entry.vehicle_views || 0) + (entry.profile_views || 0)
    }, 0)
  })

  /**
   * Computed: Total leads across all days in dailyStats.
   */
  const totalLeads = computed<number>(() => {
    return dailyStats.value.reduce((sum, entry) => {
      return sum + (entry.leads_received || 0)
    }, 0)
  })

  /**
   * Computed: Average conversion rate across all days in dailyStats.
   */
  const avgConversionRate = computed<number | null>(() => {
    const totalReceived = dailyStats.value.reduce(
      (sum, entry) => sum + (entry.leads_received || 0),
      0,
    )
    const totalResponded = dailyStats.value.reduce(
      (sum, entry) => sum + (entry.leads_responded || 0),
      0,
    )

    if (totalReceived === 0) return null
    return (totalResponded / totalReceived) * 100
  })

  /**
   * Computed: Best performing vehicle based on views and leads.
   * Returns null if no data is available.
   * Note: This requires joining with vehicle-level stats, which are not in dealer_stats.
   * For now, this is a placeholder that returns null.
   */
  const bestPerformingVehicle = computed<BestPerformingVehicle | null>(() => {
    // This would require a separate query to vehicle-level stats
    // Placeholder implementation
    return null
  })

  return {
    // State
    dailyStats: readonly(dailyStats),
    monthlyStats: readonly(monthlyStats),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadDailyStats,
    loadMonthlyStats,
    canAccessMetric,

    // Computed helpers
    totalViews,
    totalLeads,
    avgConversionRate,
    bestPerformingVehicle,
  }
}
