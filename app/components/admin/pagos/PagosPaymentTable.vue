<script setup lang="ts">
import {
  formatCurrency,
  formatDate,
  truncateId,
  getTypeBadgeClass,
  getStatusBadgeClass,
  getStripePaymentUrl,
  type Payment,
} from '~/composables/admin/useAdminPagos'

defineProps<{
  payments: Payment[]
  expandedId: string | null
}>()

const emit = defineEmits<{
  (e: 'toggle-expand', id: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="table-wrapper">
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
        <template v-for="payment in payments" :key="payment.id">
          <tr
            class="table-row"
            :class="{ expanded: expandedId === payment.id }"
            @click="emit('toggle-expand', payment.id)"
          >
            <td class="cell-id">{{ truncateId(payment.id) }}</td>
            <td class="cell-user">{{ truncateId(payment.user_id) }}</td>
            <td>
              <span class="type-badge" :class="getTypeBadgeClass(payment.type)">
                {{ t(`admin.pagos.type.${payment.type}`) }}
              </span>
            </td>
            <td class="cell-amount">{{ formatCurrency(payment.amount_cents) }}</td>
            <td>
              <span class="status-badge" :class="getStatusBadgeClass(payment.status)">
                {{ t(`admin.pagos.status.${payment.status}`) }}
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
</template>

<style scoped>
.table-wrapper {
  background: var(--bg-primary);
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
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-gray-100);
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--bg-secondary);
}

.table-row.expanded {
  background: var(--bg-secondary);
}

.cell-id,
.cell-user,
.cell-stripe {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.cell-amount {
  font-weight: 600;
  white-space: nowrap;
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
  color: var(--text-disabled);
}

.mono-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

/* Type badges */
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
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.type-badge.type-auction-premium {
  background: #e0e7ff;
  color: #4338ca;
}

.type-badge.type-verification {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
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
  background: var(--bg-secondary);
  color: #6b7280;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-succeeded {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.status-badge.status-pending {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.status-badge.status-failed {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.status-badge.status-refunded {
  background: #ede9fe;
  color: #7c3aed;
}

.status-badge.status-cancelled {
  background: var(--bg-secondary);
  color: #6b7280;
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-gray-200);
}

.expanded-content {
  padding: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  background: var(--bg-secondary);
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.metadata-field {
  flex-basis: 100%;
}

.metadata-pre {
  background: var(--color-gray-800);
  color: var(--color-gray-200);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}
</style>
