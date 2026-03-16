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
    <table v-if="entries.length" class="historico-table">
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
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="empty-title">{{ t('dashboard.historico.empty') }}</p>
      <p class="empty-desc">{{ t('dashboard.historico.emptyDesc') }}</p>
      <NuxtLink to="/dashboard" class="btn-primary">{{
        t('dashboard.historico.goToDashboard')
      }}</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3.75rem 1.25rem;
  color: var(--text-auxiliary);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 0.1875rem solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: var(--border-radius-full);
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
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
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
  padding: 0.75rem 0.625rem;
  background: var(--color-gray-50);
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  color: var(--color-gray-500);
  border-bottom: 1px solid var(--color-gray-200);
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
  width: 6.25rem;
}

.historico-table td {
  padding: 0.625rem;
  border-bottom: 1px solid var(--color-gray-100);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.25rem;
  text-align: center;
  color: var(--text-auxiliary);
}

.empty-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-primary {
  margin-top: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary, var(--color-primary));
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.empty-state p {
  margin: 0;
}

/* Action buttons */
.btn-icon {
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-base);
  border-radius: var(--border-radius);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.btn-icon.restore:hover {
  background: var(--color-success-bg, var(--color-success-bg));
}

(@media ()max-width: 47.9375em())) {
  .historico-table {
    font-size: var(--font-size-xs);
  }

  .historico-table th,
  .historico-table td {
    padding: 0.5rem 0.375rem;
  }
}
</style>
