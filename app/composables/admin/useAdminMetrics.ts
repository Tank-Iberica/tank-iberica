/**
 * Admin Metrics Composable
 * Provides all data-fetching logic for the admin metrics/KPI dashboard (Session 27).
 *
 * Each query is wrapped in try/catch so individual failures do not break
 * the whole dashboard. Tables that may not exist or lack expected columns
 * fall back to empty/zero defaults.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers (shared with useDealerStats, useDealerDashboard, useMarketData)
// ---------------------------------------------------------------------------

import {
  getMonthLabel,
  getMonthsRange,
  monthStart,
  monthEnd,
  pctChange,
} from '~/composables/shared/dateHelpers'

export interface KpiValue {
  current: number
  previousMonth: number
  changePercent: number
}

export interface KpiSummary {
  monthlyRevenue: KpiValue
  activeVehicles: KpiValue
  activeDealers: KpiValue
  monthlyLeads: KpiValue
}

export interface RevenuePoint {
  month: string
  revenue: number
  tax: number
}

export interface VehicleActivityPoint {
  month: string
  published: number
  sold: number
}

export interface LeadsPoint {
  month: string
  leads: number
}

export interface TopDealer {
  dealerId: string
  name: string
  vehicleCount: number
  leadCount: number
}

export interface TopVehicle {
  vehicleId: string
  title: string
  views: number
}

export interface ConversionFunnel {
  visits: number
  vehicleViews: number
  leads: number
  sales: number
}

export interface ChurnRate {
  totalDealers: number
  cancelledDealers: number
  churnRate: number
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAdminMetrics() {
  const supabase = useSupabaseClient()

  // -- Reactive state -------------------------------------------------------

  const loading = ref(false)
  const error = ref<string>('')

  const kpiSummary = ref<KpiSummary>({
    monthlyRevenue: { current: 0, previousMonth: 0, changePercent: 0 },
    activeVehicles: { current: 0, previousMonth: 0, changePercent: 0 },
    activeDealers: { current: 0, previousMonth: 0, changePercent: 0 },
    monthlyLeads: { current: 0, previousMonth: 0, changePercent: 0 },
  })

  const revenueSeries = ref<RevenuePoint[]>([])
  const vehicleActivity = ref<VehicleActivityPoint[]>([])
  const leadsSeries = ref<LeadsPoint[]>([])
  const topDealers = ref<TopDealer[]>([])
  const topVehicles = ref<TopVehicle[]>([])
  const conversionFunnel = ref<ConversionFunnel>({
    visits: 0,
    vehicleViews: 0,
    leads: 0,
    sales: 0,
  })
  const churnRate = ref<ChurnRate>({
    totalDealers: 0,
    cancelledDealers: 0,
    churnRate: 0,
  })

  // -------------------------------------------------------------------------
  // 1. KPI Summary Cards
  // -------------------------------------------------------------------------

  async function loadKpiSummary(): Promise<void> {
    const now = new Date()
    const curStart = monthStart(now)
    const curEnd = monthEnd(now)
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStart = monthStart(prevMonth)
    const prevEnd = monthEnd(prevMonth)

    // --- Monthly Revenue ---
    let revCurrent = 0
    let revPrevious = 0
    try {
      const { data: curData } = await supabase
        .from('invoices')
        .select('amount_cents')
        .eq('status', 'paid')
        .gte('created_at', curStart)
        .lt('created_at', curEnd)

      if (curData) {
        for (const row of curData as { amount_cents: number }[]) {
          revCurrent += row.amount_cents ?? 0
        }
      }

      const { data: prevData } = await supabase
        .from('invoices')
        .select('amount_cents')
        .eq('status', 'paid')
        .gte('created_at', prevStart)
        .lt('created_at', prevEnd)

      if (prevData) {
        for (const row of prevData as { amount_cents: number }[]) {
          revPrevious += row.amount_cents ?? 0
        }
      }
    } catch {
      // invoices table may not exist or lack columns
    }

    // --- Active Vehicles (published) ---
    let vehiclesCurrent = 0
    let vehiclesPrevious = 0
    try {
      const { count: curCount } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')

      vehiclesCurrent = curCount ?? 0

      // Approximation for previous month: published vehicles created before prev month end
      // Since we cannot snapshot historical status, we count vehicles created before prevEnd
      // that are still published as a rough proxy.
      const { count: prevCount } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .lt('created_at', prevEnd)

      vehiclesPrevious = prevCount ?? 0
    } catch {
      // vehicles table issue
    }

    // --- Active Dealers (distinct dealer_id on published vehicles) ---
    let dealersCurrent = 0
    let dealersPrevious = 0
    try {
      const { data: curDealers } = await supabase
        .from('vehicles')
        .select('dealer_id')
        .eq('status', 'published')
        .not('dealer_id', 'is', null)

      if (curDealers) {
        const unique = new Set<string>()
        for (const row of curDealers as { dealer_id: string | null }[]) {
          if (row.dealer_id) unique.add(row.dealer_id)
        }
        dealersCurrent = unique.size
      }

      const { data: prevDealers } = await supabase
        .from('vehicles')
        .select('dealer_id')
        .eq('status', 'published')
        .lt('created_at', prevEnd)
        .not('dealer_id', 'is', null)

      if (prevDealers) {
        const unique = new Set<string>()
        for (const row of prevDealers as { dealer_id: string | null }[]) {
          if (row.dealer_id) unique.add(row.dealer_id)
        }
        dealersPrevious = unique.size
      }
    } catch {
      // vehicles or dealer_id column missing
    }

    // --- Monthly Leads (contacts created this month vs previous) ---
    let leadsCurrent = 0
    let leadsPrevious = 0
    try {
      const { count: curLeads } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', curStart)
        .lt('created_at', curEnd)

      leadsCurrent = curLeads ?? 0

      const { count: prevLeads } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', prevStart)
        .lt('created_at', prevEnd)

      leadsPrevious = prevLeads ?? 0
    } catch {
      // contacts table issue
    }

    kpiSummary.value = {
      monthlyRevenue: {
        current: revCurrent,
        previousMonth: revPrevious,
        changePercent: pctChange(revCurrent, revPrevious),
      },
      activeVehicles: {
        current: vehiclesCurrent,
        previousMonth: vehiclesPrevious,
        changePercent: pctChange(vehiclesCurrent, vehiclesPrevious),
      },
      activeDealers: {
        current: dealersCurrent,
        previousMonth: dealersPrevious,
        changePercent: pctChange(dealersCurrent, dealersPrevious),
      },
      monthlyLeads: {
        current: leadsCurrent,
        previousMonth: leadsPrevious,
        changePercent: pctChange(leadsCurrent, leadsPrevious),
      },
    }
  }

  // -------------------------------------------------------------------------
  // 2. Monthly Revenue Series (last 12 months)
  // -------------------------------------------------------------------------

  async function loadRevenueSeries(): Promise<void> {
    const months = getMonthsRange(12)
    const series: RevenuePoint[] = months.map((m) => ({
      month: getMonthLabel(m),
      revenue: 0,
      tax: 0,
    }))

    try {
      const rangeStart = monthStart(months[0])
      const rangeEnd = monthEnd(months[months.length - 1])

      const { data } = await supabase
        .from('invoices')
        .select('amount_cents, tax_cents, created_at')
        .eq('status', 'paid')
        .gte('created_at', rangeStart)
        .lt('created_at', rangeEnd)

      if (data) {
        for (const row of data as {
          amount_cents: number
          tax_cents: number | null
          created_at: string | null
        }[]) {
          if (!row.created_at) continue
          const label = getMonthLabel(new Date(row.created_at))
          const entry = series.find((s) => s.month === label)
          if (entry) {
            entry.revenue += row.amount_cents ?? 0
            entry.tax += row.tax_cents ?? 0
          }
        }
      }
    } catch {
      // invoices table issue
    }

    revenueSeries.value = series
  }

  // -------------------------------------------------------------------------
  // 3. Vehicles Published / Sold per Month (last 12 months)
  // -------------------------------------------------------------------------

  async function loadVehicleActivity(): Promise<void> {
    const months = getMonthsRange(12)
    const series: VehicleActivityPoint[] = months.map((m) => ({
      month: getMonthLabel(m),
      published: 0,
      sold: 0,
    }))

    try {
      const rangeStart = monthStart(months[0])
      const rangeEnd = monthEnd(months[months.length - 1])

      // Published = vehicles created in that month
      const { data: createdData } = await supabase
        .from('vehicles')
        .select('created_at')
        .gte('created_at', rangeStart)
        .lt('created_at', rangeEnd)

      if (createdData) {
        for (const row of createdData as { created_at: string | null }[]) {
          if (!row.created_at) continue
          const label = getMonthLabel(new Date(row.created_at))
          const entry = series.find((s) => s.month === label)
          if (entry) entry.published++
        }
      }

      // Sold = vehicles where sold_at falls in that month
      const { data: soldData } = await supabase
        .from('vehicles')
        .select('sold_at')
        .not('sold_at', 'is', null)
        .gte('sold_at', rangeStart)
        .lt('sold_at', rangeEnd)

      if (soldData) {
        for (const row of soldData as { sold_at: string | null }[]) {
          if (!row.sold_at) continue
          const label = getMonthLabel(new Date(row.sold_at))
          const entry = series.find((s) => s.month === label)
          if (entry) entry.sold++
        }
      }
    } catch {
      // vehicles table or column issue
    }

    vehicleActivity.value = series
  }

  // -------------------------------------------------------------------------
  // 4. Leads per Month (last 12 months)
  // -------------------------------------------------------------------------

  async function loadLeadsSeries(): Promise<void> {
    const months = getMonthsRange(12)
    const series: LeadsPoint[] = months.map((m) => ({
      month: getMonthLabel(m),
      leads: 0,
    }))

    try {
      const rangeStart = monthStart(months[0])
      const rangeEnd = monthEnd(months[months.length - 1])

      const { data } = await supabase
        .from('contacts')
        .select('created_at')
        .gte('created_at', rangeStart)
        .lt('created_at', rangeEnd)

      if (data) {
        for (const row of data as { created_at: string | null }[]) {
          if (!row.created_at) continue
          const label = getMonthLabel(new Date(row.created_at))
          const entry = series.find((s) => s.month === label)
          if (entry) entry.leads++
        }
      }
    } catch {
      // contacts table issue
    }

    leadsSeries.value = series
  }

  // -------------------------------------------------------------------------
  // 5. Top 10 Dealers by Activity
  // -------------------------------------------------------------------------

  async function loadTopDealers(): Promise<void> {
    try {
      // Fetch vehicles grouped by dealer_id
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('dealer_id')
        .not('dealer_id', 'is', null)

      if (!vehicleData || vehicleData.length === 0) {
        topDealers.value = []
        return
      }

      // Count vehicles per dealer
      const vehicleCountMap = new Map<string, number>()
      for (const row of vehicleData as { dealer_id: string | null }[]) {
        if (!row.dealer_id) continue
        vehicleCountMap.set(row.dealer_id, (vehicleCountMap.get(row.dealer_id) ?? 0) + 1)
      }

      // Count leads per dealer from leads table
      const leadCountMap = new Map<string, number>()
      try {
        const { data: leadData } = await supabase.from('leads').select('dealer_id')

        if (leadData) {
          for (const row of leadData as { dealer_id: string }[]) {
            if (!row.dealer_id) continue
            leadCountMap.set(row.dealer_id, (leadCountMap.get(row.dealer_id) ?? 0) + 1)
          }
        }
      } catch {
        // leads table may not exist; fall back to zero leads
      }

      // Sort by vehicle count desc, take top 10
      const sorted = Array.from(vehicleCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const dealerIds = sorted.map(([id]) => id)

      // Fetch dealer names from dealers table
      const nameMap = new Map<string, string>()
      try {
        const { data: dealerData } = await supabase
          .from('dealers')
          .select('id, company_name')
          .in('id', dealerIds)

        if (dealerData) {
          for (const row of dealerData as {
            id: string
            company_name: Record<string, string> | string
          }[]) {
            // company_name is JSONB (localized), try to extract a readable name
            let name = ''
            if (typeof row.company_name === 'string') {
              name = row.company_name
            } else if (row.company_name && typeof row.company_name === 'object') {
              name =
                (row.company_name as Record<string, string>).es ??
                (row.company_name as Record<string, string>).en ??
                Object.values(row.company_name as Record<string, string>)[0] ??
                ''
            }
            nameMap.set(row.id, name)
          }
        }
      } catch {
        // dealers table may not exist; try users table as fallback
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, company_name')
            .in('id', dealerIds)

          if (userData) {
            for (const row of userData as {
              id: string
              name: string | null
              company_name: string | null
            }[]) {
              nameMap.set(row.id, row.company_name ?? row.name ?? row.id)
            }
          }
        } catch {
          // fallback to id as name
        }
      }

      topDealers.value = sorted.map(([id, count]) => ({
        dealerId: id,
        name: nameMap.get(id) ?? id,
        vehicleCount: count,
        leadCount: leadCountMap.get(id) ?? 0,
      }))
    } catch {
      topDealers.value = []
    }
  }

  // -------------------------------------------------------------------------
  // 6. Top 10 Vehicles by Views
  // -------------------------------------------------------------------------

  async function loadTopVehicles(): Promise<void> {
    try {
      // user_vehicle_views has view_count per user+vehicle pair.
      // Aggregate total views per vehicle.
      const { data: viewData } = await supabase
        .from('user_vehicle_views')
        .select('vehicle_id, view_count')

      if (!viewData || viewData.length === 0) {
        topVehicles.value = []
        return
      }

      const viewMap = new Map<string, number>()
      for (const row of viewData as { vehicle_id: string; view_count: number | null }[]) {
        if (!row.vehicle_id) continue
        viewMap.set(row.vehicle_id, (viewMap.get(row.vehicle_id) ?? 0) + (row.view_count ?? 0))
      }

      // Sort desc and take top 10
      const sorted = Array.from(viewMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const vehicleIds = sorted.map(([id]) => id)

      // Fetch vehicle titles
      const titleMap = new Map<string, string>()
      try {
        const { data: vData } = await supabase
          .from('vehicles')
          .select('id, brand, model, year')
          .in('id', vehicleIds)

        if (vData) {
          for (const row of vData as {
            id: string
            brand: string
            model: string
            year: number | null
          }[]) {
            const parts = [row.brand, row.model]
            if (row.year) parts.push(String(row.year))
            titleMap.set(row.id, parts.join(' '))
          }
        }
      } catch {
        // vehicles table issue
      }

      topVehicles.value = sorted.map(([id, views]) => ({
        vehicleId: id,
        title: titleMap.get(id) ?? id,
        views,
      }))
    } catch {
      topVehicles.value = []
    }
  }

  // -------------------------------------------------------------------------
  // 7. Conversion Funnel
  // -------------------------------------------------------------------------

  async function loadConversionFunnel(): Promise<void> {
    let visits = 0
    let vehicleViews = 0
    let leads = 0
    let sales = 0

    // visits = sum of view_count across all user_vehicle_views rows
    try {
      const { data: viewData } = await supabase.from('user_vehicle_views').select('view_count')

      if (viewData) {
        for (const row of viewData as { view_count: number | null }[]) {
          visits += row.view_count ?? 0
        }
      }
    } catch {
      // user_vehicle_views table issue
    }

    // vehicleViews = count of distinct vehicles with at least one view
    try {
      const { data: viewedData } = await supabase.from('user_vehicle_views').select('vehicle_id')

      if (viewedData) {
        const unique = new Set<string>()
        for (const row of viewedData as { vehicle_id: string }[]) {
          if (row.vehicle_id) unique.add(row.vehicle_id)
        }
        vehicleViews = unique.size
      }
    } catch {
      // user_vehicle_views table issue
    }

    // leads = total contacts
    try {
      const { count } = await supabase.from('contacts').select('id', { count: 'exact', head: true })

      leads = count ?? 0
    } catch {
      // contacts table issue
    }

    // sales = count of vehicles with sold_at not null
    try {
      const { count } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .not('sold_at', 'is', null)

      sales = count ?? 0
    } catch {
      // vehicles table issue
    }

    conversionFunnel.value = { visits, vehicleViews, leads, sales }
  }

  // -------------------------------------------------------------------------
  // 8. Churn Rate
  // -------------------------------------------------------------------------

  async function loadChurnRate(): Promise<void> {
    let totalDealers = 0
    let cancelledDealers = 0

    try {
      const { count: totalCount } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })

      totalDealers = totalCount ?? 0

      const { count: cancelledCount } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'cancelled')

      cancelledDealers = cancelledCount ?? 0
    } catch {
      // subscriptions table issue
    }

    const rate = totalDealers > 0 ? Math.round((cancelledDealers / totalDealers) * 10000) / 100 : 0

    churnRate.value = { totalDealers, cancelledDealers, churnRate: rate }
  }

  // -------------------------------------------------------------------------
  // 9. CSV Export
  // -------------------------------------------------------------------------

  function exportMetricsCSV(): void {
    const rows: string[][] = []

    // Header
    rows.push(['Metric', 'Current', 'Previous Month', 'Change %'])

    // KPI cards
    const kpi = kpiSummary.value
    rows.push([
      'Monthly Revenue (cents)',
      String(kpi.monthlyRevenue.current),
      String(kpi.monthlyRevenue.previousMonth),
      String(kpi.monthlyRevenue.changePercent),
    ])
    rows.push([
      'Active Vehicles',
      String(kpi.activeVehicles.current),
      String(kpi.activeVehicles.previousMonth),
      String(kpi.activeVehicles.changePercent),
    ])
    rows.push([
      'Active Dealers',
      String(kpi.activeDealers.current),
      String(kpi.activeDealers.previousMonth),
      String(kpi.activeDealers.changePercent),
    ])
    rows.push([
      'Monthly Leads',
      String(kpi.monthlyLeads.current),
      String(kpi.monthlyLeads.previousMonth),
      String(kpi.monthlyLeads.changePercent),
    ])

    // Blank separator
    rows.push([])

    // Revenue series
    rows.push(['Month', 'Revenue (cents)', 'Tax (cents)'])
    for (const point of revenueSeries.value) {
      rows.push([point.month, String(point.revenue), String(point.tax)])
    }

    rows.push([])

    // Vehicle activity
    rows.push(['Month', 'Published', 'Sold'])
    for (const point of vehicleActivity.value) {
      rows.push([point.month, String(point.published), String(point.sold)])
    }

    rows.push([])

    // Leads series
    rows.push(['Month', 'Leads'])
    for (const point of leadsSeries.value) {
      rows.push([point.month, String(point.leads)])
    }

    rows.push([])

    // Top dealers
    rows.push(['Dealer ID', 'Name', 'Vehicle Count', 'Lead Count'])
    for (const d of topDealers.value) {
      rows.push([d.dealerId, d.name, String(d.vehicleCount), String(d.leadCount)])
    }

    rows.push([])

    // Top vehicles
    rows.push(['Vehicle ID', 'Title', 'Views'])
    for (const v of topVehicles.value) {
      rows.push([v.vehicleId, v.title, String(v.views)])
    }

    rows.push([])

    // Conversion funnel
    rows.push(['Funnel Stage', 'Count'])
    const funnel = conversionFunnel.value
    rows.push(['Visits (total views)', String(funnel.visits)])
    rows.push(['Vehicle Views (unique vehicles)', String(funnel.vehicleViews)])
    rows.push(['Leads', String(funnel.leads)])
    rows.push(['Sales', String(funnel.sales)])

    rows.push([])

    // Churn rate
    rows.push(['Churn Metric', 'Value'])
    const churn = churnRate.value
    rows.push(['Total Dealers (subscriptions)', String(churn.totalDealers)])
    rows.push(['Cancelled Dealers', String(churn.cancelledDealers)])
    rows.push(['Churn Rate (%)', String(churn.churnRate)])

    // Build CSV string
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // Trigger download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `metrics_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // -------------------------------------------------------------------------
  // 10. Load all metrics in parallel
  // -------------------------------------------------------------------------

  async function loadMetrics(): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const results = await Promise.allSettled([
        loadKpiSummary(),
        loadRevenueSeries(),
        loadVehicleActivity(),
        loadLeadsSeries(),
        loadTopDealers(),
        loadTopVehicles(),
        loadConversionFunnel(),
        loadChurnRate(),
      ])

      // Collect any rejected promises into error string
      const failures: string[] = []
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
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const reason =
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          failures.push(`${labels[index]}: ${reason}`)
        }
      })

      if (failures.length > 0) {
        error.value = failures.join('; ')
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading metrics'
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),

    // KPI data
    kpiSummary: readonly(kpiSummary),
    revenueSeries: readonly(revenueSeries),
    vehicleActivity: readonly(vehicleActivity),
    leadsSeries: readonly(leadsSeries),
    topDealers: readonly(topDealers),
    topVehicles: readonly(topVehicles),
    conversionFunnel: readonly(conversionFunnel),
    churnRate: readonly(churnRate),

    // Actions
    loadMetrics,
    exportMetricsCSV,
  }
}
