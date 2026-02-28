/**
 * Admin Metrics — Revenue & Leads queries
 * Handles: KPI summary, revenue series, leads series.
 * Extracted from useAdminMetrics.ts (Auditoría #7 Iter. 15)
 */
import {
  getMonthLabel,
  getMonthsRange,
  monthStart,
  monthEnd,
  pctChange,
} from '~/composables/shared/dateHelpers'
import type { KpiSummary, RevenuePoint, LeadsPoint } from '~/utils/adminMetricsTypes'

export function useAdminMetricsRevenue() {
  const supabase = useSupabaseClient()

  const kpiSummary = ref<KpiSummary>({
    monthlyRevenue: { current: 0, previousMonth: 0, changePercent: 0 },
    activeVehicles: { current: 0, previousMonth: 0, changePercent: 0 },
    activeDealers: { current: 0, previousMonth: 0, changePercent: 0 },
    monthlyLeads: { current: 0, previousMonth: 0, changePercent: 0 },
  })
  const revenueSeries = ref<RevenuePoint[]>([])
  const leadsSeries = ref<LeadsPoint[]>([])

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

    // --- Monthly Leads ---
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
      const rangeStart = monthStart(months[0]!)
      const rangeEnd = monthEnd(months[months.length - 1]!)

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
  // 4. Leads per Month (last 12 months)
  // -------------------------------------------------------------------------

  async function loadLeadsSeries(): Promise<void> {
    const months = getMonthsRange(12)
    const series: LeadsPoint[] = months.map((m) => ({
      month: getMonthLabel(m),
      leads: 0,
    }))

    try {
      const rangeStart = monthStart(months[0]!)
      const rangeEnd = monthEnd(months[months.length - 1]!)

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

  return {
    kpiSummary,
    revenueSeries,
    leadsSeries,
    loadKpiSummary,
    loadRevenueSeries,
    loadLeadsSeries,
  }
}
