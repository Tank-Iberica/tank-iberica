import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Metrics — Activity & Rankings queries
 * Handles: vehicle activity, top dealers, top vehicles, funnel, churn.
 * Extracted from useAdminMetrics.ts (Auditoría #7 Iter. 15)
 */
import {
  getMonthLabel,
  getMonthsRange,
  monthStart,
  monthEnd,
} from '~/composables/shared/dateHelpers'
import type {
  VehicleActivityPoint,
  TopDealer,
  TopVehicle,
  ConversionFunnel,
  ChurnRate,
} from '~/utils/adminMetricsTypes'

function resolveCompanyName(companyName: Record<string, string> | string | null): string {
  if (!companyName) return ''
  if (typeof companyName === 'string') return companyName
  return companyName.es ?? companyName.en ?? Object.values(companyName)[0] ?? ''
}

async function resolveDealerNames(
  supabase: SupabaseClient,
  dealerIds: string[],
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>()
  const { data: dealerData } = await supabase
    .from('dealers')
    .select('id, company_name')
    .in('id', dealerIds)

  if (dealerData) {
    for (const row of dealerData as {
      id: string
      company_name: Record<string, string> | string
    }[]) {
      nameMap.set(row.id, resolveCompanyName(row.company_name))
    }
    return nameMap
  }

  // Fallback: try users table
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
  return nameMap
}

function countById<T extends Record<string, unknown>>(
  rows: T[],
  idField: keyof T,
  valueField?: keyof T,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    const id = row[idField] as string | null
    if (!id) continue
    const value = valueField ? ((row[valueField] as number | null) ?? 1) : 1
    map.set(id, (map.get(id) ?? 0) + value)
  }
  return map
}

function topN(map: Map<string, number>, n: number): [string, number][] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

function countByMonth(
  rows: Array<{ [key: string]: string | null }>,
  dateField: string,
  series: VehicleActivityPoint[],
  target: 'published' | 'sold',
): void {
  for (const row of rows) {
    const dateStr = row[dateField]
    if (!dateStr) continue
    const label = getMonthLabel(new Date(dateStr))
    const entry = series.find((s) => s.month === label)
    if (entry) entry[target]++
  }
}

async function queryVehicleActivity(
  supabase: SupabaseClient,
  months: Date[],
  series: VehicleActivityPoint[],
): Promise<void> {
  const rangeStart = monthStart(months[0]!)
  const rangeEnd = monthEnd(months.at(-1)!)

  const { data: createdData } = await supabase
    .from('vehicles')
    .select('created_at')
    .gte('created_at', rangeStart)
    .lt('created_at', rangeEnd)

  if (createdData) {
    countByMonth(
      createdData as Array<{ created_at: string | null }>,
      'created_at',
      series,
      'published',
    )
  }

  const { data: soldData } = await supabase
    .from('vehicles')
    .select('sold_at')
    .not('sold_at', 'is', null)
    .gte('sold_at', rangeStart)
    .lt('sold_at', rangeEnd)

  if (soldData) {
    countByMonth(soldData as Array<{ sold_at: string | null }>, 'sold_at', series, 'sold')
  }
}

async function queryLeadCounts(supabase: SupabaseClient): Promise<Map<string, number>> {
  try {
    const { data: leadData } = await supabase.from('leads').select('dealer_id')
    if (leadData) return countById(leadData as { dealer_id: string }[], 'dealer_id')
  } catch {
    /* leads table may not exist */
  }
  return new Map<string, number>()
}

function buildTopDealersList(
  sorted: [string, number][],
  nameMap: Map<string, string>,
  leadCountMap: Map<string, number>,
): TopDealer[] {
  return sorted.map(([id, count]) => ({
    dealerId: id,
    name: nameMap.get(id) ?? id,
    vehicleCount: count,
    leadCount: leadCountMap.get(id) ?? 0,
  }))
}

async function queryVehicleTitles(
  supabase: SupabaseClient,
  vehicleIds: string[],
): Promise<Map<string, string>> {
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
    /* vehicles table issue */
  }
  return titleMap
}

async function queryTotalViews(supabase: SupabaseClient): Promise<number> {
  try {
    const { data } = await supabase.from('user_vehicle_views').select('view_count')
    if (!data) return 0
    return (data as { view_count: number | null }[]).reduce(
      (sum, r) => sum + (r.view_count ?? 0),
      0,
    )
  } catch {
    return 0
  }
}

async function queryUniqueVehicleViews(supabase: SupabaseClient): Promise<number> {
  try {
    const { data } = await supabase.from('user_vehicle_views').select('vehicle_id')
    if (!data) return 0
    return new Set((data as { vehicle_id: string }[]).map((r) => r.vehicle_id).filter(Boolean)).size
  } catch {
    return 0
  }
}

async function queryTableCount(
  supabase: SupabaseClient,
  table: string,
  filter?: { field: string; value: unknown },
): Promise<number> {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })
    if (filter) query = query.not(filter.field, 'is', filter.value)
    const { count } = await query
    return count ?? 0
  } catch {
    return 0
  }
}

function computeChurnRate(total: number, cancelled: number): number {
  return total > 0 ? Math.round((cancelled / total) * 10000) / 100 : 0
}

/** Composable for admin metrics activity. */
export function useAdminMetricsActivity() {
  const supabase = useSupabaseClient()

  const vehicleActivity = ref<VehicleActivityPoint[]>([])
  const topDealers = ref<TopDealer[]>([])
  const topVehicles = ref<TopVehicle[]>([])
  const conversionFunnel = ref<ConversionFunnel>({ visits: 0, vehicleViews: 0, leads: 0, sales: 0 })
  const churnRate = ref<ChurnRate>({ totalDealers: 0, cancelledDealers: 0, churnRate: 0 })

  async function loadVehicleActivity(): Promise<void> {
    const months = getMonthsRange(12)
    const series: VehicleActivityPoint[] = months.map((m) => ({
      month: getMonthLabel(m),
      published: 0,
      sold: 0,
    }))
    try {
      await queryVehicleActivity(supabase, months, series)
    } catch {
      /* vehicles table or column issue */
    }
    vehicleActivity.value = series
  }

  async function loadTopDealers(): Promise<void> {
    try {
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('dealer_id')
        .not('dealer_id', 'is', null)
      if (!vehicleData?.length) {
        topDealers.value = []
        return
      }

      const vehicleCountMap = countById(vehicleData as { dealer_id: string | null }[], 'dealer_id')
      const leadCountMap = await queryLeadCounts(supabase)
      const sorted = topN(vehicleCountMap, 10)
      const nameMap = await resolveDealerNames(
        supabase,
        sorted.map(([id]) => id),
      )
      topDealers.value = buildTopDealersList(sorted, nameMap, leadCountMap)
    } catch {
      topDealers.value = []
    }
  }

  async function loadTopVehicles(): Promise<void> {
    try {
      const { data: viewData } = await supabase
        .from('user_vehicle_views')
        .select('vehicle_id, view_count')
      if (!viewData?.length) {
        topVehicles.value = []
        return
      }

      const viewMap = countById(
        viewData as { vehicle_id: string; view_count: number | null }[],
        'vehicle_id',
        'view_count',
      )
      const sorted = topN(viewMap, 10)
      const titleMap = await queryVehicleTitles(
        supabase,
        sorted.map(([id]) => id),
      )
      topVehicles.value = sorted.map(([id, views]) => ({
        vehicleId: id,
        title: titleMap.get(id) ?? id,
        views,
      }))
    } catch {
      topVehicles.value = []
    }
  }

  async function loadConversionFunnel(): Promise<void> {
    const [visits, vehicleViews, leads, sales] = await Promise.all([
      queryTotalViews(supabase),
      queryUniqueVehicleViews(supabase),
      queryTableCount(supabase, 'contacts'),
      queryTableCount(supabase, 'vehicles', { field: 'sold_at', value: null }),
    ])
    conversionFunnel.value = { visits, vehicleViews, leads, sales }
  }

  async function loadChurnRate(): Promise<void> {
    let totalDealers = 0
    let cancelledDealers = 0
    try {
      const { count: t } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
      totalDealers = t ?? 0
      const { count: c } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'canceled')
      cancelledDealers = c ?? 0
    } catch {
      /* subscriptions table issue */
    }
    churnRate.value = {
      totalDealers,
      cancelledDealers,
      churnRate: computeChurnRate(totalDealers, cancelledDealers),
    }
  }

  return {
    vehicleActivity,
    topDealers,
    topVehicles,
    conversionFunnel,
    churnRate,
    loadVehicleActivity,
    loadTopDealers,
    loadTopVehicles,
    loadConversionFunnel,
    loadChurnRate,
  }
}
