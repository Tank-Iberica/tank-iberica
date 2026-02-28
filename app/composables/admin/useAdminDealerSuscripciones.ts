/**
 * Admin Dealer Subscriptions Composable
 * Extracted from pages/admin/dealers/suscripciones.vue
 *
 * Manages dealer subscription CRUD, filtering, and modal state.
 * Does NOT call onMounted — the page handles lifecycle.
 */

import { localizedField } from '~/composables/useLocalized'
import { getVerticalSlug } from '~/composables/useVerticalConfig'

// ---------- Types ----------
export interface DealerInfo {
  id: string
  company_name: Record<string, string> | null
  slug: string
  status: string | null
  user_id: string | null
  vertical: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  vertical: string
  plan: string
  status: string | null
  price_cents: number | null
  started_at: string | null
  expires_at: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DealerSubscription extends SubscriptionRow {
  dealer: DealerInfo | null
}

export type PlanType = 'free' | 'basic' | 'premium' | 'founding'
export type StatusType = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface CancelModalState {
  show: boolean
  subscription: DealerSubscription | null
  confirmText: string
}

export interface NewModalState {
  show: boolean
  selectedDealerId: string
  selectedPlan: PlanType
  selectedVertical: string
  priceCents: number
}

export interface ExtendModalState {
  show: boolean
  subscription: DealerSubscription | null
}

export interface ChangePlanModalState {
  show: boolean
  subscription: DealerSubscription | null
  newPlan: PlanType
}

// ---------- Constants ----------
export const PLANS: Array<{ value: PlanType; label: string; color: string }> = [
  { value: 'free', label: 'Free', color: '#6b7280' },
  { value: 'basic', label: 'Basic', color: '#3b82f6' },
  { value: 'premium', label: 'Premium', color: '#8b5cf6' },
  { value: 'founding', label: 'Founding', color: '#d97706' },
]

export const STATUSES: Array<{ value: StatusType; label: string; color: string }> = [
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'canceled', label: 'Canceled', color: '#ef4444' },
  { value: 'past_due', label: 'Past Due', color: '#f59e0b' },
  { value: 'trialing', label: 'Trialing', color: '#6366f1' },
]

export const FOUNDING_MAX_PER_VERTICAL = 10

// ---------- Composable ----------
export function useAdminDealerSuscripciones() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()

  // ---------- State ----------
  const subscriptions = ref<DealerSubscription[]>([])
  const allDealers = ref<DealerInfo[]>([])
  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Filters
  const searchQuery = ref('')
  const filterPlan = ref<PlanType | null>(null)
  const filterStatus = ref<StatusType | null>(null)

  // Modals
  const cancelModal = ref<CancelModalState>({
    show: false,
    subscription: null,
    confirmText: '',
  })

  const newModal = ref<NewModalState>({
    show: false,
    selectedDealerId: '',
    selectedPlan: 'basic',
    selectedVertical: getVerticalSlug(),
    priceCents: 0,
  })

  const extendModal = ref<ExtendModalState>({
    show: false,
    subscription: null,
  })

  const changePlanModal = ref<ChangePlanModalState>({
    show: false,
    subscription: null,
    newPlan: 'basic',
  })

  // ---------- Computed ----------
  const canCancel = computed(() => cancelModal.value.confirmText.toLowerCase() === 'cancelar')

  const filteredSubscriptions = computed(() => {
    let result = subscriptions.value

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter((s) => {
        const companyName = s.dealer?.company_name
          ? localizedField(s.dealer.company_name as Record<string, string>, locale.value)
          : ''
        return companyName.toLowerCase().includes(q)
      })
    }

    if (filterPlan.value) {
      result = result.filter((s) => s.plan === filterPlan.value)
    }

    if (filterStatus.value) {
      result = result.filter((s) => s.status === filterStatus.value)
    }

    return result
  })

  const total = computed(() => filteredSubscriptions.value.length)

  const foundingCountByVertical = computed(() => {
    const map: Record<string, number> = {}
    for (const sub of subscriptions.value) {
      if (sub.plan === 'founding' && sub.status === 'active') {
        const v = sub.vertical || getVerticalSlug()
        map[v] = (map[v] || 0) + 1
      }
    }
    return map
  })

  const uniqueVerticals = computed(() => {
    const set = new Set<string>()
    for (const sub of subscriptions.value) {
      set.add(sub.vertical || getVerticalSlug())
    }
    for (const d of allDealers.value) {
      set.add(d.vertical || getVerticalSlug())
    }
    return Array.from(set).sort()
  })

  const availableDealersForNew = computed(() => {
    const existingUserIds = new Set(subscriptions.value.map((s) => s.user_id))
    return allDealers.value.filter((d) => d.user_id && !existingUserIds.has(d.user_id))
  })

  // ---------- Fetch Data ----------
  async function fetchSubscriptions() {
    loading.value = true
    error.value = null

    try {
      // Fetch subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (subsError) throw subsError

      // Fetch all dealers
      const { data: dealersData, error: dealersError } = await supabase
        .from('dealers')
        .select('id, company_name, slug, status, user_id, vertical')

      if (dealersError) throw dealersError

      allDealers.value = (dealersData || []) as DealerInfo[]

      // Build user_id -> dealer map
      const dealersByUserId = new Map<string, DealerInfo>()
      for (const dealer of allDealers.value) {
        if (dealer.user_id) {
          dealersByUserId.set(dealer.user_id, dealer)
        }
      }

      // Join subscriptions with dealers
      subscriptions.value = (subsData || []).map((sub: SubscriptionRow) => ({
        ...sub,
        dealer: dealersByUserId.get(sub.user_id) || null,
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      error.value = t('admin.dealerSubscriptions.errorLoad') + ': ' + message
    } finally {
      loading.value = false
    }
  }

  // ---------- Actions ----------
  async function changePlan() {
    if (!changePlanModal.value.subscription) return
    saving.value = true
    error.value = null

    try {
      const sub = changePlanModal.value.subscription
      const newPlan = changePlanModal.value.newPlan

      // Enforce founding limit
      if (newPlan === 'founding') {
        const currentCount = foundingCountByVertical.value[sub.vertical] || 0
        const isSameSubAlreadyFounding = sub.plan === 'founding'
        if (!isSameSubAlreadyFounding && currentCount >= FOUNDING_MAX_PER_VERTICAL) {
          error.value = t('admin.dealerSubscriptions.foundingMax') + ` (${sub.vertical})`
          saving.value = false
          return
        }
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq('id', sub.id)

      if (updateError) throw updateError

      showSuccess(t('admin.dealerSubscriptions.successPlanChanged'))
      closeChangePlanModal()
      await fetchSubscriptions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      error.value = t('admin.dealerSubscriptions.errorUpdate') + ': ' + message
    } finally {
      saving.value = false
    }
  }

  async function cancelSubscription() {
    if (!cancelModal.value.subscription || !canCancel.value) return
    saving.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', cancelModal.value.subscription.id)

      if (updateError) throw updateError

      showSuccess(t('admin.dealerSubscriptions.successCanceled'))
      closeCancelModal()
      await fetchSubscriptions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      error.value = t('admin.dealerSubscriptions.errorCancel') + ': ' + message
    } finally {
      saving.value = false
    }
  }

  async function extendExpiry() {
    if (!extendModal.value.subscription) return
    saving.value = true
    error.value = null

    try {
      const sub = extendModal.value.subscription
      const currentExpiry = sub.expires_at ? new Date(sub.expires_at) : new Date()
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)

      if (updateError) throw updateError

      showSuccess(t('admin.dealerSubscriptions.successExtended'))
      closeExtendModal()
      await fetchSubscriptions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      error.value = t('admin.dealerSubscriptions.errorExtend') + ': ' + message
    } finally {
      saving.value = false
    }
  }

  async function createSubscription() {
    if (!newModal.value.selectedDealerId) {
      error.value = t('admin.dealerSubscriptions.noDealerSelected')
      return
    }

    saving.value = true
    error.value = null

    try {
      // Enforce founding limit
      if (newModal.value.selectedPlan === 'founding') {
        const currentCount = foundingCountByVertical.value[newModal.value.selectedVertical] || 0
        if (currentCount >= FOUNDING_MAX_PER_VERTICAL) {
          error.value =
            t('admin.dealerSubscriptions.foundingMax') + ` (${newModal.value.selectedVertical})`
          saving.value = false
          return
        }
      }

      const dealer = allDealers.value.find((d) => d.id === newModal.value.selectedDealerId)
      if (!dealer || !dealer.user_id) {
        error.value = t('admin.dealerSubscriptions.noDealerSelected')
        saving.value = false
        return
      }

      const { error: insertError } = await supabase.from('subscriptions').insert({
        user_id: dealer.user_id,
        vertical: newModal.value.selectedVertical,
        plan: newModal.value.selectedPlan,
        status: 'active',
        price_cents: newModal.value.priceCents,
        started_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      showSuccess(t('admin.dealerSubscriptions.successCreated'))
      closeNewModal()
      await fetchSubscriptions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      error.value = t('admin.dealerSubscriptions.errorCreate') + ': ' + message
    } finally {
      saving.value = false
    }
  }

  // ---------- Modal Controls ----------
  function openCancelModal(sub: DealerSubscription) {
    cancelModal.value = { show: true, subscription: sub, confirmText: '' }
  }

  function closeCancelModal() {
    cancelModal.value = { show: false, subscription: null, confirmText: '' }
  }

  function openNewModal() {
    newModal.value = {
      show: true,
      selectedDealerId: '',
      selectedPlan: 'basic',
      selectedVertical: getVerticalSlug(),
      priceCents: 0,
    }
  }

  function closeNewModal() {
    newModal.value = {
      show: false,
      selectedDealerId: '',
      selectedPlan: 'basic',
      selectedVertical: getVerticalSlug(),
      priceCents: 0,
    }
  }

  function openExtendModal(sub: DealerSubscription) {
    extendModal.value = { show: true, subscription: sub }
  }

  function closeExtendModal() {
    extendModal.value = { show: false, subscription: null }
  }

  function openChangePlanModal(sub: DealerSubscription) {
    changePlanModal.value = { show: true, subscription: sub, newPlan: sub.plan as PlanType }
  }

  function closeChangePlanModal() {
    changePlanModal.value = { show: false, subscription: null, newPlan: 'basic' }
  }

  // ---------- Helpers ----------
  function getPlanConfig(plan: string): { value: string; label: string; color: string } {
    return (PLANS.find((p) => p.value === plan) ?? PLANS[0]) as {
      value: string
      label: string
      color: string
    }
  }

  function getStatusConfig(status: string | null): { value: string; label: string; color: string } {
    return (STATUSES.find((s) => s.value === status) ?? STATUSES[0]) as {
      value: string
      label: string
      color: string
    }
  }

  function getDealerName(sub: DealerSubscription): string {
    if (!sub.dealer?.company_name) return '-'
    return localizedField(sub.dealer.company_name as Record<string, string>, locale.value) || '-'
  }

  function getDealerLabel(dealer: DealerInfo): string {
    const name = localizedField(dealer.company_name as Record<string, string>, locale.value)
    return name || dealer.slug || dealer.id
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  function showSuccess(message: string) {
    successMessage.value = message
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }

  return {
    // State
    subscriptions,
    allDealers,
    loading,
    saving,
    error,
    successMessage,
    searchQuery,
    filterPlan,
    filterStatus,
    cancelModal,
    newModal,
    extendModal,
    changePlanModal,

    // Computed
    canCancel,
    filteredSubscriptions,
    total,
    foundingCountByVertical,
    uniqueVerticals,
    availableDealersForNew,

    // Async actions
    fetchSubscriptions,
    changePlan,
    cancelSubscription,
    createSubscription,
    extendExpiry,

    // Modal controls
    openCancelModal,
    closeCancelModal,
    openNewModal,
    closeNewModal,
    openExtendModal,
    closeExtendModal,
    openChangePlanModal,
    closeChangePlanModal,

    // Helpers
    getPlanConfig,
    getStatusConfig,
    getDealerName,
    getDealerLabel,
    formatDate,
    isExpired,
    showSuccess,
  }
}
