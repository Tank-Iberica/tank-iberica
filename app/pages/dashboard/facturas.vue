<script setup lang="ts">
/**
 * Invoice History
 * Simple list of invoices/subscription payments.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()

interface Invoice {
  id: string
  plan: string
  amount_cents: number
  status: string
  created_at: string
}

const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadInvoices(): Promise<void> {
  if (!userId.value) return

  loading.value = true
  error.value = null

  try {
    // Try to fetch from subscriptions as invoices proxy
    const { data, error: err } = await supabase
      .from('subscriptions')
      .select('id, plan, price_cents, status, created_at')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })

    if (err) throw err

    invoices.value = (
      (data || []) as Array<{
        id: string
        plan: string
        price_cents: number | null
        status: string
        created_at: string
      }>
    ).map((row) => ({
      id: row.id,
      plan: row.plan,
      amount_cents: row.price_cents || 0,
      status: row.status || 'unknown',
      created_at: row.created_at,
    }))
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading invoices'
  } finally {
    loading.value = false
  }
}

onMounted(loadInvoices)

function formatAmount(cents: number): string {
  if (!cents) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    active: 'status-active',
    cancelled: 'status-cancelled',
    expired: 'status-expired',
  }
  return map[status] || ''
}
</script>

<template>
  <div class="invoices-page">
    <header class="page-header">
      <h1>{{ t('dashboard.invoices.title') }}</h1>
    </header>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <div v-else-if="invoices.length === 0" class="empty-state">
      <p>{{ t('dashboard.invoices.empty') }}</p>
      <span>{{ t('dashboard.invoices.emptyDesc') }}</span>
    </div>

    <div v-else class="invoices-list">
      <div v-for="invoice in invoices" :key="invoice.id" class="invoice-card">
        <div class="invoice-top">
          <span class="invoice-plan">{{ t(`dashboard.plans.${invoice.plan}`) }}</span>
          <span class="invoice-amount">{{ formatAmount(invoice.amount_cents) }}</span>
        </div>
        <div class="invoice-bottom">
          <span class="invoice-date">{{ formatDate(invoice.created_at) }}</span>
          <span class="invoice-status" :class="getStatusClass(invoice.status)">
            {{ t(`dashboard.invoices.status.${invoice.status}`) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoices-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
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
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 500;
}

.empty-state span {
  font-size: 0.85rem;
  color: #94a3b8;
}

.invoices-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invoice-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.invoice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.invoice-plan {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.invoice-amount {
  font-weight: 700;
  color: var(--color-primary, #23424a);
  font-size: 1rem;
}

.invoice-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invoice-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.invoice-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.status-active {
  background: #dcfce7;
  color: #16a34a;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-expired {
  background: #f1f5f9;
  color: #64748b;
}

@media (min-width: 768px) {
  .invoices-page {
    padding: 24px;
  }
}
</style>
