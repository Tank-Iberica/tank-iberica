/**
 * Per-vehicle analytics composable.
 *
 * Aggregates analytics_events by vehicle to provide performance metrics:
 * - Views (total + unique sessions)
 * - Leads (contacts/calls/messages)
 * - Favorites count
 * - Click-through rate (views → lead conversion)
 * - Average view duration
 *
 * Used in dealer dashboard and admin product management.
 */

export interface VehicleMetrics {
  vehicleId: string
  totalViews: number
  uniqueViews: number
  totalLeads: number
  favorites: number
  avgDurationSeconds: number
  conversionRate: number // leads / uniqueViews (0-1)
}

export interface VehicleMetricsSummary {
  totalViews: number
  totalLeads: number
  totalFavorites: number
  avgConversionRate: number
  topPerformers: VehicleMetrics[]
  underperformers: VehicleMetrics[]
}

export type MetricsPeriod = '7d' | '30d' | '90d' | 'all'

function periodToDate(period: MetricsPeriod): string | null {
  if (period === 'all') return null
  let days: number
  if (period === '7d') days = 7
  else if (period === '30d') days = 30
  else days = 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/**
 * Calculate conversion rate safely (avoid division by zero).
 */
export function calcConversionRate(leads: number, uniqueViews: number): number {
  if (uniqueViews === 0) return 0
  return Math.min(1, leads / uniqueViews)
}

/**
 * Classify vehicle performance relative to fleet average.
 */
export function classifyPerformance(
  vehicleRate: number,
  avgRate: number,
): 'above' | 'average' | 'below' {
  if (avgRate === 0) return 'average'
  if (vehicleRate >= avgRate * 1.5) return 'above'
  if (vehicleRate <= avgRate * 0.5) return 'below'
  return 'average'
}

interface RawEvent {
  entity_id: string
  event_type: string
  session_id: string | null
  metadata: Record<string, unknown> | null
}

interface EventBucket {
  views: number
  sessions: Set<string>
  leads: number
  favorites: number
  totalDuration: number
  durationCount: number
}

function aggregateEvents(vehicleIds: string[], events: unknown[]): VehicleMetrics[] {
  const agg = new Map<string, EventBucket>()
  for (const vid of vehicleIds) {
    agg.set(vid, {
      views: 0,
      sessions: new Set(),
      leads: 0,
      favorites: 0,
      totalDuration: 0,
      durationCount: 0,
    })
  }

  for (const event of events as RawEvent[]) {
    const bucket = agg.get(event.entity_id)
    if (!bucket) continue

    switch (event.event_type) {
      case 'vehicle_view':
        bucket.views++
        if (event.session_id) bucket.sessions.add(event.session_id)
        break
      case 'vehicle_duration': {
        const duration = Number(event.metadata?.page_duration_seconds ?? 0)
        if (duration > 0) {
          bucket.totalDuration += duration
          bucket.durationCount++
        }
        break
      }
      case 'lead_sent':
        bucket.leads++
        break
      case 'favorite_added':
        bucket.favorites++
        break
    }
  }

  const result: VehicleMetrics[] = []
  for (const [vid, data] of agg.entries()) {
    const uniqueViews = data.sessions.size || data.views
    result.push({
      vehicleId: vid,
      totalViews: data.views,
      uniqueViews,
      totalLeads: data.leads,
      favorites: data.favorites,
      avgDurationSeconds:
        data.durationCount > 0 ? Math.round(data.totalDuration / data.durationCount) : 0,
      conversionRate: calcConversionRate(data.leads, uniqueViews),
    })
  }
  return result
}

function buildMetricsSummary(result: VehicleMetrics[]): VehicleMetricsSummary {
  const totalViews = result.reduce((s, m) => s + m.totalViews, 0)
  const totalLeads = result.reduce((s, m) => s + m.totalLeads, 0)
  const totalFavorites = result.reduce((s, m) => s + m.favorites, 0)
  const totalUniqueViews = result.reduce((s, m) => s + m.uniqueViews, 0)
  const sorted = [...result].sort((a, b) => b.conversionRate - a.conversionRate)

  return {
    totalViews,
    totalLeads,
    totalFavorites,
    avgConversionRate: calcConversionRate(totalLeads, totalUniqueViews),
    topPerformers: sorted.slice(0, 5),
    underperformers: sorted.slice(-5).reverse(),
  }
}

export function useProductAnalytics(dealerId?: Ref<string | null>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any

  const metrics = ref<VehicleMetrics[]>([])
  const summary = ref<VehicleMetricsSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch per-vehicle metrics for the dealer's fleet.
   */
  async function fetchMetrics(period: MetricsPeriod = '30d'): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const dId = dealerId?.value
      if (!dId) {
        metrics.value = []
        summary.value = null
        return
      }

      // Get dealer's vehicles
      const { data: vehicles, error: vErr } = await supabase
        .from('vehicles')
        .select('id')
        .eq('dealer_id', dId)
        .eq('status', 'published')

      if (vErr) throw vErr
      if (!vehicles?.length) {
        metrics.value = []
        summary.value = null
        return
      }

      const vehicleIds = vehicles.map((v: { id: string }) => v.id)

      // Get analytics events for these vehicles
      let query = supabase
        .from('analytics_events')
        .select('entity_id, event_type, session_id, metadata')
        .in('entity_id', vehicleIds)
        .in('event_type', ['vehicle_view', 'vehicle_duration', 'lead_sent', 'favorite_added'])

      const since = periodToDate(period)
      if (since) {
        query = query.gte('created_at', since)
      }

      const { data: events, error: eErr } = await query
      if (eErr) throw eErr

      const result = aggregateEvents(vehicleIds, events ?? [])
      metrics.value = result
      summary.value = buildMetricsSummary(result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching analytics'
    } finally {
      loading.value = false
    }
  }

  /**
   * Get metrics for a single vehicle.
   */
  function getVehicleMetrics(vehicleId: string): VehicleMetrics | undefined {
    return metrics.value.find((m) => m.vehicleId === vehicleId)
  }

  return {
    metrics: readonly(metrics),
    summary: readonly(summary),
    loading: readonly(loading),
    error: readonly(error),
    fetchMetrics,
    getVehicleMetrics,
  }
}
