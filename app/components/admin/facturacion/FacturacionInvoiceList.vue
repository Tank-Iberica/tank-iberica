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

@media (min-width: 1024px) {
  .section-card {
    padding: var(--spacing-6, 24px) var(--spacing-8, 32px);
  }
}

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
