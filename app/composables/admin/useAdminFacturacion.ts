/**
 * Admin Facturacion Composable
 * Manages billing page state: invoices, stats, revenue metrics, CSV export.
 */

export interface InvoiceRow {
  id: string
  dealer_id: string | null
  service_type: string
  amount_cents: number
  tax_cents: number
  currency: string
  status: string
  created_at: string
}

export interface PeriodOption {
  value: string
  label: () => string
}

export interface LeadMetricsData {
  totalLeads: number
  leadValue: number
  totalValue: number
}

export interface ChannelRevenueData {
  key: string
  label: string
  amount: number
  percentage: number
}

/* -----------------------------------------------
   Pure utility functions (importable by subcomponents)
   ----------------------------------------------- */

export function formatAmount(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const serviceTypeLabels: Record<string, string> = {
  subscription: 'Suscripciones',
  auction_premium: 'Subastas',
  transport: 'Transporte',
  verification: 'Verificaciones',
  ad: 'Publicidad',
}

export function getServiceTypeLabel(type: string): string {
  return serviceTypeLabels[type] || type
}

export function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    paid: 'status-paid',
    pending: 'status-pending',
    failed: 'status-failed',
    refunded: 'status-refunded',
  }
  return classes[status] || ''
}

/* -----------------------------------------------
   Composable
   ----------------------------------------------- */

export function useAdminFacturacion() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()

  const invoices = ref<InvoiceRow[]>([])
  const loading = ref(true)
  const selectedPeriod = ref('this_month')

  const periods: PeriodOption[] = [
    { value: 'this_month', label: () => t('billing.thisMonth') },
    { value: 'last_month', label: () => t('billing.lastMonth') },
    { value: 'last_3_months', label: () => t('billing.last3Months') },
    { value: 'this_year', label: () => t('billing.thisYear') },
    { value: 'all', label: () => t('billing.allTime') },
  ]

  function getDateRange(period: string): { from: string; to: string } {
    const now = new Date()
    let from: Date
    let to: Date

    switch (period) {
      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'last_month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_3_months':
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear() + 1, 0, 1)
        break
      default:
        from = new Date(2020, 0, 1)
        to = new Date(now.getFullYear() + 1, 0, 1)
    }

    return { from: from.toISOString(), to: to.toISOString() }
  }

  async function loadInvoices(): Promise<void> {
    loading.value = true
    const range = getDateRange(selectedPeriod.value)

    let query = supabase
      .from('invoices')
      .select('id, dealer_id, service_type, amount_cents, tax_cents, currency, status, created_at')
      .order('created_at', { ascending: false })

    if (selectedPeriod.value !== 'all') {
      query = query.gte('created_at', range.from).lt('created_at', range.to)
    }

    const { data } = await query
    invoices.value = (data || []) as InvoiceRow[]
    loading.value = false
  }

  // Computed stats
  const totalRevenue = computed(() =>
    invoices.value.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount_cents, 0),
  )

  const totalTax = computed(() =>
    invoices.value
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.tax_cents || 0), 0),
  )

  const revenueByType = computed(() => {
    const map: Record<string, number> = {}
    invoices.value
      .filter((i) => i.status === 'paid')
      .forEach((i) => {
        map[i.service_type] = (map[i.service_type] || 0) + i.amount_cents
      })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  })

  const paidCount = computed(() => invoices.value.filter((i) => i.status === 'paid').length)
  const pendingCount = computed(() => invoices.value.filter((i) => i.status === 'pending').length)
  const failedCount = computed(() => invoices.value.filter((i) => i.status === 'failed').length)

  function getStatusLabel(status: string): string {
    const labels: Record<string, () => string> = {
      paid: () => t('billing.statusPaid'),
      pending: () => t('billing.statusPending'),
      failed: () => t('billing.statusFailed'),
      refunded: () => t('billing.statusRefunded'),
    }
    return labels[status] ? labels[status]() : status
  }

  function getRevenuePercentage(amount: number): number {
    if (totalRevenue.value === 0) return 0
    return (amount / totalRevenue.value) * 100
  }

  function exportCsv(): void {
    const headers = ['ID', 'Dealer ID', 'Tipo', 'Importe', 'IVA', 'Moneda', 'Estado', 'Fecha']
    const rows = invoices.value.map((i) => [
      i.id,
      i.dealer_id || '',
      i.service_type,
      (i.amount_cents / 100).toFixed(2),
      (i.tax_cents / 100).toFixed(2),
      i.currency,
      i.status,
      formatDate(i.created_at),
    ])

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `facturacion_${selectedPeriod.value}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Revenue metrics from external composable
  const { channelRevenue, mrr, arr, leadMetrics, loadAll: loadRevenueMetrics } = useRevenueMetrics()

  async function loadAllData(): Promise<void> {
    const range = getDateRange(selectedPeriod.value)
    await Promise.all([loadInvoices(), loadRevenueMetrics(range.from, range.to)])
  }

  function init(): void {
    loadAllData()
    watch(selectedPeriod, loadAllData)
  }

  return {
    // State
    invoices,
    loading,
    selectedPeriod,
    periods,
    // Computed
    totalRevenue,
    totalTax,
    revenueByType,
    paidCount,
    pendingCount,
    failedCount,
    // Revenue metrics
    channelRevenue,
    mrr,
    arr,
    leadMetrics,
    // Functions
    getStatusLabel,
    getRevenuePercentage,
    exportCsv,
    init,
  }
}
