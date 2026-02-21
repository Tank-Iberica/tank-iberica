<script setup lang="ts">
/**
 * Dealer Invoice History
 * Shows invoices from the invoices table with service type, amount, tax, and PDF download.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { invoices, loading, error, loadInvoices, formatAmount, totalAmount, totalTax } =
  useInvoicing()

async function init(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (dealer) {
    await loadInvoices(dealer.id)
  }
}

onMounted(init)

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    paid: 'status-paid',
    pending: 'status-pending',
    failed: 'status-failed',
    refunded: 'status-refunded',
  }
  return map[status] || ''
}

function getServiceLabel(type: string): string {
  const labels: Record<string, string> = {
    subscription: t('billing.typeSubscription'),
    auction_premium: t('billing.typeAuction'),
    transport: t('billing.typeTransport'),
    verification: t('billing.typeVerification'),
    ad: t('billing.typeAd'),
  }
  return labels[type] || type
}
</script>

<template>
  <div class="invoices-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">
        {{ t('common.back') }}
      </NuxtLink>
      <h1>{{ t('dashboard.invoices.title') }}</h1>
    </header>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div v-if="invoices.length > 0" class="summary-cards">
        <div class="summary-card">
          <span class="summary-label">{{ t('billing.totalRevenue') }}</span>
          <span class="summary-value">{{ formatAmount(totalAmount) }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">{{ t('billing.totalTax') }}</span>
          <span class="summary-value summary-tax">{{ formatAmount(totalTax) }}</span>
        </div>
      </div>

      <div v-if="invoices.length === 0" class="empty-state">
        <p>{{ t('dashboard.invoices.empty') }}</p>
        <span>{{ t('dashboard.invoices.emptyDesc') }}</span>
      </div>

      <div v-else class="invoices-list">
        <div v-for="inv in invoices" :key="inv.id" class="invoice-card">
          <div class="invoice-top">
            <span class="invoice-type">{{ getServiceLabel(inv.service_type) }}</span>
            <span class="invoice-amount">{{ formatAmount(inv.amount_cents) }}</span>
          </div>
          <div class="invoice-middle">
            <span class="invoice-tax"
              >{{ t('billing.tax') }}: {{ formatAmount(inv.tax_cents) }}</span
            >
          </div>
          <div class="invoice-bottom">
            <span class="invoice-date">{{ formatDate(inv.created_at) }}</span>
            <div class="invoice-actions">
              <span class="invoice-status" :class="getStatusClass(inv.status)">
                {{ t(`billing.status${inv.status.charAt(0).toUpperCase()}${inv.status.slice(1)}`) }}
              </span>
              <a
                v-if="inv.pdf_url"
                :href="inv.pdf_url"
                target="_blank"
                rel="noopener"
                class="invoice-pdf-link"
              >
                PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </template>
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

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
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

.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.summary-tax {
  color: #3b82f6;
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
  margin-bottom: 6px;
}

.invoice-type {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.invoice-amount {
  font-weight: 700;
  color: var(--color-primary, #23424a);
  font-size: 1rem;
}

.invoice-middle {
  margin-bottom: 8px;
}

.invoice-tax {
  font-size: 0.8rem;
  color: #94a3b8;
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

.invoice-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.invoice-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.status-paid {
  background: #dcfce7;
  color: #16a34a;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-refunded {
  background: #f1f5f9;
  color: #64748b;
}

.invoice-pdf-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary, #23424a);
  text-decoration: none;
  padding: 3px 10px;
  border: 1px solid var(--color-primary, #23424a);
  border-radius: 6px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
}

.invoice-pdf-link:hover {
  background: var(--color-primary, #23424a);
  color: white;
}

@media (min-width: 768px) {
  .invoices-page {
    padding: 24px;
  }
}
</style>
