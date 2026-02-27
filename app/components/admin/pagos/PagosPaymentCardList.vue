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
  <div class="card-list">
    <div
      v-for="payment in payments"
      :key="payment.id"
      class="payment-card"
      :class="{ expanded: expandedId === payment.id }"
    >
      <button class="card-header" @click="emit('toggle-expand', payment.id)">
        <div class="card-top">
          <span class="type-badge" :class="getTypeBadgeClass(payment.type)">
            {{ t(`admin.pagos.type.${payment.type}`) }}
          </span>
          <span class="status-badge" :class="getStatusBadgeClass(payment.status)">
            {{ t(`admin.pagos.status.${payment.status}`) }}
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
</template>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.payment-card:hover {
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

.mono-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}

.wrap-text {
  word-break: break-all;
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
</style>
