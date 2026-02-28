/**
 * Admin Ad Dashboard Composable
 * Extracts and enhances the dashboard analytics logic from publicidad.vue.
 * Provides aggregated metrics: summary, revenue by source, position performance,
 * CTR by format, top ads, and audience breakdown.
 */

// ─── Types ──────────────────────────────────────────────────

export interface DashboardSummary {
  totalImpressions: number
  totalClicks: number
  avgCTR: string
  activeAds: number
  estimatedRevenue: number // in cents
  avgEcpm: number // in cents
  fillRate: string
  viewabilityRate: string
}

export interface RevenueBySource {
  source: string
  impressions: number
  revenue: number // cents
  ecpm: number // cents
}

export interface PositionPerformance {
  position: string
  impressions: number
  clicks: number
  ctr: string
  viewableImpressions: number
  viewabilityRate: string
  revenue: number // cents
  ecpm: number // cents
}

export interface FormatCTR {
  format: string
  impressions: number
  clicks: number
  ctr: string
}

export interface TopAd {
  adId: string
  title: string
  advertiser: string
  impressions: number
  clicks: number
  ctr: string
  viewableRate: string
  revenue: number
}

export interface AudienceSegment {
  segment: string
  userCount: number
}

interface AdEventRow {
  ad_id: string
  event_type: string
  source: string | null
  metadata: Record<string, unknown> | null
}

interface RevenueRow {
  position: string
  source: string
  bidder: string | null
  cpm_cents: number
}

interface AudienceProfileRow {
  segments: string[]
}

interface AdInfoRow {
  id: string
  title: string
  format: string
  advertiser: { company_name: string } | null
}

// ─── Composable ─────────────────────────────────────────────

export function useAdminAdDashboard() {
  const supabase = useSupabaseClient()

  const dateRange = ref<'7d' | '30d' | '90d' | 'custom'>('30d')
  const customFrom = ref('')
  const customTo = ref('')
  const loading = ref(false)
  const error = ref('')

  const summary = ref<DashboardSummary>({
    totalImpressions: 0,
    totalClicks: 0,
    avgCTR: '0.0%',
    activeAds: 0,
    estimatedRevenue: 0,
    avgEcpm: 0,
    fillRate: '\u2014',
    viewabilityRate: '0.0%',
  })

  const revenueBySource = ref<RevenueBySource[]>([])
  const performanceByPosition = ref<PositionPerformance[]>([])
  const ctrByFormat = ref<FormatCTR[]>([])
  const topAds = ref<TopAd[]>([])
  const audienceBreakdown = ref<AudienceSegment[]>([])

  // ─── Helpers ────────────────────────────────────────────────

  function getDateRange(): { fromDate: string; toDate: string } {
    const now = new Date()
    let fromDate: string

    if (dateRange.value === 'custom' && customFrom.value) {
      fromDate = customFrom.value
    } else {
      const days = dateRange.value === '7d' ? 7 : dateRange.value === '90d' ? 90 : 30
      const d = new Date(now)
      d.setDate(d.getDate() - days)
      fromDate = d.toISOString()
    }

    const toDate =
      dateRange.value === 'custom' && customTo.value
        ? new Date(customTo.value).toISOString()
        : now.toISOString()

    return { fromDate, toDate }
  }

  function calcCTR(impressions: number, clicks: number): string {
    if (!impressions) return '0.0%'
    return ((clicks / impressions) * 100).toFixed(1) + '%'
  }

  // ─── Fetch Dashboard ───────────────────────────────────────

  async function fetchDashboard() {
    loading.value = true
    error.value = ''
    const { fromDate, toDate } = getDateRange()

    try {
      // Parallel queries
      const [eventsResult, revenueResult, activeCountResult, audienceResult] = await Promise.all([
        supabase
          .from('ad_events')
          .select('ad_id, event_type, source, metadata')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('ad_revenue_log')
          .select('position, source, bidder, cpm_cents')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_ad_profiles').select('segments').gte('last_active_at', fromDate),
      ])

      const events = (eventsResult.data || []) as AdEventRow[]
      const revenue = (revenueResult.data || []) as RevenueRow[]
      const activeCount = activeCountResult.count || 0

      // --- Aggregate events ---
      let totalImpressions = 0
      let totalClicks = 0
      let totalViewable = 0

      const sourceMap: Record<string, { impressions: number; clicks: number }> = {}
      const posMap: Record<string, { impressions: number; clicks: number; viewable: number }> = {}

      for (const ev of events) {
        const src = ev.source || 'direct'
        if (!sourceMap[src]) sourceMap[src] = { impressions: 0, clicks: 0 }

        // Extract position from metadata if available
        const pos = (ev.metadata?.position as string) || 'unknown'
        if (!posMap[pos]) posMap[pos] = { impressions: 0, clicks: 0, viewable: 0 }

        if (ev.event_type === 'impression') {
          totalImpressions++
          sourceMap[src].impressions++
          posMap[pos].impressions++
        } else if (ev.event_type === 'click') {
          totalClicks++
          sourceMap[src].clicks++
          posMap[pos].clicks++
        } else if (ev.event_type === 'viewable_impression') {
          totalViewable++
          posMap[pos].viewable++
        }
      }

      // --- Revenue aggregation ---
      let totalRevenue = 0
      const revenueSourceMap: Record<string, number> = {}
      const revenuePositionMap: Record<string, number> = {}

      for (const rev of revenue) {
        totalRevenue += rev.cpm_cents
        revenueSourceMap[rev.source] = (revenueSourceMap[rev.source] || 0) + rev.cpm_cents
        revenuePositionMap[rev.position] = (revenuePositionMap[rev.position] || 0) + rev.cpm_cents
      }

      // --- Summary ---
      const avgEcpm =
        totalImpressions > 0 ? Math.round((totalRevenue / totalImpressions) * 1000) : 0

      summary.value = {
        totalImpressions,
        totalClicks,
        avgCTR: calcCTR(totalImpressions, totalClicks),
        activeAds: activeCount,
        estimatedRevenue: totalRevenue,
        avgEcpm,
        fillRate: '\u2014', // Would need ad request tracking
        viewabilityRate:
          totalImpressions > 0
            ? ((totalViewable / totalImpressions) * 100).toFixed(1) + '%'
            : '0.0%',
      }

      // --- Revenue by source ---
      revenueBySource.value = Object.entries(sourceMap).map(([source, data]) => ({
        source,
        impressions: data.impressions,
        revenue: revenueSourceMap[source] || 0,
        ecpm:
          data.impressions > 0
            ? Math.round(((revenueSourceMap[source] || 0) / data.impressions) * 1000)
            : 0,
      }))

      // --- Performance by position ---
      performanceByPosition.value = Object.entries(posMap).map(([position, data]) => ({
        position,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: calcCTR(data.impressions, data.clicks),
        viewableImpressions: data.viewable,
        viewabilityRate:
          data.impressions > 0
            ? ((data.viewable / data.impressions) * 100).toFixed(1) + '%'
            : '0.0%',
        revenue: revenuePositionMap[position] || 0,
        ecpm:
          data.impressions > 0
            ? Math.round(((revenuePositionMap[position] || 0) / data.impressions) * 1000)
            : 0,
      }))

      // --- Audience breakdown ---
      const segCounts: Record<string, number> = {}
      for (const profile of (audienceResult.data || []) as AudienceProfileRow[]) {
        for (const seg of profile.segments || []) {
          segCounts[seg] = (segCounts[seg] || 0) + 1
        }
      }
      audienceBreakdown.value = Object.entries(segCounts)
        .map(([segment, userCount]) => ({ segment, userCount }))
        .sort((a, b) => b.userCount - a.userCount)
        .slice(0, 20)

      // --- Top ads (fetch ad info for enrichment) ---
      const adAgg: Record<string, { impressions: number; clicks: number; viewable: number }> = {}
      for (const ev of events) {
        if (!adAgg[ev.ad_id]) adAgg[ev.ad_id] = { impressions: 0, clicks: 0, viewable: 0 }
        if (ev.event_type === 'impression') adAgg[ev.ad_id]!.impressions++
        else if (ev.event_type === 'click') adAgg[ev.ad_id]!.clicks++
        else if (ev.event_type === 'viewable_impression') adAgg[ev.ad_id]!.viewable++
      }

      const topAdIds = Object.entries(adAgg)
        .sort((a, b) => b[1].impressions - a[1].impressions)
        .slice(0, 10)
        .map(([id]) => id)

      if (topAdIds.length) {
        const { data: adsInfo } = await supabase
          .from('ads')
          .select('id, title, format, advertiser:advertisers(company_name)')
          .in('id', topAdIds)

        const adInfoMap: Record<string, { title: string; advertiser: string; format: string }> = {}
        for (const a of (adsInfo || []) as AdInfoRow[]) {
          adInfoMap[a.id] = {
            title: a.title,
            advertiser: (a.advertiser as { company_name: string } | null)?.company_name || '-',
            format: a.format,
          }
        }

        topAds.value = topAdIds.map((id) => {
          const agg = adAgg[id]!
          const info = adInfoMap[id] || { title: id, advertiser: '-', format: '-' }
          return {
            adId: id,
            title: info.title,
            advertiser: info.advertiser,
            impressions: agg.impressions,
            clicks: agg.clicks,
            ctr: calcCTR(agg.impressions, agg.clicks),
            viewableRate:
              agg.impressions > 0
                ? ((agg.viewable / agg.impressions) * 100).toFixed(1) + '%'
                : '0.0%',
            revenue: 0, // Could aggregate from revenue log per ad_id
          }
        })

        // --- CTR by format ---
        const formatAgg: Record<string, { impressions: number; clicks: number }> = {}
        for (const [id, agg] of Object.entries(adAgg)) {
          const info = adInfoMap[id]
          if (!info) continue
          if (!formatAgg[info.format]) formatAgg[info.format] = { impressions: 0, clicks: 0 }
          formatAgg[info.format]!.impressions += agg.impressions
          formatAgg[info.format]!.clicks += agg.clicks
        }
        ctrByFormat.value = Object.entries(formatAgg).map(([format, agg]) => ({
          format,
          impressions: agg.impressions,
          clicks: agg.clicks,
          ctr: calcCTR(agg.impressions, agg.clicks),
        }))
      } else {
        topAds.value = []
        ctrByFormat.value = []
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  // Watch date range changes
  watch(dateRange, (val) => {
    if (val !== 'custom') fetchDashboard()
  })

  return {
    dateRange,
    customFrom,
    customTo,
    loading,
    error,
    summary,
    revenueBySource,
    performanceByPosition,
    ctrByFormat,
    topAds,
    audienceBreakdown,
    fetchDashboard,
    calcCTR,
  }
}
