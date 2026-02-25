<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { t } = useI18n()
const supabase = useSupabaseClient()

interface InvoiceRow {
  id: string
  dealer_id: string | null
  service_type: string
  amount_cents: number
  tax_cents: number
  currency: string
  status: string
  created_at: string
}

const invoices = ref<InvoiceRow[]>([])
const loading = ref(true)
const selectedPeriod = ref('this_month')

const periods = [
  { value: 'this_month', label: () => t('billing.thisMonth') },
  { value: 'last_month', label: () => t('billing.lastMonth') },
  { value: 'last_3_months', label: () => t('billing.last3Months') },
  { value: 'this_year', label: () => t('billing.thisYear') },
  { value: 'all', label: () => t('billing.allTime') },
]

function getDateRange(period: string): { from: string; to: string } {
  const now = new Date()
  let from: Date, to: Date

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

async function loadInvoices() {
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
  invoices.value.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.tax_cents || 0), 0),
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

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(d: string): string {
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

function getServiceTypeLabel(type: string): string {
  return serviceTypeLabels[type] || type
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    paid: 'status-paid',
    pending: 'status-pending',
    failed: 'status-failed',
    refunded: 'status-refunded',
  }
  return classes[status] || ''
}

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

function exportCsv() {
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

// Revenue metrics
const { channelRevenue, mrr, arr, leadMetrics, loadAll: loadRevenueMetrics } = useRevenueMetrics()

async function loadAllData() {
  const range = getDateRange(selectedPeriod.value)
  await Promise.all([loadInvoices(), loadRevenueMetrics(range.from, range.to)])
}

onMounted(loadAllData)
watch(selectedPeriod, loadAllData)
</script>

<template>
  <div class="billing-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>{{ t('billing.title') }}</h1>
      </div>
      <button class="btn-export" @click="exportCsv">
        {{ t('billing.exportCsv') }}
      </button>
    </header>

    <!-- Period filter tabs -->
    <div class="period-tabs">
      <button
        v-for="p in periods"
        :key="p.value"
        class="period-tab"
        :class="{ active: selectedPeriod === p.value }"
        @click="selectedPeriod = p.value"
      >
        {{ p.label() }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('billing.title') }}...</span>
    </div>

    <template v-else>
      <!-- Stats cards -->
      <div class="stats-row">
        <div class="stat-card stat-revenue">
          <span class="stat-label">{{ t('billing.totalRevenue') }}</span>
          <span class="stat-value">{{ formatAmount(totalRevenue) }}</span>
        </div>
        <div class="stat-card stat-tax">
          <span class="stat-label">{{ t('billing.totalTax') }}</span>
          <span class="stat-value">{{ formatAmount(totalTax) }}</span>
        </div>
        <div class="stat-card stat-paid">
          <span class="stat-label">{{ t('billing.paidInvoices') }}</span>
          <span class="stat-value">{{ paidCount }}</span>
        </div>
        <div class="stat-card stat-pending">
          <span class="stat-label">{{ t('billing.pendingInvoices') }}</span>
          <span class="stat-value">{{ pendingCount }}</span>
        </div>
        <div class="stat-card stat-failed">
          <span class="stat-label">{{ t('billing.failedInvoices') }}</span>
          <span class="stat-value">{{ failedCount }}</span>
        </div>
      </div>

      <!-- MRR / ARR / Lead Value -->
      <div class="stats-row stats-row--secondary">
        <div class="stat-card stat-mrr">
          <span class="stat-label">MRR</span>
          <span class="stat-value">{{ formatAmount(mrr) }}</span>
        </div>
        <div class="stat-card stat-arr">
          <span class="stat-label">ARR</span>
          <span class="stat-value">{{ formatAmount(arr) }}</span>
        </div>
        <div class="stat-card stat-leads">
          <span class="stat-label">{{ t('billing.leadsThisMonth') }}</span>
          <span class="stat-value">{{ leadMetrics.totalLeads }}</span>
        </div>
        <div class="stat-card stat-lead-value">
          <span class="stat-label">{{ t('billing.leadValueGenerated') }}</span>
          <span class="stat-value">{{ formatAmount(leadMetrics.totalValue * 100) }}</span>
        </div>
      </div>

      <!-- Revenue by Channel (from payments) -->
      <div v-if="channelRevenue.some((c) => c.amount > 0)" class="section-card">
        <h2 class="section-title">{{ t('billing.revenueByChannel') }}</h2>
        <div class="type-list">
          <div v-for="ch in channelRevenue" :key="ch.key" class="type-row">
            <div class="type-info">
              <span class="type-label">{{ ch.label }}</span>
              <span class="type-amount">{{ formatAmount(ch.amount) }}</span>
            </div>
            <div class="type-bar-bg">
              <div class="type-bar-fill" :style="{ width: `${ch.percentage}%` }" />
            </div>
            <span class="type-pct">{{ ch.percentage.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Revenue by Type (from invoices) -->
      <div v-if="revenueByType.length > 0" class="section-card">
        <h2 class="section-title">{{ t('billing.byType') }}</h2>
        <div class="type-list">
          <div v-for="[type, amount] in revenueByType" :key="type" class="type-row">
            <div class="type-info">
              <span class="type-label">{{ getServiceTypeLabel(type) }}</span>
              <span class="type-amount">{{ formatAmount(amount) }}</span>
            </div>
            <div class="type-bar-bg">
              <div class="type-bar-fill" :style="{ width: `${getRevenuePercentage(amount)}%` }" />
            </div>
            <span class="type-pct">{{ getRevenuePercentage(amount).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Recent invoices -->
      <div class="section-card">
        <h2 class="section-title">{{ t('billing.recentInvoices') }}</h2>

        <!-- Empty state -->
        <div v-if="invoices.length === 0" class="empty-state">
          <p>{{ t('billing.noInvoices') }}</p>
        </div>

        <!-- Invoice cards (mobile) / table (desktop) -->
        <div v-else class="invoices-list">
          <div v-for="inv in invoices" :key="inv.id" class="invoice-card">
            <div class="invoice-top">
              <span class="invoice-date">{{ formatDate(inv.created_at) }}</span>
              <span class="invoice-status" :class="getStatusClass(inv.status)">
                {{ getStatusLabel(inv.status) }}
              </span>
            </div>
            <div class="invoice-middle">
              <span class="invoice-type-badge">{{ getServiceTypeLabel(inv.service_type) }}</span>
            </div>
            <div class="invoice-bottom">
              <div class="invoice-amounts">
                <span class="invoice-amount">{{ formatAmount(inv.amount_cents) }}</span>
                <span class="invoice-tax"
                  >{{ t('billing.totalTax') }}: {{ formatAmount(inv.tax_cents) }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.billing-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4, 16px);
  min-height: 100%;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 12px);
  align-items: stretch;
}

.header-left h1 {
  margin: 0;
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1e293b);
}

.btn-export {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border: none;
  border-radius: var(--border-radius, 8px);
  font-weight: var(--font-weight-medium, 500);
  font-size: var(--font-size-sm, 0.875rem);
  cursor: pointer;
  transition: background var(--transition-fast, 150ms ease);
  min-height: 44px;
}

.btn-export:hover {
  background: var(--color-primary-dark, #1a3238);
}

/* ============================================
   PERIOD TABS
   ============================================ */
.period-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

.period-tab {
  padding: var(--spacing-2, 8px) var(--spacing-4, 16px);
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius-full, 9999px);
  background: var(--bg-primary, #fff);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-secondary, #4a5a5a);
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
  min-height: 44px;
}

.period-tab:hover:not(.active) {
  background: var(--color-gray-50, #f9fafb);
  border-color: var(--border-color, #d1d5db);
}

.period-tab.active {
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border-color: var(--color-primary, #23424a);
}

/* ============================================
   LOADING
   ============================================ */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3, 12px);
  padding: 60px 20px;
  color: var(--text-auxiliary, #7a8a8a);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200, #e5e7eb);
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   STATS CARDS
   ============================================ */
.stats-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3, 12px);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1, 4px);
  padding: var(--spacing-4, 16px) var(--spacing-5, 20px);
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  border-left: 4px solid transparent;
}

.stat-card.stat-revenue {
  border-left-color: var(--color-primary, #23424a);
}

.stat-card.stat-tax {
  border-left-color: var(--color-info, #3b82f6);
}

.stat-card.stat-paid {
  border-left-color: var(--color-success, #10b981);
}

.stat-card.stat-pending {
  border-left-color: var(--color-warning, #f59e0b);
}

.stat-card.stat-failed {
  border-left-color: var(--color-error, #ef4444);
}

.stat-card.stat-mrr {
  border-left-color: var(--color-primary, #23424a);
}

.stat-card.stat-arr {
  border-left-color: var(--color-info, #3b82f6);
}

.stat-card.stat-leads {
  border-left-color: var(--color-success, #10b981);
}

.stat-card.stat-lead-value {
  border-left-color: var(--color-warning, #f59e0b);
}

.stats-row--secondary {
  margin-top: var(--spacing-2, 8px);
}

.stat-label {
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-auxiliary, #7a8a8a);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary, #1f2a2a);
  font-variant-numeric: tabular-nums;
}

/* ============================================
   SECTION CARD
   ============================================ */
.section-card {
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  padding: var(--spacing-4, 16px) var(--spacing-5, 20px);
}

.section-title {
  margin: 0 0 var(--spacing-4, 16px) 0;
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
}

/* ============================================
   REVENUE BY TYPE
   ============================================ */
.type-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4, 16px);
}

.type-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 8px);
}

.type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-label {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #1f2a2a);
}

.type-amount {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
  font-variant-numeric: tabular-nums;
}

.type-bar-bg {
  width: 100%;
  height: 8px;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: var(--border-radius-full, 9999px);
  overflow: hidden;
}

.type-bar-fill {
  height: 100%;
  background: var(--color-primary, #23424a);
  border-radius: var(--border-radius-full, 9999px);
  transition: width var(--transition-normal, 300ms ease);
  min-width: 4px;
}

.type-pct {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--text-auxiliary, #7a8a8a);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* ============================================
   INVOICES LIST (Card-based on mobile)
   ============================================ */
.invoices-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 12px);
}

.invoice-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-4, 16px);
  background: var(--color-gray-50, #f9fafb);
  border-radius: var(--border-radius, 8px);
  border: 1px solid var(--border-color-light, #e5e7eb);
  transition: border-color var(--transition-fast, 150ms ease);
}

.invoice-card:hover {
  border-color: var(--border-color, #d1d5db);
}

.invoice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invoice-date {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, #7a8a8a);
  font-variant-numeric: tabular-nums;
}

.invoice-status {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--border-radius-full, 9999px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  min-height: auto;
  min-width: auto;
}

.invoice-status.status-paid {
  background: #dcfce7;
  color: #15803d;
}

.invoice-status.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.invoice-status.status-failed {
  background: #fee2e2;
  color: #b91c1c;
}

.invoice-status.status-refunded {
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-600, #4b5563);
}

.invoice-middle {
  display: flex;
  align-items: center;
}

.invoice-type-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--color-gray-200, #e5e7eb);
  color: var(--text-secondary, #4a5a5a);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
  min-height: auto;
  min-width: auto;
}

.invoice-bottom {
  display: flex;
  justify-content: flex-end;
}

.invoice-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.invoice-amount {
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary, #1f2a2a);
  font-variant-numeric: tabular-nums;
}

.invoice-tax {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--text-auxiliary, #7a8a8a);
  font-variant-numeric: tabular-nums;
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px var(--spacing-4, 16px);
  text-align: center;
}

.empty-state p {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, #7a8a8a);
  margin: 0;
}

/* ============================================
   RESPONSIVE — Mobile-first breakpoints
   ============================================ */

/* 480px: 2-column stats */
@media (min-width: 480px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 768px: tablet layout */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-value {
    font-size: var(--font-size-2xl, 1.5rem);
  }

  .type-row {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-4, 16px);
  }

  .type-info {
    min-width: 240px;
    flex-shrink: 0;
  }

  .type-bar-bg {
    flex: 1;
  }

  .type-pct {
    min-width: 50px;
  }
}

/* 1024px: desktop — 5 stats in a row */
@media (min-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(5, 1fr);
  }

  .section-card {
    padding: var(--spacing-6, 24px) var(--spacing-8, 32px);
  }

  .period-tabs {
    padding: var(--spacing-4, 16px) var(--spacing-6, 24px);
  }
}

/* 1280px: large desktop refinements */
@media (min-width: 1280px) {
  .invoice-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4, 16px);
  }

  .invoice-top {
    flex: 0 0 auto;
    gap: var(--spacing-4, 16px);
    min-width: 200px;
  }

  .invoice-middle {
    flex: 1;
  }

  .invoice-bottom {
    flex: 0 0 auto;
  }

  .invoice-amounts {
    flex-direction: row;
    align-items: baseline;
    gap: var(--spacing-3, 12px);
  }
}
</style>
