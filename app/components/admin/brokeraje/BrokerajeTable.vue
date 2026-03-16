<script setup lang="ts">
import {
  type BrokerageDeal,
  getStatusLabel,
  getStatusColor,
  getDealModeLabel,
  formatDealPrice,
  formatDealDate,
} from '~/composables/admin/useAdminBrokerage'

defineProps<{
  deals: readonly BrokerageDeal[]
  loading: boolean
  error: string | null
}>()

defineEmits<{
  select: [deal: BrokerageDeal]
}>()

function vehicleTitle(deal: BrokerageDeal): string {
  if (!deal.vehicle) return '-'
  const v = deal.vehicle
  return [v.brand, v.model, v.year].filter(Boolean).join(' ')
}

function buyerLabel(deal: BrokerageDeal): string {
  if (deal.buyer?.email) return deal.buyer.email
  if (deal.buyer_phone) return deal.buyer_phone
  return '-'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="table-loading">{{ $t('common.loadingItems') }}</div>

    <!-- Error -->
    <div v-else-if="error" class="table-error">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="deals.length === 0" class="table-empty">
      {{ $t('common.noResults') }}
    </div>

    <!-- Desktop table -->
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ $t('common.status') }}</th>
            <th>Vehiculo</th>
            <th>Comprador</th>
            <th>Precio</th>
            <th>Modo</th>
            <th>{{ $t('common.date') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="deal in deals" :key="deal.id" class="table-row" @click="$emit('select', deal)">
            <td>
              <span class="status-badge" :style="{ '--badge-color': getStatusColor(deal.status) }">
                {{ getStatusLabel(deal.status) }}
              </span>
            </td>
            <td class="cell-vehicle">{{ vehicleTitle(deal) }}</td>
            <td class="cell-buyer">{{ buyerLabel(deal) }}</td>
            <td>{{ formatDealPrice(deal.asking_price) }}</td>
            <td>
              <span class="mode-badge" :class="`mode-${deal.deal_mode}`">
                {{ getDealModeLabel(deal.deal_mode) }}
              </span>
            </td>
            <td class="cell-date">{{ formatDealDate(deal.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div v-if="!loading && !error && deals.length" class="cards-mobile">
      <button
        v-for="deal in deals"
        :key="`card-${deal.id}`"
        class="deal-card"
        @click="$emit('select', deal)"
      >
        <div class="card-header">
          <span class="status-badge" :style="{ '--badge-color': getStatusColor(deal.status) }">
            {{ getStatusLabel(deal.status) }}
          </span>
          <span class="mode-badge" :class="`mode-${deal.deal_mode}`">
            {{ getDealModeLabel(deal.deal_mode) }}
          </span>
        </div>
        <div class="card-body">
          <div class="card-vehicle">{{ vehicleTitle(deal) }}</div>
          <div class="card-buyer">{{ buyerLabel(deal) }}</div>
        </div>
        <div class="card-footer">
          <span>{{ formatDealPrice(deal.asking_price) }}</span>
          <span class="card-date">{{ formatDealDate(deal.created_at) }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Desktop table */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: var(--spacing-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.data-table td {
  padding: var(--spacing-3);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border-color);
}

.table-row {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--bg-secondary);
}

.cell-vehicle {
  font-weight: var(--font-weight-medium);
  max-width: 12.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-buyer {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-date {
  white-space: nowrap;
  color: var(--text-secondary);
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 12%, transparent);
  white-space: nowrap;
}

/* Mode badge */
.mode-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.mode-broker {
  color: var(--color-info);
  background: rgba(59, 130, 246, 0.1);
}

.mode-tank {
  color: var(--color-orange-500);
  background: rgba(249, 115, 22, 0.1);
}

/* States */
.table-loading,
.table-error,
.table-empty {
  padding: var(--spacing-8);
  text-align: center;
  color: var(--text-secondary);
}

.table-error {
  color: var(--color-error);
}

/* Mobile cards */
.cards-mobile {
  display: none;
}

@media (max-width: 47.9375em) {
  .table-wrapper {
    display: none;
  }

  .cards-mobile {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }
}

.deal-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: left;
  width: 100%;
  transition: box-shadow var(--transition-fast);
}

.deal-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.card-vehicle {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.card-buyer {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.card-date {
  color: var(--text-secondary);
}
</style>
