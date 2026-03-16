<script setup lang="ts">
/**
 * Dealer Invoice History
 * Shows invoices from the invoices table with service type, amount, tax, and PDF download.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
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
  const localeMap: Record<string, string> = {
    es: 'es-ES',
    en: 'en-GB',
    fr: 'fr-FR',
    pt: 'pt-PT',
    de: 'de-DE',
  }
  const intlLocale = localeMap[locale.value] ?? 'es-ES'
  return new Date(dateStr).toLocaleDateString(intlLocale, {
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

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="5" :cols="4" />
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div v-if="invoices.length" class="summary-cards">
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
  max-width: 43.75rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-10);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
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
  gap: var(--spacing-3);
}

.summary-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-disabled);
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

.summary-tax {
  color: var(--color-info);
}

.empty-state {
  text-align: center;
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.empty-state p {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 1rem;
  font-weight: 500;
}

.empty-state span {
  font-size: 0.85rem;
  color: var(--text-disabled);
}

.invoices-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.invoice-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-card);
}

.invoice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}

.invoice-type {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.invoice-amount {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 1rem;
}

.invoice-middle {
  margin-bottom: var(--spacing-2);
}

.invoice-tax {
  font-size: 0.8rem;
  color: var(--text-disabled);
}

.invoice-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invoice-date {
  font-size: 0.8rem;
  color: var(--text-disabled);
}

.invoice-actions {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.invoice-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
}

.status-paid {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning);
}

.status-failed {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.status-refunded {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

.invoice-pdf-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  padding: 0.1875rem 0.625rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius);
  min-height: 1.75rem;
  display: inline-flex;
  align-items: center;
}

.invoice-pdf-link:hover {
  background: var(--color-primary);
  color: white;
}

@media (min-width: 48em) {
  .invoices-page {
    padding: var(--spacing-6);
  }
}
</style>
