<script setup lang="ts">
import { formatPriceCents } from '~/composables/shared/useListingUtils'
import type { AuctionWithVehicle } from '~/composables/admin/useAdminAuctionList'
import type { AuctionStatus } from '~/composables/useAuction'

const props = defineProps<{
  auction: AuctionWithVehicle
  saving: boolean
  formatDate: (dateStr: string | null) => string
  getStatusColor: (status: AuctionStatus) => string
  getVehicleTitle: (auction: AuctionWithVehicle) => string
  canEdit: (auction: AuctionWithVehicle) => boolean
  canCancel: (auction: AuctionWithVehicle) => boolean
  canAdjudicate: (auction: AuctionWithVehicle) => boolean
}>()

const emit = defineEmits<{
  edit: [auction: AuctionWithVehicle]
  'view-registrations': [auction: AuctionWithVehicle]
  adjudicate: [auctionId: string]
  cancel: [auctionId: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="auction-card">
    <!-- Card header -->
    <div class="auction-card-header">
      <div class="auction-main-info">
        <h3 class="auction-title">
          {{ props.auction.title || props.getVehicleTitle(props.auction) }}
        </h3>
        <div class="auction-meta">
          <span
            class="status-badge"
            :style="{
              backgroundColor: props.getStatusColor(props.auction.status) + '1a',
              color: props.getStatusColor(props.auction.status),
              borderColor: props.getStatusColor(props.auction.status) + '40',
            }"
          >
            {{ t(`admin.subastas.status.${props.auction.status}`) }}
          </span>
          <span class="meta-item">
            {{ props.auction.bid_count || 0 }} {{ t('admin.subastas.columns.bids') }}
          </span>
          <span class="meta-item">
            {{ props.auction.registrations_count || 0 }}
            {{ t('admin.subastas.detail.registeredBidders') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Card body -->
    <div class="auction-card-body">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">{{ t('admin.subastas.columns.startPrice') }}</span>
          <span class="info-value">{{ formatPriceCents(props.auction.start_price_cents) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('admin.subastas.columns.currentBid') }}</span>
          <span class="info-value current-bid">
            {{
              props.auction.current_bid_cents > 0
                ? formatPriceCents(props.auction.current_bid_cents)
                : t('admin.subastas.errors.noBids')
            }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('admin.subastas.form.reservePrice') }}</span>
          <span class="info-value">{{ formatPriceCents(props.auction.reserve_price_cents) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('admin.subastas.form.deposit') }}</span>
          <span class="info-value">{{ formatPriceCents(props.auction.deposit_cents) }}</span>
        </div>
      </div>

      <div class="dates-row">
        <div class="date-item">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{{ props.formatDate(props.auction.starts_at) }}</span>
        </div>
        <span class="date-separator">&rarr;</span>
        <div class="date-item">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{{ props.formatDate(props.auction.ends_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Card actions -->
    <div class="auction-card-actions">
      <button
        v-if="props.canEdit(props.auction)"
        class="action-btn action-edit"
        :disabled="props.saving"
        @click="emit('edit', props.auction)"
      >
        {{ t('admin.subastas.actions.edit') }}
      </button>
      <button
        class="action-btn action-registrations"
        @click="emit('view-registrations', props.auction)"
      >
        {{ t('admin.subastas.detail.bidders') }} ({{ props.auction.registrations_count || 0 }})
      </button>
      <button
        v-if="props.canAdjudicate(props.auction)"
        class="action-btn action-adjudicate"
        :disabled="props.saving"
        @click="emit('adjudicate', props.auction.id)"
      >
        {{ t('admin.subastas.actions.adjudicate') }}
      </button>
      <button
        v-if="props.canCancel(props.auction)"
        class="action-btn action-cancel"
        :disabled="props.saving"
        @click="emit('cancel', props.auction.id)"
      >
        {{ t('admin.subastas.actions.cancel') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.auction-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.auction-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Card header */
.auction-card-header {
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-gray-100);
}

.auction-main-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.auction-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

.auction-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid;
}

.meta-item {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

/* Card body */
.auction-card-body {
  padding: var(--spacing-4) var(--spacing-5);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.info-value {
  font-size: 0.95rem;
  color: var(--color-gray-700);
  font-weight: 600;
}

.info-value.current-bid {
  color: var(--color-primary);
}

.dates-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-gray-100);
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.date-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.date-separator {
  color: var(--color-gray-300);
  font-weight: 600;
}

/* Card actions */
.auction-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-100);
}

.action-btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  min-height: 2.75rem;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-edit {
  background: var(--color-blue-50);
  color: var(--color-info);
  border-color: var(--color-info-border);
}

.action-edit:hover:not(:disabled) {
  background: var(--color-info-bg, var(--color-info-bg));
}

.action-registrations {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.action-registrations:hover {
  background: var(--color-success-bg, var(--color-success-bg));
}

.action-adjudicate {
  background: var(--color-purple-50);
  color: var(--color-purple-600);
  border-color: var(--color-purple-200);
}

.action-adjudicate:hover:not(:disabled) {
  background: var(--color-purple-100);
}

.action-cancel {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-cancel:hover:not(:disabled) {
  background: var(--color-error-bg, var(--color-error-bg));
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 48em) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .auction-card-actions {
    flex-direction: column;
  }
}

@media (min-width: 48em) {
  .auction-card-header {
    padding: var(--spacing-4) var(--spacing-6);
  }

  .auction-card-body {
    padding: var(--spacing-4) var(--spacing-6);
  }

  .auction-card-actions {
    padding: var(--spacing-3) var(--spacing-6);
  }

  .info-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 64em) {
  .auction-card-actions {
    gap: 0.625rem;
  }
}
</style>
