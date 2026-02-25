<script setup lang="ts">
/**
 * Admin page: Dealer Subscriptions Management
 *
 * i18n keys to add to es.json / en.json under "admin.dealerSubscriptions":
 *   title, totalRecords, addSubscription, search, filterAll, filterPlan, filterStatus,
 *   loading, errorLoad, noResults,
 *   colDealer, colPlan, colStatus, colStarted, colExpires, colPrice, colActions,
 *   planFree, planBasic, planPremium, planFounding,
 *   statusActive, statusCanceled, statusPastDue, statusTrialing,
 *   foundingCount, foundingMax, perVertical,
 *   changePlan, cancelSubscription, extendExpiry, extend30Days,
 *   confirmCancel, confirmCancelText, confirmCancelWarning, typeCancel,
 *   cancelBtn, confirmBtn, closeBtn, saveBtn, saving,
 *   modalNewTitle, selectDealer, selectPlan, selectVertical, priceCents,
 *   createBtn, creating,
 *   extendTitle, extendText, extending,
 *   changePlanTitle, changePlanText,
 *   successCreated, successPlanChanged, successCanceled, successExtended,
 *   errorCreate, errorUpdate, errorCancel, errorExtend,
 *   noDealerSelected, vertical
 */

import { localizedField } from '~/composables/useLocalized'
import { formatPriceCents } from '~/composables/shared/useListingUtils'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()

// ---------- Types ----------
interface DealerInfo {
  id: string
  company_name: Record<string, string> | null
  slug: string
  status: string | null
  user_id: string | null
  vertical: string
}

interface SubscriptionRow {
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

interface DealerSubscription extends SubscriptionRow {
  dealer: DealerInfo | null
}

type PlanType = 'free' | 'basic' | 'premium' | 'founding'
type StatusType = 'active' | 'canceled' | 'past_due' | 'trialing'

// ---------- Constants ----------
const PLANS: Array<{ value: PlanType; label: string; color: string }> = [
  { value: 'free', label: 'Free', color: '#6b7280' },
  { value: 'basic', label: 'Basic', color: '#3b82f6' },
  { value: 'premium', label: 'Premium', color: '#8b5cf6' },
  { value: 'founding', label: 'Founding', color: '#d97706' },
]

const STATUSES: Array<{ value: StatusType; label: string; color: string }> = [
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'canceled', label: 'Canceled', color: '#ef4444' },
  { value: 'past_due', label: 'Past Due', color: '#f59e0b' },
  { value: 'trialing', label: 'Trialing', color: '#6366f1' },
]

const FOUNDING_MAX_PER_VERTICAL = 10

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
const cancelModal = ref({
  show: false,
  subscription: null as DealerSubscription | null,
  confirmText: '',
})

const newModal = ref({
  show: false,
  selectedDealerId: '',
  selectedPlan: 'basic' as PlanType,
  selectedVertical: getVerticalSlug(),
  priceCents: 0,
})

const extendModal = ref({
  show: false,
  subscription: null as DealerSubscription | null,
})

const changePlanModal = ref({
  show: false,
  subscription: null as DealerSubscription | null,
  newPlan: 'basic' as PlanType,
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
function getPlanConfig(plan: string) {
  return PLANS.find((p) => p.value === plan) || PLANS[0]
}

function getStatusConfig(status: string | null) {
  return STATUSES.find((s) => s.value === status) || STATUSES[0]
}

function getDealerName(sub: DealerSubscription): string {
  if (!sub.dealer?.company_name) return '-'
  return localizedField(sub.dealer.company_name as Record<string, string>, locale.value) || '-'
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

function getDealerLabel(dealer: DealerInfo): string {
  const name = localizedField(dealer.company_name as Record<string, string>, locale.value)
  return name || dealer.slug || dealer.id
}

// ---------- Lifecycle ----------
onMounted(async () => {
  await fetchSubscriptions()
})
</script>

<template>
  <div class="admin-dealer-subs">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>{{ t('admin.dealerSubscriptions.title') }}</h2>
        <span class="total-badge"
          >{{ total }} {{ t('admin.dealerSubscriptions.totalRecords') }}</span
        >
      </div>
      <button class="btn-primary" @click="openNewModal">
        + {{ t('admin.dealerSubscriptions.addSubscription') }}
      </button>
    </div>

    <!-- Founding Counters -->
    <div v-if="Object.keys(foundingCountByVertical).length > 0" class="founding-stats">
      <div
        v-for="(count, vertical) in foundingCountByVertical"
        :key="vertical"
        class="founding-stat-card"
      >
        <span class="founding-label"
          >{{ t('admin.dealerSubscriptions.foundingCount') }} — {{ vertical }}</span
        >
        <span class="founding-value" :class="{ 'at-max': count >= FOUNDING_MAX_PER_VERTICAL }">
          {{ count }} / {{ FOUNDING_MAX_PER_VERTICAL }}
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <!-- Plan filter -->
      <div class="filter-group plan-filter">
        <button
          class="filter-btn"
          :class="{ active: filterPlan === null }"
          @click="filterPlan = null"
        >
          {{ t('admin.dealerSubscriptions.filterAll') }}
        </button>
        <button
          v-for="p in PLANS"
          :key="p.value"
          class="filter-btn"
          :class="{ active: filterPlan === p.value }"
          :style="filterPlan === p.value ? { backgroundColor: p.color, color: 'white' } : {}"
          @click="filterPlan = p.value"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Status filter -->
      <div class="filter-group status-filter">
        <button
          class="filter-btn"
          :class="{ active: filterStatus === null }"
          @click="filterStatus = null"
        >
          {{ t('admin.dealerSubscriptions.filterAll') }}
        </button>
        <button
          v-for="s in STATUSES"
          :key="s.value"
          class="filter-btn"
          :class="{ active: filterStatus === s.value }"
          :style="filterStatus === s.value ? { backgroundColor: s.color, color: 'white' } : {}"
          @click="filterStatus = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('admin.dealerSubscriptions.search')"
        class="filter-search"
      >
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <button class="error-dismiss" @click="error = null">x</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      {{ t('admin.dealerSubscriptions.loading') }}
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.dealerSubscriptions.colDealer') }}</th>
            <th style="width: 100px">
              {{ t('admin.dealerSubscriptions.colPlan') }}
            </th>
            <th style="width: 100px">
              {{ t('admin.dealerSubscriptions.colStatus') }}
            </th>
            <th style="width: 80px">
              {{ t('admin.dealerSubscriptions.vertical') }}
            </th>
            <th style="width: 100px">
              {{ t('admin.dealerSubscriptions.colStarted') }}
            </th>
            <th style="width: 100px">
              {{ t('admin.dealerSubscriptions.colExpires') }}
            </th>
            <th style="width: 90px">
              {{ t('admin.dealerSubscriptions.colPrice') }}
            </th>
            <th style="width: 160px">
              {{ t('admin.dealerSubscriptions.colActions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sub in filteredSubscriptions"
            :key="sub.id"
            :class="{
              'row-canceled': sub.status === 'canceled',
              'row-expired': isExpired(sub.expires_at) && sub.status === 'active',
            }"
          >
            <td>
              <div class="dealer-info">
                <strong>{{ getDealerName(sub) }}</strong>
                <span v-if="sub.dealer?.slug" class="dealer-slug">/{{ sub.dealer.slug }}</span>
              </div>
            </td>
            <td>
              <span
                class="plan-badge"
                :style="{
                  backgroundColor: getPlanConfig(sub.plan).color + '18',
                  color: getPlanConfig(sub.plan).color,
                  borderColor: getPlanConfig(sub.plan).color + '40',
                }"
              >
                {{ getPlanConfig(sub.plan).label }}
              </span>
            </td>
            <td>
              <span
                class="status-badge"
                :style="{
                  backgroundColor: getStatusConfig(sub.status).color + '18',
                  color: getStatusConfig(sub.status).color,
                  borderColor: getStatusConfig(sub.status).color + '40',
                }"
              >
                {{ getStatusConfig(sub.status).label }}
              </span>
            </td>
            <td>
              <span class="vertical-badge">{{ sub.vertical }}</span>
            </td>
            <td>{{ formatDate(sub.started_at) }}</td>
            <td :class="{ 'text-expired': isExpired(sub.expires_at) }">
              {{ formatDate(sub.expires_at) }}
            </td>
            <td class="text-right">
              {{ formatPriceCents(sub.price_cents) }}
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn-icon btn-edit"
                  :title="t('admin.dealerSubscriptions.changePlan')"
                  @click="openChangePlanModal(sub)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  class="btn-icon btn-extend"
                  :title="t('admin.dealerSubscriptions.extend30Days')"
                  @click="openExtendModal(sub)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </button>
                <button
                  v-if="sub.status !== 'canceled'"
                  class="btn-icon btn-cancel"
                  :title="t('admin.dealerSubscriptions.cancelSubscription')"
                  @click="openCancelModal(sub)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredSubscriptions.length && !loading">
            <td colspan="8" class="empty-state">
              {{ t('admin.dealerSubscriptions.noResults') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Change Plan Modal -->
    <Teleport to="body">
      <div v-if="changePlanModal.show" class="modal-overlay" @click.self="closeChangePlanModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>{{ t('admin.dealerSubscriptions.changePlanTitle') }}</h3>
            <button class="modal-close" @click="closeChangePlanModal">x</button>
          </div>
          <div class="modal-body">
            <p class="modal-description">
              {{ t('admin.dealerSubscriptions.changePlanText') }}
              <strong>{{ getDealerName(changePlanModal.subscription!) }}</strong>
            </p>
            <div class="form-group">
              <label for="change-plan-select">{{
                t('admin.dealerSubscriptions.selectPlan')
              }}</label>
              <select id="change-plan-select" v-model="changePlanModal.newPlan" class="form-select">
                <option v-for="p in PLANS" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </select>
              <p v-if="changePlanModal.newPlan === 'founding'" class="founding-warning">
                {{ t('admin.dealerSubscriptions.foundingCount') }}:
                {{
                  foundingCountByVertical[
                    changePlanModal.subscription?.vertical || getVerticalSlug()
                  ] || 0
                }}
                / {{ FOUNDING_MAX_PER_VERTICAL }}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeChangePlanModal">
              {{ t('admin.dealerSubscriptions.cancelBtn') }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving || changePlanModal.newPlan === changePlanModal.subscription?.plan"
              @click="changePlan"
            >
              {{
                saving
                  ? t('admin.dealerSubscriptions.saving')
                  : t('admin.dealerSubscriptions.saveBtn')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Extend Expiry Modal -->
    <Teleport to="body">
      <div v-if="extendModal.show" class="modal-overlay" @click.self="closeExtendModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>{{ t('admin.dealerSubscriptions.extendTitle') }}</h3>
            <button class="modal-close" @click="closeExtendModal">x</button>
          </div>
          <div class="modal-body">
            <p class="modal-description">
              {{ t('admin.dealerSubscriptions.extendText') }}
              <strong>{{ getDealerName(extendModal.subscription!) }}</strong>
            </p>
            <div class="extend-info">
              <div class="extend-row">
                <span class="extend-label">{{ t('admin.dealerSubscriptions.colExpires') }}:</span>
                <span class="extend-value">{{
                  formatDate(extendModal.subscription?.expires_at ?? null)
                }}</span>
              </div>
              <div class="extend-row">
                <span class="extend-label">{{ t('admin.dealerSubscriptions.extend30Days') }}:</span>
                <span class="extend-value extend-new">
                  {{
                    formatDate(
                      new Date(
                        (extendModal.subscription?.expires_at
                          ? new Date(extendModal.subscription.expires_at).getTime()
                          : Date.now()) +
                          30 * 24 * 60 * 60 * 1000,
                      ).toISOString(),
                    )
                  }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeExtendModal">
              {{ t('admin.dealerSubscriptions.cancelBtn') }}
            </button>
            <button class="btn-primary" :disabled="saving" @click="extendExpiry">
              {{
                saving
                  ? t('admin.dealerSubscriptions.extending')
                  : t('admin.dealerSubscriptions.extend30Days')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel Subscription Modal -->
    <Teleport to="body">
      <div v-if="cancelModal.show" class="modal-overlay" @click.self="closeCancelModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>{{ t('admin.dealerSubscriptions.confirmCancel') }}</h3>
            <button class="modal-close" @click="closeCancelModal">x</button>
          </div>
          <div class="modal-body">
            <p>
              {{ t('admin.dealerSubscriptions.confirmCancelText') }}
              <strong>{{ getDealerName(cancelModal.subscription!) }}</strong
              >?
            </p>
            <p class="text-warning">
              {{ t('admin.dealerSubscriptions.confirmCancelWarning') }}
            </p>
            <div class="form-group delete-confirm-group">
              <label for="cancel-confirm">
                {{ t('admin.dealerSubscriptions.typeCancel') }}
              </label>
              <input
                id="cancel-confirm"
                v-model="cancelModal.confirmText"
                type="text"
                placeholder="cancelar"
                autocomplete="off"
              >
              <p v-if="cancelModal.confirmText && !canCancel" class="text-error">
                {{ t('admin.dealerSubscriptions.typeCancel') }}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeCancelModal">
              {{ t('admin.dealerSubscriptions.closeBtn') }}
            </button>
            <button class="btn-danger" :disabled="!canCancel || saving" @click="cancelSubscription">
              {{
                saving
                  ? t('admin.dealerSubscriptions.saving')
                  : t('admin.dealerSubscriptions.confirmBtn')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- New Subscription Modal -->
    <Teleport to="body">
      <div v-if="newModal.show" class="modal-overlay" @click.self="closeNewModal">
        <div class="modal-content modal-medium">
          <div class="modal-header">
            <h3>{{ t('admin.dealerSubscriptions.modalNewTitle') }}</h3>
            <button class="modal-close" @click="closeNewModal">x</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="new-dealer">{{ t('admin.dealerSubscriptions.selectDealer') }}</label>
              <select id="new-dealer" v-model="newModal.selectedDealerId" class="form-select">
                <option value="" disabled>
                  -- {{ t('admin.dealerSubscriptions.selectDealer') }} --
                </option>
                <option v-for="d in availableDealersForNew" :key="d.id" :value="d.id">
                  {{ getDealerLabel(d) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="new-vertical">{{ t('admin.dealerSubscriptions.selectVertical') }}</label>
              <select id="new-vertical" v-model="newModal.selectedVertical" class="form-select">
                <option v-for="v in uniqueVerticals" :key="v" :value="v">
                  {{ v }}
                </option>
                <option v-if="!uniqueVerticals.includes('tracciona')" value="tracciona">
                  tracciona
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="new-plan">{{ t('admin.dealerSubscriptions.selectPlan') }}</label>
              <select id="new-plan" v-model="newModal.selectedPlan" class="form-select">
                <option v-for="p in PLANS" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </select>
              <p v-if="newModal.selectedPlan === 'founding'" class="founding-warning">
                {{ t('admin.dealerSubscriptions.foundingCount') }}:
                {{ foundingCountByVertical[newModal.selectedVertical] || 0 }}
                / {{ FOUNDING_MAX_PER_VERTICAL }}
              </p>
            </div>

            <div class="form-group">
              <label for="new-price">{{ t('admin.dealerSubscriptions.priceCents') }}</label>
              <input
                id="new-price"
                v-model.number="newModal.priceCents"
                type="number"
                min="0"
                step="100"
                class="form-input"
              >
              <span class="price-preview">= {{ formatPriceCents(newModal.priceCents) }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeNewModal">
              {{ t('admin.dealerSubscriptions.cancelBtn') }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving || !newModal.selectedDealerId"
              @click="createSubscription"
            >
              {{
                saving
                  ? t('admin.dealerSubscriptions.creating')
                  : t('admin.dealerSubscriptions.createBtn')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-dealer-subs {
  padding: 0;
}

/* ---- Header ---- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3, 12px);
  margin-bottom: var(--spacing-5, 20px);
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-secondary, #f3f4f6);
  padding: var(--spacing-4, 16px) 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 12px);
}

.section-header h2 {
  margin: 0;
  font-size: var(--font-size-2xl, 1.5rem);
  color: var(--text-primary, #1f2a2a);
}

.total-badge {
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-500, #6b7280);
  padding: 6px 12px;
  border-radius: var(--border-radius-lg, 16px);
  font-size: var(--font-size-sm, 0.85rem);
}

/* ---- Founding Stats ---- */
.founding-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3, 12px);
  margin-bottom: var(--spacing-5, 20px);
}

.founding-stat-card {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 12px);
  border-left: 4px solid var(--color-gold, #d4a017);
}

.founding-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #4a5a5a);
  font-weight: var(--font-weight-medium, 500);
}

.founding-value {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-gold, #d4a017);
}

.founding-value.at-max {
  color: var(--color-error, #ef4444);
}

/* ---- Filters ---- */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3, 12px);
  margin-bottom: var(--spacing-5, 20px);
  padding: var(--spacing-4, 16px);
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
}

.filter-group {
  display: flex;
  gap: 0;
}

.plan-filter,
.status-filter {
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
}

.filter-btn {
  padding: 8px 12px;
  border: none;
  background: var(--bg-primary, white);
  cursor: pointer;
  font-size: var(--font-size-xs, 0.8rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-500, #6b7280);
  transition: all var(--transition-fast, 150ms ease);
  min-height: 44px;
  min-width: 44px;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid var(--border-color-light, #e5e7eb);
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: var(--color-white, white);
}

.filter-btn:hover:not(.active) {
  background: var(--color-gray-100, #f3f4f6);
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.875rem);
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* ---- Banners ---- */
.success-banner {
  background: #ecfdf5;
  color: var(--color-success, #10b981);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  border-radius: var(--border-radius, 8px);
  margin-bottom: var(--spacing-4, 16px);
  font-weight: var(--font-weight-medium, 500);
}

.error-banner {
  background: #fef2f2;
  color: var(--color-error, #dc2626);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  border-radius: var(--border-radius, 8px);
  margin-bottom: var(--spacing-4, 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-dismiss {
  background: none;
  border: none;
  color: var(--color-error, #dc2626);
  font-size: var(--font-size-lg, 1.125rem);
  cursor: pointer;
  padding: 4px 8px;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10, 40px);
  color: var(--color-gray-500, #6b7280);
}

/* ---- Table ---- */
.table-container {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.admin-table th,
.admin-table td {
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  text-align: left;
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
}

.admin-table th {
  background: var(--color-gray-50, #f9fafb);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-gray-700, #374151);
  font-size: var(--font-size-sm, 0.875rem);
  white-space: nowrap;
}

.admin-table tr:hover {
  background: var(--color-gray-50, #f9fafb);
}

.admin-table tr.row-canceled {
  opacity: 0.6;
}

.admin-table tr.row-expired {
  background: #fffbeb;
}

.admin-table tr.row-expired:hover {
  background: #fef3c7;
}

/* ---- Dealer Info ---- */
.dealer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dealer-info strong {
  font-size: var(--font-size-sm, 0.95rem);
  color: var(--text-primary, #1f2a2a);
}

.dealer-slug {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-gray-400, #9ca3af);
}

/* ---- Badges ---- */
.plan-badge,
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--border-radius-lg, 12px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  border: 1px solid;
  white-space: nowrap;
}

.vertical-badge {
  display: inline-block;
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-600, #4b5563);
  padding: 3px 8px;
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
}

.text-right {
  text-align: right;
}

.text-expired {
  color: var(--color-error, #ef4444);
  font-weight: var(--font-weight-semibold, 600);
}

/* ---- Action Buttons ---- */
.action-buttons {
  display: flex;
  gap: 6px;
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light, #e5e7eb);
  padding: 6px 8px;
  border-radius: var(--border-radius-sm, 4px);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-fast, 150ms ease);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  color: var(--color-gray-500, #6b7280);
}

.btn-icon:hover {
  background: var(--color-gray-100, #f3f4f6);
}

.btn-edit:hover {
  background: #dbeafe;
  color: var(--color-info, #3b82f6);
  border-color: var(--color-info, #3b82f6);
}

.btn-extend:hover {
  background: #ecfdf5;
  color: var(--color-success, #10b981);
  border-color: var(--color-success, #10b981);
}

.btn-cancel:hover {
  background: #fef2f2;
  color: var(--color-error, #ef4444);
  border-color: var(--color-error, #ef4444);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-10, 40px);
  color: var(--color-gray-500, #6b7280);
}

/* ---- Buttons ---- */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: var(--color-white, white);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-gray-200, #e5e7eb);
  color: var(--color-gray-700, #374151);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-danger {
  background: var(--color-error, #dc2626);
  color: var(--color-white, white);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Modal ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 500);
  padding: var(--spacing-5, 20px);
}

.modal-content {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius-md, 12px);
  width: 100%;
  box-shadow: var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 440px;
}

.modal-medium {
  max-width: 560px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5, 20px) var(--spacing-6, 24px);
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
  position: sticky;
  top: 0;
  background: var(--bg-primary, white);
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-xl, 1.25rem);
  color: var(--text-primary, #1f2a2a);
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-gray-500, #6b7280);
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm, 4px);
}

.modal-close:hover {
  background: var(--color-gray-100, #f3f4f6);
}

.modal-body {
  padding: var(--spacing-6, 24px);
}

.modal-description {
  margin: 0 0 var(--spacing-4, 16px) 0;
  color: var(--text-secondary, #4a5a5a);
  line-height: var(--line-height-relaxed, 1.625);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3, 12px);
  padding: var(--spacing-4, 16px) var(--spacing-6, 24px);
  border-top: 1px solid var(--border-color-light, #e5e7eb);
  background: var(--color-gray-50, #f9fafb);
  position: sticky;
  bottom: 0;
}

/* ---- Forms ---- */
.form-group {
  margin-bottom: var(--spacing-4, 16px);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: var(--font-weight-medium, 500);
  margin-bottom: 6px;
  color: var(--color-gray-700, #374151);
  font-size: var(--font-size-sm, 0.875rem);
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.95rem);
  min-height: 44px;
  background: var(--bg-primary, white);
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.price-preview {
  display: inline-block;
  margin-top: 4px;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-500, #6b7280);
}

.founding-warning {
  margin-top: 6px;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gold, #d4a017);
  font-weight: var(--font-weight-medium, 500);
}

/* ---- Extend Info ---- */
.extend-info {
  background: var(--color-gray-50, #f9fafb);
  border-radius: var(--border-radius, 8px);
  padding: var(--spacing-4, 16px);
  margin-top: var(--spacing-4, 16px);
}

.extend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.extend-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
}

.extend-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-500, #6b7280);
}

.extend-value {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
}

.extend-new {
  color: var(--color-success, #10b981);
}

/* ---- Delete / Cancel Confirmation ---- */
.delete-confirm-group {
  margin-top: var(--spacing-4, 16px);
  padding-top: var(--spacing-4, 16px);
  border-top: 1px solid var(--border-color-light, #e5e7eb);
}

.delete-confirm-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.95rem);
  min-height: 44px;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: var(--color-error, #dc2626);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.text-warning {
  color: var(--color-warning, #d97706);
  font-size: var(--font-size-sm, 0.85rem);
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: var(--border-radius-sm, 6px);
  margin-top: 8px;
}

.text-error {
  color: var(--color-error, #dc2626);
  font-size: var(--font-size-xs, 0.75rem);
  margin-top: 4px;
}

/* ---- Mobile Responsive ---- */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-3, 12px);
    align-items: stretch;
    position: static;
    padding: 0;
    margin-bottom: var(--spacing-4, 16px);
  }

  .header-left {
    justify-content: space-between;
  }

  .btn-primary {
    text-align: center;
  }

  .founding-stats {
    flex-direction: column;
  }

  .filters-bar {
    flex-direction: column;
  }

  .plan-filter,
  .status-filter {
    overflow-x: auto;
    width: 100%;
  }

  .filter-btn {
    white-space: nowrap;
  }

  .filter-search {
    min-width: 0;
    width: 100%;
  }

  .modal-content {
    margin: var(--spacing-3, 12px);
  }

  .modal-body {
    padding: var(--spacing-4, 16px);
  }

  .modal-header {
    padding: var(--spacing-4, 16px);
  }

  .modal-footer {
    padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
    flex-direction: column;
  }

  .modal-footer .btn-secondary,
  .modal-footer .btn-primary,
  .modal-footer .btn-danger {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .section-header h2 {
    font-size: var(--font-size-xl, 1.25rem);
  }

  .founding-stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
