<script setup lang="ts">
import type { DealerInvoiceRow } from '~/composables/dashboard/useInvoice'

defineProps<{
  invoices: DealerInvoiceRow[]
  loading: boolean
}>()

const { t } = useI18n()

function formatHistoryDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'status-draft',
    sent: 'status-sent',
    paid: 'status-paid',
    cancelled: 'status-cancelled',
  }
  return map[status] || ''
}
</script>

<template>
  <div class="invoice-history">
    <div v-if="loading" class="invoice-history__loading">
      {{ t('dashboard.tools.invoice.loading') }}...
    </div>

    <div v-else-if="invoices.length === 0" class="invoice-history__empty">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p>{{ t('dashboard.tools.invoice.noInvoices') }}</p>
    </div>

    <div v-else class="history-list">
      <!-- Desktop table -->
      <table class="history-table">
        <thead>
          <tr>
            <th>{{ t('dashboard.tools.invoice.historyDate') }}</th>
            <th>{{ t('dashboard.tools.invoice.historyNumber') }}</th>
            <th>{{ t('dashboard.tools.invoice.historyClient') }}</th>
            <th class="history-table__num">{{ t('dashboard.tools.invoice.historyTotal') }}</th>
            <th>{{ t('dashboard.tools.invoice.historyStatus') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.id">
            <td>{{ formatHistoryDate(inv.invoice_date) }}</td>
            <td class="history-table__number">{{ inv.invoice_number }}</td>
            <td>{{ inv.client_name }}</td>
            <td class="history-table__num">{{ formatCurrency(inv.total) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(inv.status)">{{
                t(`dashboard.tools.invoice.status_${inv.status}`)
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile cards for history -->
      <div class="history-mobile">
        <div v-for="inv in invoices" :key="'hm-' + inv.id" class="history-card">
          <div class="history-card__header">
            <span class="history-card__number">{{ inv.invoice_number }}</span>
            <span class="status-badge" :class="getStatusClass(inv.status)">{{
              t(`dashboard.tools.invoice.status_${inv.status}`)
            }}</span>
          </div>
          <div class="history-card__client">{{ inv.client_name }}</div>
          <div class="history-card__footer">
            <span>{{ formatHistoryDate(inv.invoice_date) }}</span>
            <strong>{{ formatCurrency(inv.total) }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ INVOICE HISTORY ============ */
.invoice-history__loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.invoice-history__empty {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
}

.invoice-history__empty svg {
  margin-bottom: 1rem;
}

.invoice-history__empty p {
  font-size: 0.9rem;
}

/* History table (desktop) — hidden on mobile */
.history-table {
  display: none;
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
}

.history-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.history-table__num {
  text-align: right;
  font-weight: 600;
}

.history-table__number {
  font-family: monospace;
  font-size: 0.8rem;
}

/* History mobile cards — shown on mobile */
.history-mobile {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.history-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-card__number {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary, #23424a);
}

.history-card__client {
  font-size: 0.9rem;
  color: #334155;
  margin-bottom: 0.5rem;
}

.history-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #64748b;
}

.history-card__footer strong {
  color: var(--primary, #23424a);
  font-size: 0.95rem;
}

/* ============ STATUS BADGES ============ */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-sent {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-paid {
  background: #dcfce7;
  color: #15803d;
}

.status-cancelled {
  background: #fef2f2;
  color: #b91c1c;
}

/* ============ DESKTOP BREAKPOINT (768px+) ============ */
@media (min-width: 768px) {
  .history-table {
    display: table;
  }

  .history-mobile {
    display: none;
  }
}
</style>
