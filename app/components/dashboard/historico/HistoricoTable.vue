<script setup lang="ts">
/**
 * HistoricoTable — Data table for the dealer sales history.
 * Sortable columns, profit/margin display, action buttons.
 */
import type { SoldVehicle, HistoricoSortCol } from '~/composables/dashboard/useDashboardHistorico'
import {
  getProfit,
  getMarginPercent,
  getTotalCost,
} from '~/composables/dashboard/useDashboardHistorico'

defineProps<{
  entries: SoldVehicle[]
  loading: boolean
  sortCol: HistoricoSortCol
  sortAsc: boolean
  fmt: (val: number | null | undefined) => string
  fmtDate: (date: string | null) => string
  getSortIcon: (col: string) => string
}>()

const emit = defineEmits<{
  (e: 'toggleSort', col: HistoricoSortCol): void
  (e: 'viewDetail' | 'restoreEntry', entry: SoldVehicle): void
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="loading-state">
    <div class="spinner" />
    <span>{{ t('dashboard.historico.loading') }}</span>
  </div>

  <!-- Table -->
  <div v-else class="table-container">
    <table v-if="entries.length > 0" class="historico-table">
      <thead>
        <tr>
          <th class="sortable" @click="emit('toggleSort', 'brand')">
            {{ t('dashboard.historico.table.vehicle') }}{{ getSortIcon('brand') }}
          </th>
          <th>{{ t('dashboard.historico.table.year') }}</th>
          <th class="sortable" @click="emit('toggleSort', 'sale_date')">
            {{ t('dashboard.historico.table.saleDate') }}{{ getSortIcon('sale_date') }}
          </th>
          <th class="sortable num" @click="emit('toggleSort', 'sale_price')">
            {{ t('dashboard.historico.table.salePrice') }}{{ getSortIcon('sale_price') }}
          </th>
          <th class="num">{{ t('dashboard.historico.table.cost') }}</th>
          <th class="sortable num" @click="emit('toggleSort', 'profit')">
            {{ t('dashboard.historico.table.profit') }}{{ getSortIcon('profit') }}
          </th>
          <th class="num">{{ t('dashboard.historico.table.margin') }}</th>
          <th class="actions-col">{{ t('dashboard.historico.table.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in entries" :key="e.id">
          <td class="vehiculo-cell">
            <strong>{{ e.brand }}</strong> {{ e.model }}
          </td>
          <td>{{ e.year || '--' }}</td>
          <td>{{ fmtDate(e.sale_date) }}</td>
          <td class="num">
            <strong>{{ fmt(e.sale_price) }}</strong>
          </td>
          <td class="num muted">{{ fmt(getTotalCost(e)) }}</td>
          <td class="num" :class="getProfit(e) >= 0 ? 'profit-pos' : 'profit-neg'">
            <strong>{{ fmt(getProfit(e)) }}</strong>
          </td>
          <td class="num" :class="getMarginPercent(e) >= 0 ? 'profit-pos' : 'profit-neg'">
            {{ getMarginPercent(e) }}%
          </td>
          <td class="actions-cell">
            <button
              class="btn-icon"
              :title="t('dashboard.historico.detail.title')"
              @click="emit('viewDetail', e)"
            >
              &#128065;
            </button>
            <button
              class="btn-icon restore"
              :title="t('dashboard.historico.restore.title')"
              @click="emit('restoreEntry', e)"
            >
              &#8634;
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>{{ t('dashboard.historico.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
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

/* Table */
.table-container {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.historico-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.historico-table th {
  text-align: left;
  padding: 12px 10px;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.historico-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.historico-table th.sortable:hover {
  background: var(--bg-secondary);
}

.historico-table th.num,
.historico-table td.num {
  text-align: right;
}

.historico-table th.actions-col {
  text-align: center;
  width: 100px;
}

.historico-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.historico-table td.vehiculo-cell {
  font-weight: 500;
  white-space: nowrap;
}

.historico-table td.muted {
  color: var(--text-disabled);
}

.historico-table td.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Profit colors */
.profit-pos {
  color: var(--color-success);
  font-weight: 600;
}

.profit-neg {
  color: var(--color-error);
  font-weight: 600;
}

/* Empty state */
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0;
}

/* Action buttons */
.btn-icon {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.btn-icon.restore:hover {
  background: var(--color-success-bg, #dcfce7);
}

@media (max-width: 767px) {
  .historico-table {
    font-size: 0.75rem;
  }

  .historico-table th,
  .historico-table td {
    padding: 8px 6px;
  }
}
</style>
