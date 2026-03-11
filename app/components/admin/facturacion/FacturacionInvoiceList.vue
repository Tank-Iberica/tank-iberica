<script setup lang="ts">
import {
  formatAmount,
  formatDate,
  getServiceTypeLabel,
  getStatusClass,
  type InvoiceRow,
} from '~/composables/admin/useAdminFacturacion'

const { t } = useI18n()

defineProps<{
  invoices: InvoiceRow[]
}>()

function getStatusLabel(status: string): string {
  const labels: Record<string, () => string> = {
    paid: () => t('billing.statusPaid'),
    pending: () => t('billing.statusPending'),
    failed: () => t('billing.statusFailed'),
    refunded: () => t('billing.statusRefunded'),
  }
  return labels[status] ? labels[status]() : status
}
</script>

<template>
  <div class="section-card">
    <h2 class="section-title">{{ t('billing.recentInvoices') }}</h2>

    <!-- Empty state -->
    <div v-if="invoices.length === 0" class="empty-state">
      <p>{{ t('billing.noInvoices') }}</p>
    </div>

    <!-- Invoice cards (mobile) / row layout (desktop) -->
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

<style scoped>
.section-card {
  background: var(--bg-primary, var(--color-white));
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, var(--shadow-sm));
  padding: var(--spacing-4) var(--spacing-5);
}

.section-title {
  margin: 0 0 var(--spacing-4) 0;
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, var(--text-primary));
}

.invoices-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.invoice-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--color-gray-50, var(--color-gray-50));
  border-radius: var(--border-radius, 8px);
  border: 1px solid var(--border-color-light, var(--color-gray-200));
  transition: border-color var(--transition-fast, 150ms ease);
}

.invoice-card:hover {
  border-color: var(--border-color, var(--color-gray-300));
}

.invoice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invoice-date {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, var(--text-auxiliary));
  font-variant-numeric: tabular-nums;
}

.invoice-status {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: var(--border-radius-full, 9999px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  min-height: auto;
  min-width: auto;
}

.invoice-status.status-paid {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-green-700);
}

.invoice-status.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.invoice-status.status-failed {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.invoice-status.status-refunded {
  background: var(--color-gray-100, var(--color-gray-100));
  color: var(--color-gray-600, var(--color-gray-600));
}

.invoice-middle {
  display: flex;
  align-items: center;
}

.invoice-type-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-gray-200, var(--color-gray-200));
  color: var(--text-secondary, var(--text-secondary));
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
  gap: 0.125rem;
}

.invoice-amount {
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary, var(--text-primary));
  font-variant-numeric: tabular-nums;
}

.invoice-tax {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--text-auxiliary, var(--text-auxiliary));
  font-variant-numeric: tabular-nums;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px var(--spacing-4);
  text-align: center;
}

.empty-state p {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, var(--text-auxiliary));
  margin: 0;
}

@media (min-width: 64em) {
  .section-card {
    padding: var(--spacing-6) var(--spacing-8);
  }
}

@media (min-width: 80em) {
  .invoice-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
  }

  .invoice-top {
    flex: 0 0 auto;
    gap: var(--spacing-4);
    min-width: 12.5rem;
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
    gap: var(--spacing-3);
  }
}
</style>
