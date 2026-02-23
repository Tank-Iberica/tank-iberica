<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()

// ============================================
// TYPES
// ============================================
interface Payment {
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

interface DealerStripeAccount {
  id: string
  dealer_id: string
  stripe_account_id: string
  onboarding_completed: boolean
  charges_enabled: boolean
  created_at: string
  dealers: { company_name: string } | null
}

type StatusFilter = 'all' | 'succeeded' | 'pending' | 'failed' | 'refunded'
type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'all_time'

const _PAYMENT_TYPES = [
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
// STATE
// ============================================
const payments = ref<Payment[]>([])
const stripeAccounts = ref<DealerStripeAccount[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<StatusFilter>('all')
const dateRange = ref<DateRange>('this_month')
const expandedId = ref<string | null>(null)

// ============================================
// COMPUTED
// ============================================
const dateFilter = computed(() => {
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

const filteredPayments = computed(() => {
  let result = payments.value

  // Date filter
  if (dateFilter.value) {
    result = result.filter((p) => p.created_at >= dateFilter.value!)
  }

  // Status filter
  if (activeTab.value !== 'all') {
    result = result.filter((p) => p.status === activeTab.value)
  }

  return result
})

const revenueStats = computed(() => {
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

const tabCounts = computed(() => ({
  all: filteredByDate.value.length,
  succeeded: filteredByDate.value.filter((p) => p.status === 'succeeded').length,
  pending: filteredByDate.value.filter((p) => p.status === 'pending').length,
  failed: filteredByDate.value.filter((p) => p.status === 'failed').length,
  refunded: filteredByDate.value.filter((p) => p.status === 'refunded').length,
}))

const filteredByDate = computed(() => {
  if (!dateFilter.value) return payments.value
  return payments.value.filter((p) => p.created_at >= dateFilter.value!)
})

// ============================================
// DATA LOADING
// ============================================
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

onMounted(() => {
  fetchPayments()
  fetchStripeAccounts()
})

// ============================================
// ACTIONS
// ============================================
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

// ============================================
// HELPERS
// ============================================
function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}...` : id
}

function getTypeBadgeClass(type: string): string {
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

function getTypeLabel(type: string): string {
  return t(`admin.pagos.type.${type}`)
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    succeeded: 'status-succeeded',
    pending: 'status-pending',
    failed: 'status-failed',
    refunded: 'status-refunded',
    cancelled: 'status-cancelled',
  }
  return map[status] || 'status-pending'
}

function getStatusLabel(status: string): string {
  return t(`admin.pagos.status.${status}`)
}

function getStripePaymentUrl(stripeId: string | null): string {
  if (!stripeId) return ''
  return `https://dashboard.stripe.com/payments/${stripeId}`
}

function getStripeAccountUrl(accountId: string): string {
  return `https://dashboard.stripe.com/connect/accounts/${accountId}`
}
</script>

<template>
  <div class="pagos-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('admin.pagos.title') }}</h1>
      <button class="btn-refresh" :disabled="loading" @click="fetchPayments">
        {{ t('admin.pagos.refresh') }}
      </button>
    </header>

    <!-- Revenue stats cards -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ formatCurrency(revenueStats.total) }}</span>
        <span class="stat-label">{{ t('admin.pagos.totalRevenue') }}</span>
      </div>
      <div class="stat-card stat-subscription">
        <span class="stat-value">{{ formatCurrency(revenueStats.subscription) }}</span>
        <span class="stat-label">{{ t('admin.pagos.subscriptionRevenue') }}</span>
      </div>
      <div class="stat-card stat-services">
        <span class="stat-value">{{ formatCurrency(revenueStats.services) }}</span>
        <span class="stat-label">{{ t('admin.pagos.servicesRevenue') }}</span>
      </div>
      <div class="stat-card stat-auction">
        <span class="stat-value">{{ formatCurrency(revenueStats.auction) }}</span>
        <span class="stat-label">{{ t('admin.pagos.auctionRevenue') }}</span>
      </div>
    </div>

    <!-- Date range filter -->
    <div class="date-range-row">
      <button
        v-for="range in ['this_month', 'last_month', 'last_3_months', 'all_time'] as DateRange[]"
        :key="range"
        class="date-btn"
        :class="{ active: dateRange === range }"
        @click="dateRange = range"
      >
        {{ t(`admin.pagos.range.${range}`) }}
      </button>
    </div>

    <!-- Tab filters -->
    <div class="tabs-row">
      <button
        v-for="tab in ['all', 'succeeded', 'pending', 'failed', 'refunded'] as StatusFilter[]"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ t(`admin.pagos.tab.${tab}`) }}
        <span class="tab-count">{{ tabCounts[tab] }}</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="dismiss-btn" @click="error = null">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredPayments.length === 0" class="empty-state">
      <p>{{ t('admin.pagos.noPayments') }}</p>
    </div>

    <!-- Desktop table -->
    <div v-else class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('admin.pagos.colId') }}</th>
            <th>{{ t('admin.pagos.colUser') }}</th>
            <th>{{ t('admin.pagos.colType') }}</th>
            <th>{{ t('admin.pagos.colAmount') }}</th>
            <th>{{ t('admin.pagos.colStatus') }}</th>
            <th>{{ t('admin.pagos.colStripeId') }}</th>
            <th>{{ t('admin.pagos.colDate') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="payment in filteredPayments" :key="payment.id">
            <tr
              class="table-row"
              :class="{ expanded: expandedId === payment.id }"
              @click="toggleExpand(payment.id)"
            >
              <td class="cell-id">{{ truncateId(payment.id) }}</td>
              <td class="cell-user">{{ truncateId(payment.user_id) }}</td>
              <td>
                <span class="type-badge" :class="getTypeBadgeClass(payment.type)">
                  {{ getTypeLabel(payment.type) }}
                </span>
              </td>
              <td class="cell-amount">{{ formatCurrency(payment.amount_cents) }}</td>
              <td>
                <span class="status-badge" :class="getStatusBadgeClass(payment.status)">
                  {{ getStatusLabel(payment.status) }}
                </span>
              </td>
              <td class="cell-stripe">
                <a
                  v-if="payment.stripe_payment_id"
                  :href="getStripePaymentUrl(payment.stripe_payment_id)"
                  target="_blank"
                  rel="noopener"
                  class="stripe-link"
                  @click.stop
                >
                  {{ truncateId(payment.stripe_payment_id) }}
                </a>
                <span v-else class="no-stripe">-</span>
              </td>
              <td>{{ formatDate(payment.created_at) }}</td>
            </tr>
            <!-- Expanded row -->
            <tr v-if="expandedId === payment.id" class="expanded-row">
              <td colspan="7">
                <div class="expanded-content">
                  <div v-if="payment.description" class="expanded-field">
                    <label>{{ t('admin.pagos.description') }}</label>
                    <span>{{ payment.description }}</span>
                  </div>
                  <div class="expanded-field">
                    <label>{{ t('admin.pagos.fullId') }}</label>
                    <span class="mono-text">{{ payment.id }}</span>
                  </div>
                  <div class="expanded-field">
                    <label>{{ t('admin.pagos.fullUserId') }}</label>
                    <span class="mono-text">{{ payment.user_id }}</span>
                  </div>
                  <div v-if="payment.stripe_payment_id" class="expanded-field">
                    <label>{{ t('admin.pagos.stripeLink') }}</label>
                    <a
                      :href="getStripePaymentUrl(payment.stripe_payment_id)"
                      target="_blank"
                      rel="noopener"
                      class="stripe-link"
                    >
                      {{ payment.stripe_payment_id }}
                    </a>
                  </div>
                  <div
                    v-if="payment.metadata && Object.keys(payment.metadata).length"
                    class="expanded-field metadata-field"
                  >
                    <label>{{ t('admin.pagos.metadata') }}</label>
                    <pre class="metadata-pre">{{ JSON.stringify(payment.metadata, null, 2) }}</pre>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Mobile card list -->
    <div v-if="!loading && filteredPayments.length > 0" class="card-list mobile-only">
      <div
        v-for="payment in filteredPayments"
        :key="payment.id"
        class="payment-card"
        :class="{ expanded: expandedId === payment.id }"
      >
        <button class="card-header" @click="toggleExpand(payment.id)">
          <div class="card-top">
            <span class="type-badge" :class="getTypeBadgeClass(payment.type)">
              {{ getTypeLabel(payment.type) }}
            </span>
            <span class="status-badge" :class="getStatusBadgeClass(payment.status)">
              {{ getStatusLabel(payment.status) }}
            </span>
          </div>
          <div class="card-details">
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.colAmount') }}</span>
              <span class="detail-value detail-amount">{{
                formatCurrency(payment.amount_cents)
              }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.colUser') }}</span>
              <span class="detail-value mono-text">{{ truncateId(payment.user_id) }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.colDate') }}</span>
              <span class="detail-value">{{ formatDate(payment.created_at) }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.colStripeId') }}</span>
              <span class="detail-value mono-text">{{
                payment.stripe_payment_id ? truncateId(payment.stripe_payment_id) : '-'
              }}</span>
            </div>
          </div>
          <div class="card-expand-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :class="{ rotated: expandedId === payment.id }"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        <!-- Expanded section -->
        <div v-if="expandedId === payment.id" class="card-expanded">
          <div v-if="payment.description" class="expanded-field">
            <label>{{ t('admin.pagos.description') }}</label>
            <span>{{ payment.description }}</span>
          </div>
          <div class="expanded-field">
            <label>{{ t('admin.pagos.fullId') }}</label>
            <span class="mono-text wrap-text">{{ payment.id }}</span>
          </div>
          <div class="expanded-field">
            <label>{{ t('admin.pagos.fullUserId') }}</label>
            <span class="mono-text wrap-text">{{ payment.user_id }}</span>
          </div>
          <div v-if="payment.stripe_payment_id" class="expanded-field">
            <label>{{ t('admin.pagos.stripeLink') }}</label>
            <a
              :href="getStripePaymentUrl(payment.stripe_payment_id)"
              target="_blank"
              rel="noopener"
              class="stripe-link"
            >
              {{ payment.stripe_payment_id }}
            </a>
          </div>
          <div
            v-if="payment.metadata && Object.keys(payment.metadata).length"
            class="expanded-field metadata-field"
          >
            <label>{{ t('admin.pagos.metadata') }}</label>
            <pre class="metadata-pre">{{ JSON.stringify(payment.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Stripe Connect Section -->
    <div v-if="stripeAccounts.length > 0" class="stripe-connect-section">
      <h2>{{ t('admin.pagos.stripeConnect') }}</h2>
      <p class="section-subtitle">{{ t('admin.pagos.stripeConnectSubtitle') }}</p>

      <!-- Desktop table -->
      <div class="table-wrapper desktop-only">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('admin.pagos.connectDealer') }}</th>
              <th>{{ t('admin.pagos.connectAccountId') }}</th>
              <th>{{ t('admin.pagos.connectOnboarding') }}</th>
              <th>{{ t('admin.pagos.connectCharges') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in stripeAccounts" :key="account.id">
              <td class="cell-dealer">{{ account.dealers?.company_name || '-' }}</td>
              <td>
                <a
                  :href="getStripeAccountUrl(account.stripe_account_id)"
                  target="_blank"
                  rel="noopener"
                  class="stripe-link"
                >
                  {{ truncateId(account.stripe_account_id) }}
                </a>
              </td>
              <td>
                <span
                  class="connect-status"
                  :class="account.onboarding_completed ? 'connect-ok' : 'connect-pending'"
                >
                  {{
                    account.onboarding_completed
                      ? t('admin.pagos.connectCompleted')
                      : t('admin.pagos.connectIncomplete')
                  }}
                </span>
              </td>
              <td>
                <span
                  class="connect-status"
                  :class="account.charges_enabled ? 'connect-ok' : 'connect-pending'"
                >
                  {{
                    account.charges_enabled
                      ? t('admin.pagos.connectEnabled')
                      : t('admin.pagos.connectDisabled')
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards for Stripe Connect -->
      <div class="card-list mobile-only">
        <div v-for="account in stripeAccounts" :key="account.id" class="connect-card">
          <div class="connect-card-name">{{ account.dealers?.company_name || '-' }}</div>
          <div class="card-details">
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.connectAccountId') }}</span>
              <a
                :href="getStripeAccountUrl(account.stripe_account_id)"
                target="_blank"
                rel="noopener"
                class="stripe-link"
              >
                {{ truncateId(account.stripe_account_id) }}
              </a>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.connectOnboarding') }}</span>
              <span
                class="connect-status"
                :class="account.onboarding_completed ? 'connect-ok' : 'connect-pending'"
              >
                {{
                  account.onboarding_completed
                    ? t('admin.pagos.connectCompleted')
                    : t('admin.pagos.connectIncomplete')
                }}
              </span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.pagos.connectCharges') }}</span>
              <span
                class="connect-status"
                :class="account.charges_enabled ? 'connect-ok' : 'connect-pending'"
              >
                {{
                  account.charges_enabled
                    ? t('admin.pagos.connectEnabled')
                    : t('admin.pagos.connectDisabled')
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.pagos-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.btn-refresh {
  align-self: flex-start;
  padding: 10px 18px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-refresh:hover {
  background: #1a3238;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   STATS CARDS
   ============================================ */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-card {
  flex: 1;
  min-width: 140px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.stat-card.stat-subscription .stat-value {
  color: #7c3aed;
}

.stat-card.stat-services .stat-value {
  color: #0891b2;
}

.stat-card.stat-auction .stat-value {
  color: #4f46e5;
}

/* ============================================
   DATE RANGE FILTER
   ============================================ */
.date-range-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.date-range-row::-webkit-scrollbar {
  display: none;
}

.date-btn {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
  flex-shrink: 0;
}

.date-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.date-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

/* ============================================
   TAB FILTERS
   ============================================ */
.tabs-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.tabs-row::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.tab-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.tab-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.tab-btn.active .tab-count {
  opacity: 0.9;
}

/* ============================================
   ALERTS & STATES
   ============================================ */
.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* ============================================
   TYPE BADGES
   ============================================ */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-badge.type-subscription {
  background: #ede9fe;
  color: #6d28d9;
}

.type-badge.type-auction-deposit {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-badge.type-auction-premium {
  background: #e0e7ff;
  color: #4338ca;
}

.type-badge.type-verification {
  background: #dcfce7;
  color: #16a34a;
}

.type-badge.type-transport {
  background: #cffafe;
  color: #0891b2;
}

.type-badge.type-transfer {
  background: #ccfbf1;
  color: #0d9488;
}

.type-badge.type-ad {
  background: #ffedd5;
  color: #c2410c;
}

.type-badge.type-one-time {
  background: #f3f4f6;
  color: #6b7280;
}

/* ============================================
   STATUS BADGES
   ============================================ */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-succeeded {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.status-refunded {
  background: #ede9fe;
  color: #7c3aed;
}

.status-badge.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

/* ============================================
   DESKTOP TABLE
   ============================================ */
.desktop-only {
  display: none;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row.expanded {
  background: #f1f5f9;
}

.cell-id,
.cell-user,
.cell-stripe {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}

.cell-amount {
  font-weight: 600;
  white-space: nowrap;
}

.cell-dealer {
  font-weight: 600;
}

.stripe-link {
  color: #635bff;
  text-decoration: none;
  font-family: monospace;
  font-size: 0.8rem;
}

.stripe-link:hover {
  text-decoration: underline;
}

.no-stripe {
  color: #94a3b8;
}

.mono-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}

.wrap-text {
  word-break: break-all;
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid #e2e8f0;
}

.expanded-content {
  padding: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  background: #f8fafc;
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.metadata-field {
  flex-basis: 100%;
}

.metadata-pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

/* ============================================
   MOBILE CARD LIST
   ============================================ */
.mobile-only {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-card,
.connect-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.payment-card:hover,
.connect-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.payment-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  min-height: 44px;
}

.card-header:hover {
  background: #f8fafc;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.detail-value {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 500;
}

.detail-amount {
  font-weight: 700;
  font-size: 0.95rem;
}

.card-expand-icon {
  display: flex;
  justify-content: center;
  color: #94a3b8;
}

.card-expand-icon svg {
  transition: transform 0.2s;
}

.card-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* Card expanded section */
.card-expanded {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

/* ============================================
   STRIPE CONNECT SECTION
   ============================================ */
.stripe-connect-section {
  margin-top: 16px;
}

.stripe-connect-section h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.section-subtitle {
  margin: 0 0 16px;
  color: #64748b;
  font-size: 0.875rem;
}

.connect-card {
  padding: 16px;
}

.connect-card-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
  margin-bottom: 8px;
}

.connect-status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.connect-status.connect-ok {
  background: #dcfce7;
  color: #16a34a;
}

.connect-status.connect-pending {
  background: #fef3c7;
  color: #92400e;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }
}

@media (min-width: 1024px) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
