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

/** Composable for admin metrics revenue. */
export function useAdminMetricsRevenue() {
  const supabase = useSupabaseClient()

  const kpiSummary = ref<KpiSummary>({
    monthlyRevenue: { current: 0, previousMonth: 0, changePercent: 0 },
    activeVehicles: { current: 0, previousMonth: 0, changePercent: 0 },
    activeDealers: { current: 0, previousMonth: 0, changePercent: 0 },
    monthlyLeads: { current: 0, previousMonth: 0, changePercent: 0 },
    arpu: { current: 0, previousMonth: 0, changePercent: 0 },
  })
  const revenueSeries = ref<RevenuePoint[]>([])
  const leadsSeries = ref<LeadsPoint[]>([])

  // ── KPI helpers ───────────────────────────────────────────────────────────

  async function sumPaidInvoices(start: string, end: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('amount_cents')
        .eq('status', 'paid')
        .gte('created_at', start)
        .lt('created_at', end)
      return (
        (data as { amount_cents: number }[] | null)?.reduce(
          (s, r) => s + (r.amount_cents ?? 0),
          0,
        ) ?? 0
      )
    } catch {
      return 0
    }
  }

  async function countPublishedVehicles(beforeDate?: string): Promise<number> {
    try {
      let q = supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
      if (beforeDate) q = q.lt('created_at', beforeDate)
      const { count } = await q
      return count ?? 0
    } catch {
      return 0
    }
  }

  async function countDistinctDealers(beforeDate?: string): Promise<number> {
    try {
      let q = supabase
        .from('vehicles')
        .select('dealer_id')
        .eq('status', 'published')
        .not('dealer_id', 'is', null)
      if (beforeDate) q = q.lt('created_at', beforeDate)
      const { data } = await q
      if (!data) return 0
      return new Set(
        (data as { dealer_id: string | null }[])
          .map((r) => r.dealer_id)
          .filter(Boolean) as string[],
      ).size
    } catch {
      return 0
    }
  }

  async function countContactsInRange(start: string, end: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end)
      return count ?? 0
    } catch {
      return 0
    }
  }

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

    const [
      revCurrent,
      revPrevious,
      vehiclesCurrent,
      vehiclesPrevious,
      dealersCurrent,
      dealersPrevious,
      leadsCurrent,
      leadsPrevious,
    ] = await Promise.all([
      sumPaidInvoices(curStart, curEnd),
      sumPaidInvoices(prevStart, prevEnd),
      countPublishedVehicles(),
      countPublishedVehicles(prevEnd),
      countDistinctDealers(),
      countDistinctDealers(prevEnd),
      countContactsInRange(curStart, curEnd),
      countContactsInRange(prevStart, prevEnd),
    ])

    const arpuCurrent = dealersCurrent > 0 ? Math.round(revCurrent / dealersCurrent) : 0
    const arpuPrevious = dealersPrevious > 0 ? Math.round(revPrevious / dealersPrevious) : 0

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
      arpu: {
        current: arpuCurrent,
        previousMonth: arpuPrevious,
        changePercent: pctChange(arpuCurrent, arpuPrevious),
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
      const rangeEnd = monthEnd(months.at(-1)!)

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
      const rangeEnd = monthEnd(months.at(-1)!)

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
