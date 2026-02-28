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

export function useAdminMetricsActivity() {
  const supabase = useSupabaseClient()

  const vehicleActivity = ref<VehicleActivityPoint[]>([])
  const topDealers = ref<TopDealer[]>([])
  const topVehicles = ref<TopVehicle[]>([])
  const conversionFunnel = ref<ConversionFunnel>({ visits: 0, vehicleViews: 0, leads: 0, sales: 0 })
  const churnRate = ref<ChurnRate>({ totalDealers: 0, cancelledDealers: 0, churnRate: 0 })

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
      const rangeStart = monthStart(months[0]!)
      const rangeEnd = monthEnd(months[months.length - 1]!)

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
  // 5. Top 10 Dealers by Activity
  // -------------------------------------------------------------------------

  async function loadTopDealers(): Promise<void> {
    try {
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('dealer_id')
        .not('dealer_id', 'is', null)

      if (!vehicleData || vehicleData.length === 0) {
        topDealers.value = []
        return
      }

      const vehicleCountMap = new Map<string, number>()
      for (const row of vehicleData as { dealer_id: string | null }[]) {
        if (!row.dealer_id) continue
        vehicleCountMap.set(row.dealer_id, (vehicleCountMap.get(row.dealer_id) ?? 0) + 1)
      }

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

      const sorted = Array.from(vehicleCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const dealerIds = sorted.map(([id]) => id)

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

      const sorted = Array.from(viewMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const vehicleIds = sorted.map(([id]) => id)

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

    try {
      const { data: viewData } = await supabase.from('user_vehicle_views').select('view_count')
      if (viewData) {
        for (const row of viewData as { view_count: number | null }[]) {
          visits += row.view_count ?? 0
        }
      }
    } catch {
      /* user_vehicle_views table issue */
    }

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
      /* user_vehicle_views table issue */
    }

    try {
      const { count } = await supabase.from('contacts').select('id', { count: 'exact', head: true })
      leads = count ?? 0
    } catch {
      /* contacts table issue */
    }

    try {
      const { count } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .not('sold_at', 'is', null)
      sales = count ?? 0
    } catch {
      /* vehicles table issue */
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
