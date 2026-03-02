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
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.auction-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Card header */
.auction-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.auction-main-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auction-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.auction-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid;
}

.meta-item {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Card body */
.auction-card-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  color: #374151;
  font-weight: 600;
}

.info-value.current-bid {
  color: var(--color-primary);
}

.dates-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  font-size: 0.8rem;
  color: #6b7280;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-separator {
  color: #d1d5db;
  font-weight: 600;
}

/* Card actions */
.auction-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  min-height: 44px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-edit {
  background: #eff6ff;
  color: var(--color-info);
  border-color: #bfdbfe;
}

.action-edit:hover:not(:disabled) {
  background: var(--color-info-bg, #dbeafe);
}

.action-registrations {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.action-registrations:hover {
  background: var(--color-success-bg, #dcfce7);
}

.action-adjudicate {
  background: #faf5ff;
  color: #7c3aed;
  border-color: #e9d5ff;
}

.action-adjudicate:hover:not(:disabled) {
  background: #f3e8ff;
}

.action-cancel {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-cancel:hover:not(:disabled) {
  background: var(--color-error-bg, #fef2f2);
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .auction-card-actions {
    flex-direction: column;
  }
}

@media (min-width: 768px) {
  .auction-card-header {
    padding: 16px 24px;
  }

  .auction-card-body {
    padding: 16px 24px;
  }

  .auction-card-actions {
    padding: 12px 24px;
  }

  .info-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .auction-card-actions {
    gap: 10px;
  }
}
</style>
