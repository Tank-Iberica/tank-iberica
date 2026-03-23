/**
 * Dealer Link & QR Analytics Composable
 * Fetches QR scan and link click stats for the authenticated dealer.
 */
export interface LinkAnalyticsSummary {
  totalQrScans: number
  totalLinkClicks: number
  totalAll: number
  bySource: { source: string; count: number }[]
  byDevice: { device: string; count: number }[]
  last30Days: { date: string; count: number }[]
}

export function useDealerLinkAnalytics(dealerId: Ref<string | null>) {
  const supabase = useSupabaseClient()
  const loading = ref(false)
  const stats = ref<LinkAnalyticsSummary | null>(null)

  async function loadStats() {
    if (!dealerId.value) return
    loading.value = true

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabase
      .from('analytics_events')
      .select('event_type, utm_source, utm_medium, device_type, created_at')
      .eq('entity_type', 'dealer')
      .eq('entity_id', dealerId.value)
      .in('event_type', ['qr_scan', 'link_click'])
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const events =
      (data as
        | {
            event_type: string
            utm_source: string | null
            utm_medium: string | null
            device_type: string | null
            created_at: string
          }[]
        | null) ?? []

    let totalQrScans = 0
    let totalLinkClicks = 0
    const sourceMap = new Map<string, number>()
    const deviceMap = new Map<string, number>()
    const dayMap = new Map<string, number>()

    for (const e of events) {
      if (e.event_type === 'qr_scan') totalQrScans++
      else totalLinkClicks++

      const src = e.utm_medium || e.utm_source || 'direct'
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1)

      const dev = e.device_type || 'unknown'
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1)

      const day = e.created_at?.substring(0, 10) || ''
      if (day) dayMap.set(day, (dayMap.get(day) || 0) + 1)
    }

    stats.value = {
      totalQrScans,
      totalLinkClicks,
      totalAll: totalQrScans + totalLinkClicks,
      bySource: [...sourceMap.entries()]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      byDevice: [...deviceMap.entries()]
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count),
      last30Days: [...dayMap.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }

    loading.value = false
  }

  watch(
    dealerId,
    (id) => {
      if (id) loadStats()
    },
    { immediate: true },
  )

  return { stats, loading, loadStats }
}
