<script setup lang="ts">
import type { AuctionStatus } from '~/composables/useAuction'
import type { AuctionWithVehicle } from '~/composables/admin/useAdminAuctionList'

defineProps<{
  auctions: AuctionWithVehicle[]
  loading: boolean
  error: string
  formatDate: (dateStr: string | null) => string
  formatPriceCents: (cents: number | null | undefined, locale?: string) => string
  getStatusClass: (status: AuctionStatus) => string
  getStatusLabel: (status: AuctionStatus) => string
  getVehicleTitle: (auction: AuctionWithVehicle) => string
  canEdit: (auction: AuctionWithVehicle) => boolean
  canCancel: (auction: AuctionWithVehicle) => boolean
  canAdjudicate: (auction: AuctionWithVehicle) => boolean
}>()

const emit = defineEmits<{
  edit: [auction: AuctionWithVehicle]
  adjudicate: [auctionId: string]
  cancel: [auctionId: string]
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Error -->
  <div v-if="error" class="alert-error">
    {{ error }}
  </div>

  <!-- Loading -->
  <div v-if="loading" class="loading-state">
    <div class="spinner" />
    <span>{{ t('admin.subastas.loading') }}</span>
  </div>

  <!-- Auction list -->
  <div v-else class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('admin.subastas.columns.vehicle') }}</th>
          <th>{{ t('admin.subastas.columns.title') }}</th>
          <th class="col-num">{{ t('admin.subastas.columns.startPrice') }}</th>
          <th class="col-num">{{ t('admin.subastas.columns.currentBid') }}</th>
          <th>{{ t('admin.subastas.columns.status') }}</th>
          <th>{{ t('admin.subastas.columns.startDate') }}</th>
          <th>{{ t('admin.subastas.columns.endDate') }}</th>
          <th class="col-num">{{ t('admin.subastas.columns.bids') }}</th>
          <th class="col-actions">{{ t('admin.subastas.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="auction in auctions" :key="auction.id">
          <td>
            <NuxtLink :to="`/admin/subastas/${auction.id}`" class="vehicle-link">
              <strong>{{ getVehicleTitle(auction) }}</strong>
            </NuxtLink>
          </td>
          <td class="text-muted">
            {{ auction.title || '-' }}
          </td>
          <td class="col-num">
            {{ formatPriceCents(auction.start_price_cents) }}
          </td>
          <td class="col-num">
            <strong v-if="auction.current_bid_cents > 0">{{
              formatPriceCents(auction.current_bid_cents)
            }}</strong>
            <span v-else class="text-muted">-</span>
          </td>
          <td>
            <span class="status-badge" :class="getStatusClass(auction.status)">
              {{ getStatusLabel(auction.status) }}
            </span>
          </td>
          <td class="text-small">
            {{ formatDate(auction.starts_at) }}
          </td>
          <td class="text-small">
            {{ formatDate(auction.ends_at) }}
          </td>
          <td class="col-num">
            {{ auction.bid_count }}
          </td>
          <td class="col-actions">
            <div class="row-actions">
              <NuxtLink
                :to="`/admin/subastas/${auction.id}`"
                class="action-btn"
                :title="t('admin.subastas.actions.view')"
              >
                &#128065;
              </NuxtLink>
              <button
                v-if="canEdit(auction)"
                class="action-btn"
                :title="t('admin.subastas.actions.edit')"
                @click="emit('edit', auction)"
              >
                &#9998;
              </button>
              <button
                v-if="canAdjudicate(auction)"
                class="action-btn action-adjudicate"
                :title="t('admin.subastas.actions.adjudicate')"
                @click="emit('adjudicate', auction.id)"
              >
                &#9989;
              </button>
              <button
                v-if="canCancel(auction)"
                class="action-btn action-cancel"
                :title="t('admin.subastas.actions.cancel')"
                @click="emit('cancel', auction.id)"
              >
                &#10060;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="auctions.length === 0">
          <td colspan="9" class="empty-cell">
            <div class="empty-state">
              <span class="empty-icon">&#128268;</span>
              <p>{{ t('admin.subastas.empty') }}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
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

.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 56.25em;
}

.data-table th {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  padding: 0.75rem 0.875rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--color-gray-200);
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.9rem;
  color: var(--color-slate-700);
}

.data-table tr:hover {
  background: var(--bg-secondary);
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-actions {
  width: 8.75rem;
}

.text-muted {
  color: var(--text-auxiliary);
}

.text-small {
  font-size: 0.8rem;
}

.vehicle-link {
  color: var(--text-primary);
  text-decoration: none;
}

.vehicle-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-draft {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

.status-scheduled {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-active {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-ended {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-adjudicated {
  background: var(--color-purple-bg);
  color: var(--color-purple-600);
}

.status-cancelled {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.status-no-sale {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

/* Row actions */
.row-actions {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: all 0.15s;
  min-width: 2.25rem;
  min-height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.action-adjudicate:hover {
  background: var(--color-success-bg, var(--color-success-bg));
  border-color: var(--color-success);
}

.action-cancel:hover {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-soft);
}

/* Empty state */
.empty-cell {
  text-align: center;
}

.empty-state {
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  display: block;
  margin-bottom: var(--spacing-3);
}

.empty-state p {
  margin: 0 0 var(--spacing-4) 0;
}
</style>
