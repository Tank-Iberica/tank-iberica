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

function calcCTR(impressions: number, clicks: number): string {
  return impressions ? ((clicks / impressions) * 100).toFixed(1) + '%' : '0.0%'
}

function calcRate(numerator: number, denominator: number): string {
  return denominator > 0 ? ((numerator / denominator) * 100).toFixed(1) + '%' : '0.0%'
}

function calcEcpm(revenue: number, impressions: number): number {
  return impressions > 0 ? Math.round((revenue / impressions) * 1000) : 0
}

function buildAudienceBreakdown(audienceData: AudienceProfileRow[]): AudienceSegment[] {
  const segCounts: Record<string, number> = {}
  for (const profile of audienceData) {
    for (const seg of profile.segments || []) {
      segCounts[seg] = (segCounts[seg] || 0) + 1
    }
  }
  return Object.entries(segCounts)
    .map(([segment, userCount]) => ({ segment, userCount }))
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 20)
}

function aggregateEventsByAd(
  events: AdEventRow[],
): Record<string, { impressions: number; clicks: number; viewable: number }> {
  const adAgg: Record<string, { impressions: number; clicks: number; viewable: number }> = {}
  for (const ev of events) {
    adAgg[ev.ad_id] ??= { impressions: 0, clicks: 0, viewable: 0 }
    if (ev.event_type === 'impression') adAgg[ev.ad_id]!.impressions++
    else if (ev.event_type === 'click') adAgg[ev.ad_id]!.clicks++
    else if (ev.event_type === 'viewable_impression') adAgg[ev.ad_id]!.viewable++
  }
  return adAgg
}

function buildTopAds(
  topAdIds: string[],
  adAgg: Record<string, { impressions: number; clicks: number; viewable: number }>,
  adInfoMap: Record<string, { title: string; advertiser: string; format: string }>,
): TopAd[] {
  return topAdIds.map((id) => {
    const agg = adAgg[id]!
    const info = adInfoMap[id] || { title: id, advertiser: '-', format: '-' }
    return {
      adId: id,
      title: info.title,
      advertiser: info.advertiser,
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr: calcCTR(agg.impressions, agg.clicks),
      viewableRate: calcRate(agg.viewable, agg.impressions),
      revenue: 0,
    }
  })
}

function buildCtrByFormat(
  adAgg: Record<string, { impressions: number; clicks: number; viewable: number }>,
  adInfoMap: Record<string, { title: string; advertiser: string; format: string }>,
): FormatCTR[] {
  const formatAgg: Record<string, { impressions: number; clicks: number }> = {}
  for (const [id, agg] of Object.entries(adAgg)) {
    const info = adInfoMap[id]
    if (!info) continue
    formatAgg[info.format] ??= { impressions: 0, clicks: 0 }
    formatAgg[info.format]!.impressions += agg.impressions
    formatAgg[info.format]!.clicks += agg.clicks
  }
  return Object.entries(formatAgg).map(([format, agg]) => ({
    format,
    impressions: agg.impressions,
    clicks: agg.clicks,
    ctr: calcCTR(agg.impressions, agg.clicks),
  }))
}

function aggregateAdEvents(events: AdEventRow[]) {
  let totalImpressions = 0
  let totalClicks = 0
  let totalViewable = 0
  const sourceMap: Record<string, { impressions: number; clicks: number }> = {}
  const posMap: Record<string, { impressions: number; clicks: number; viewable: number }> = {}

  for (const ev of events) {
    const src = ev.source || 'direct'
    sourceMap[src] ??= { impressions: 0, clicks: 0 }
    const pos = (ev.metadata?.position as string) || 'unknown'
    posMap[pos] ??= { impressions: 0, clicks: 0, viewable: 0 }

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
  return { totalImpressions, totalClicks, totalViewable, sourceMap, posMap }
}

function aggregateAdRevenue(revenue: RevenueRow[]) {
  let totalRevenue = 0
  const revenueSourceMap: Record<string, number> = {}
  const revenuePositionMap: Record<string, number> = {}
  for (const rev of revenue) {
    totalRevenue += rev.cpm_cents
    revenueSourceMap[rev.source] = (revenueSourceMap[rev.source] || 0) + rev.cpm_cents
    revenuePositionMap[rev.position] = (revenuePositionMap[rev.position] || 0) + rev.cpm_cents
  }
  return { totalRevenue, revenueSourceMap, revenuePositionMap }
}

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

  const DATE_RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }

  function getDateRange(): { fromDate: string; toDate: string } {
    const now = new Date()
    const isCustom = dateRange.value === 'custom'

    const fromDate =
      isCustom && customFrom.value
        ? customFrom.value
        : new Date(
            now.getTime() - (DATE_RANGE_DAYS[dateRange.value] ?? 30) * 86400000,
          ).toISOString()

    const toDate =
      isCustom && customTo.value ? new Date(customTo.value).toISOString() : now.toISOString()

    return { fromDate, toDate }
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
      const { totalImpressions, totalClicks, totalViewable, sourceMap, posMap } =
        aggregateAdEvents(events)

      // --- Revenue aggregation ---
      const { totalRevenue, revenueSourceMap, revenuePositionMap } = aggregateAdRevenue(revenue)

      // --- Summary ---
      summary.value = {
        totalImpressions,
        totalClicks,
        avgCTR: calcCTR(totalImpressions, totalClicks),
        activeAds: activeCount,
        estimatedRevenue: totalRevenue,
        avgEcpm: calcEcpm(totalRevenue, totalImpressions),
        fillRate: '\u2014',
        viewabilityRate: calcRate(totalViewable, totalImpressions),
      }

      // --- Revenue by source ---
      revenueBySource.value = Object.entries(sourceMap).map(([source, data]) => ({
        source,
        impressions: data.impressions,
        revenue: revenueSourceMap[source] || 0,
        ecpm: calcEcpm(revenueSourceMap[source] || 0, data.impressions),
      }))

      // --- Performance by position ---
      performanceByPosition.value = Object.entries(posMap).map(([position, data]) => ({
        position,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: calcCTR(data.impressions, data.clicks),
        viewableImpressions: data.viewable,
        viewabilityRate: calcRate(data.viewable, data.impressions),
        revenue: revenuePositionMap[position] || 0,
        ecpm: calcEcpm(revenuePositionMap[position] || 0, data.impressions),
      }))

      // --- Audience breakdown ---
      audienceBreakdown.value = buildAudienceBreakdown(
        (audienceResult.data || []) as AudienceProfileRow[],
      )

      // --- Top ads + CTR by format ---
      const adAgg = aggregateEventsByAd(events)
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

        topAds.value = buildTopAds(topAdIds, adAgg, adInfoMap)
        ctrByFormat.value = buildCtrByFormat(adAgg, adInfoMap)
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
