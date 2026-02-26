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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge-sm {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-msg {
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 32px 16px;
}

.table-container {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  color: #334155;
}

.data-table tr:hover {
  background: #f8fafc;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.text-muted {
  color: #64748b;
}

.text-small {
  font-size: 0.8rem;
}

.bid-winning {
  background: #f0fdf4 !important;
}

.winner-indicator {
  color: #16a34a;
  font-weight: 600;
  font-size: 0.8rem;
}

.highest-indicator {
  color: #1d4ed8;
  font-weight: 500;
  font-size: 0.8rem;
}
</style>
