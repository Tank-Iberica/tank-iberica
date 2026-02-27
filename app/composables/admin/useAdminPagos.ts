/**
 * Admin Pagos Composable
 * Manages payment data, filtering, Stripe Connect accounts, and formatting helpers.
 * Does NOT call onMounted — the page is responsible for triggering data fetches.
 */

// ============================================
// TYPES
// ============================================
export interface Payment {
  id: string
  user_id: string
  type: string
  amount_cents: number
  currency: string
  status: string
  stripe_payment_id: string | null
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface DealerStripeAccount {
  id: string
  dealer_id: string
  stripe_account_id: string
  onboarding_completed: boolean
  charges_enabled: boolean
  created_at: string
  dealers: { company_name: string } | null
}

export type StatusFilter = 'all' | 'succeeded' | 'pending' | 'failed' | 'refunded'
export type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'all_time'

export interface RevenueStats {
  total: number
  subscription: number
  services: number
  auction: number
}

export interface TabCounts {
  all: number
  succeeded: number
  pending: number
  failed: number
  refunded: number
}

export const PAYMENT_TYPES = [
  'subscription',
  'auction_deposit',
  'auction_premium',
  'verification',
  'transport',
  'transfer',
  'ad',
  'one_time',
] as const

// ============================================
// PURE HELPER FUNCTIONS (standalone exports)
// ============================================
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncateId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}...` : id
}

export function getTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    subscription: 'type-subscription',
    auction_deposit: 'type-auction-deposit',
    auction_premium: 'type-auction-premium',
    verification: 'type-verification',
    transport: 'type-transport',
    transfer: 'type-transfer',
    ad: 'type-ad',
    one_time: 'type-one-time',
  }
  return map[type] || 'type-one-time'
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    succeeded: 'status-succeeded',
    pending: 'status-pending',
    failed: 'status-failed',
    refunded: 'status-refunded',
    cancelled: 'status-cancelled',
  }
  return map[status] || 'status-pending'
}

export function getStripePaymentUrl(stripeId: string | null): string {
  if (!stripeId) return ''
  return `https://dashboard.stripe.com/payments/${stripeId}`
}

export function getStripeAccountUrl(accountId: string): string {
  return `https://dashboard.stripe.com/connect/accounts/${accountId}`
}

// ============================================
// COMPOSABLE
// ============================================
export function useAdminPagos() {
  const supabase = useSupabaseClient()

  // State
  const payments = ref<Payment[]>([])
  const stripeAccounts = ref<DealerStripeAccount[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const activeTab = ref<StatusFilter>('all')
  const dateRange = ref<DateRange>('this_month')
  const expandedId = ref<string | null>(null)

  // Computed
  const dateFilter = computed<string | null>(() => {
    const now = new Date()
    switch (dateRange.value) {
      case 'this_month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      case 'last_month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      case 'last_3_months':
        return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()
      default:
        return null
    }
  })

  const filteredByDate = computed<Payment[]>(() => {
    if (!dateFilter.value) return payments.value
    return payments.value.filter((p) => p.created_at >= dateFilter.value!)
  })

  const filteredPayments = computed<Payment[]>(() => {
    let result = payments.value

    if (dateFilter.value) {
      result = result.filter((p) => p.created_at >= dateFilter.value!)
    }

    if (activeTab.value !== 'all') {
      result = result.filter((p) => p.status === activeTab.value)
    }

    return result
  })

  const revenueStats = computed<RevenueStats>(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const succeededThisMonth = payments.value.filter(
      (p) => p.status === 'succeeded' && p.created_at >= monthStart,
    )

    const total = succeededThisMonth.reduce((sum, p) => sum + p.amount_cents, 0)
    const subscription = succeededThisMonth
      .filter((p) => p.type === 'subscription')
      .reduce((sum, p) => sum + p.amount_cents, 0)
    const services = succeededThisMonth
      .filter((p) => ['transport', 'transfer', 'insurance'].includes(p.type))
      .reduce((sum, p) => sum + p.amount_cents, 0)
    const auction = succeededThisMonth
      .filter((p) => ['auction_deposit', 'auction_premium'].includes(p.type))
      .reduce((sum, p) => sum + p.amount_cents, 0)

    return { total, subscription, services, auction }
  })

  const tabCounts = computed<TabCounts>(() => ({
    all: filteredByDate.value.length,
    succeeded: filteredByDate.value.filter((p) => p.status === 'succeeded').length,
    pending: filteredByDate.value.filter((p) => p.status === 'pending').length,
    failed: filteredByDate.value.filter((p) => p.status === 'failed').length,
    refunded: filteredByDate.value.filter((p) => p.status === 'refunded').length,
  }))

  // Data loading
  async function fetchPayments() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      payments.value = (data as Payment[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchStripeAccounts() {
    try {
      const { data, error: fetchError } = await supabase
        .from('dealer_stripe_accounts')
        .select('*, dealers(company_name)')
        .order('created_at', { ascending: false })

      if (fetchError) return

      stripeAccounts.value = (data as unknown as DealerStripeAccount[]) || []
    } catch {
      // Silently fail for stripe accounts — not critical
    }
  }

  // Actions
  function toggleExpand(id: string) {
    expandedId.value = expandedId.value === id ? null : id
  }

  function clearError() {
    error.value = null
  }

  function setActiveTab(tab: StatusFilter) {
    activeTab.value = tab
  }

  function setDateRange(range: DateRange) {
    dateRange.value = range
  }

  return {
    // State
    payments,
    stripeAccounts,
    loading,
    error,
    activeTab,
    dateRange,
    expandedId,
    // Computed
    dateFilter,
    filteredByDate,
    filteredPayments,
    revenueStats,
    tabCounts,
    // Actions
    fetchPayments,
    fetchStripeAccounts,
    toggleExpand,
    clearError,
    setActiveTab,
    setDateRange,
  }
}
