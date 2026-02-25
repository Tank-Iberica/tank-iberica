/**
 * Composable for admin revenue metrics by channel.
 * Queries payments table for succeeded payments, calculates MRR/ARR,
 * and provides channel breakdown + monthly evolution data.
 */

interface ChannelDef {
  key: string
  label_es: string
  label_en: string
}

interface ChannelRevenue {
  key: string
  label: string
  amount: number
  percentage: number
}

interface MonthlyData {
  month: string
  total: number
  byChannel: Record<string, number>
}

interface LeadMetrics {
  totalLeads: number
  leadValue: number
  totalValue: number
}

export function useRevenueMetrics() {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const channels: ChannelDef[] = [
    { key: 'subscription', label_es: 'Suscripciones', label_en: 'Subscriptions' },
    { key: 'auction_premium', label_es: 'Comisión subastas', label_en: 'Auction commission' },
    { key: 'ad', label_es: 'Publicidad', label_en: 'Advertising' },
    { key: 'verification', label_es: 'Verificaciones DGT', label_en: 'DGT verifications' },
    { key: 'transport', label_es: 'Transporte', label_en: 'Transport' },
  ]

  const channelRevenue = ref<ChannelRevenue[]>([])
  const mrr = ref(0)
  const arr = ref(0)
  const monthlyEvolution = ref<MonthlyData[]>([])
  const leadMetrics = ref<LeadMetrics>({ totalLeads: 0, leadValue: 15, totalValue: 0 })
  const loading = ref(false)

  function channelLabel(ch: ChannelDef): string {
    return locale.value === 'en' ? ch.label_en : ch.label_es
  }

  async function fetchRevenueByChannel(from: string, to: string): Promise<void> {
    const { data } = await supabase
      .from('payments')
      .select('type, amount_cents')
      .eq('status', 'succeeded')
      .gte('created_at', from)
      .lte('created_at', to)

    const byChannel: Record<string, number> = {}
    for (const row of (data || []) as Array<{ type: string; amount_cents: number }>) {
      const key = row.type || 'other'
      byChannel[key] = (byChannel[key] || 0) + (row.amount_cents || 0)
    }

    const total = Object.values(byChannel).reduce((s, v) => s + v, 0)

    channelRevenue.value = channels.map((ch) => ({
      key: ch.key,
      label: channelLabel(ch),
      amount: byChannel[ch.key] || 0,
      percentage: total > 0 ? ((byChannel[ch.key] || 0) / total) * 100 : 0,
    }))
  }

  async function fetchMRR(): Promise<void> {
    const { data } = await supabase
      .from('subscriptions')
      .select('price_cents')
      .eq('status', 'active')

    const total = ((data || []) as Array<{ price_cents: number | null }>).reduce(
      (sum, s) => sum + (s.price_cents || 0),
      0,
    )
    mrr.value = total
    arr.value = total * 12
  }

  async function fetchMonthlyEvolution(months: number = 12): Promise<void> {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

    const { data } = await supabase
      .from('payments')
      .select('type, amount_cents, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', from.toISOString())

    const monthMap: Record<string, Record<string, number>> = {}

    for (const row of (data || []) as Array<{
      type: string
      amount_cents: number
      created_at: string
    }>) {
      const d = new Date(row.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[key]) monthMap[key] = {}
      monthMap[key][row.type] = (monthMap[key][row.type] || 0) + (row.amount_cents || 0)
    }

    monthlyEvolution.value = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, byChannel]) => ({
        month,
        total: Object.values(byChannel).reduce((s, v) => s + v, 0),
        byChannel,
      }))
  }

  async function fetchLeadMetrics(): Promise<void> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'contact_click')
      .gte('created_at', monthStart)

    const totalLeads = count || 0
    const leadValue = 15 // €15 per lead (configurable later)
    leadMetrics.value = {
      totalLeads,
      leadValue,
      totalValue: totalLeads * leadValue,
    }
  }

  async function loadAll(from: string, to: string): Promise<void> {
    loading.value = true
    await Promise.all([
      fetchRevenueByChannel(from, to),
      fetchMRR(),
      fetchMonthlyEvolution(),
      fetchLeadMetrics(),
    ])
    loading.value = false
  }

  return {
    channels,
    channelRevenue: readonly(channelRevenue),
    mrr: readonly(mrr),
    arr: readonly(arr),
    monthlyEvolution: readonly(monthlyEvolution),
    leadMetrics: readonly(leadMetrics),
    loading: readonly(loading),
    channelLabel,
    fetchRevenueByChannel,
    fetchMRR,
    fetchMonthlyEvolution,
    fetchLeadMetrics,
    loadAll,
  }
}
