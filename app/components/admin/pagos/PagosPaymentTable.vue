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
  'toggle-expand': [id: string]
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
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
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
  color: var(--color-stripe);
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
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-badge.type-subscription {
  background: var(--color-purple-bg);
  color: var(--color-violet-700);
}

.type-badge.type-auction-deposit {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.type-badge.type-auction-premium {
  background: var(--color-indigo-100);
  color: var(--color-indigo-700);
}

.type-badge.type-verification {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.type-badge.type-transport {
  background: var(--color-cyan-bg);
  color: var(--color-cyan-text);
}

.type-badge.type-transfer {
  background: var(--color-teal-bg);
  color: var(--color-teal-text);
}

.type-badge.type-ad {
  background: var(--color-orange-100);
  color: var(--color-orange-700);
}

.type-badge.type-one-time {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-succeeded {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-badge.status-pending {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-badge.status-failed {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.status-badge.status-refunded {
  background: var(--color-purple-bg);
  color: var(--color-purple-600);
}

.status-badge.status-cancelled {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-gray-200);
}

.expanded-content {
  padding: 1rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: var(--bg-secondary);
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
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
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0;
  max-height: 12.5rem;
  overflow-y: auto;
}
</style>
