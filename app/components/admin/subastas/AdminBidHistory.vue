<script setup lang="ts">
import type { AuctionBid } from '~/composables/useAuction'

defineProps<{
  bids: AuctionBid[]
  formatCents: (cents: number | null) => string
  formatDateShort: (dateStr: string | null) => string
}>()

const { t } = useI18n()
</script>

<template>
  <section class="section">
    <h2 class="section-title">
      {{ t('admin.subastas.detail.bidHistory') }}
      <span class="count-badge-sm">{{ bids.length }}</span>
    </h2>

    <div v-if="bids.length === 0" class="empty-msg">
      {{ t('admin.subastas.detail.noBids') }}
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t('admin.subastas.detail.bidUser') }}</th>
            <th class="col-num">{{ t('admin.subastas.detail.bidAmount') }}</th>
            <th>{{ t('admin.subastas.detail.bidTime') }}</th>
            <th>{{ t('admin.subastas.detail.bidWinning') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(bid, idx) in bids" :key="bid.id" :class="{ 'bid-winning': bid.is_winning }">
            <td class="text-muted">{{ bids.length - idx }}</td>
            <td class="text-small">{{ bid.user_id.slice(0, 8) }}...</td>
            <td class="col-num">
              <strong>{{ formatCents(bid.amount_cents) }}</strong>
            </td>
            <td class="text-small">{{ formatDateShort(bid.created_at) }}</td>
            <td>
              <span v-if="bid.is_winning" class="winner-indicator"
                >&#127942; {{ t('admin.subastas.detail.winnerLabel') }}</span
              >
              <span v-else-if="idx === 0" class="highest-indicator"
                >&#9650; {{ t('admin.subastas.detail.highest') }}</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge-sm {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.875rem;
  padding: 32px 16px;
}

.table-container {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid var(--color-gray-200);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--color-gray-200);
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.85rem;
  color: #334155;
}

.data-table tr:hover {
  background: var(--bg-secondary);
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.text-muted {
  color: var(--text-auxiliary);
}

.text-small {
  font-size: 0.8rem;
}

.bid-winning {
  background: var(--color-success-bg, #dcfce7) !important;
}

.winner-indicator {
  color: var(--color-success);
  font-weight: 600;
  font-size: 0.8rem;
}

.highest-indicator {
  color: var(--color-info);
  font-weight: 500;
  font-size: 0.8rem;
}
</style>
