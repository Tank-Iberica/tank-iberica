<script setup lang="ts">
/**
 * Data table for maintenance records.
 * Includes sortable headers, type badges, and row actions.
 * Shows empty state when no records exist.
 */
import type {
  MaintenanceRecord,
  SortColumn,
} from '~/composables/dashboard/useDashboardMantenimientos'

defineProps<{
  records: MaintenanceRecord[]
  loading: boolean
  sortCol: SortColumn
  sortAsc: boolean
  getSortIcon: (col: string) => string
  fmt: (val: number) => string
  fmtDate: (date: string) => string
  fmtKm: (km: number | null) => string
  getTypeBadgeClass: (type: string) => string
}>()

const emit = defineEmits<{
  toggleSort: [col: SortColumn]
  edit: [record: MaintenanceRecord]
  delete: [record: MaintenanceRecord]
  create: []
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="loading-state">
    <div class="spinner" />
    <span>{{ t('common.loading') }}...</span>
  </div>

  <!-- Table -->
  <div v-else class="table-container">
    <table v-if="records.length" class="data-table">
      <thead>
        <tr>
          <th class="sortable" @click="emit('toggleSort', 'vehicle')">
            {{ t('dashboard.tools.maintenance.table.vehicle') }}{{ getSortIcon('vehicle') }}
          </th>
          <th class="sortable" @click="emit('toggleSort', 'date')">
            {{ t('dashboard.tools.maintenance.table.date') }}{{ getSortIcon('date') }}
          </th>
          <th class="sortable" @click="emit('toggleSort', 'type')">
            {{ t('dashboard.tools.maintenance.table.type') }}{{ getSortIcon('type') }}
          </th>
          <th>{{ t('dashboard.tools.maintenance.table.description') }}</th>
          <th class="sortable num" @click="emit('toggleSort', 'cost')">
            {{ t('dashboard.tools.maintenance.table.cost') }}{{ getSortIcon('cost') }}
          </th>
          <th class="num">{{ t('dashboard.tools.maintenance.table.km') }}</th>
          <th class="actions-col">{{ t('dashboard.tools.maintenance.table.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in records" :key="r.id">
          <td class="vehicle-cell">
            <strong>{{ r.vehicle_brand }}</strong> {{ r.vehicle_model }}
            <span v-if="r.vehicle_year" class="year-tag">({{ r.vehicle_year }})</span>
          </td>
          <td>{{ fmtDate(r.date) }}</td>
          <td>
            <span class="type-badge" :class="getTypeBadgeClass(r.type)">
              {{ t(`dashboard.tools.maintenance.types.${r.type}`) }}
            </span>
          </td>
          <td class="desc-cell">{{ r.description }}</td>
          <td class="num">
            <strong>{{ fmt(r.cost) }}</strong>
          </td>
          <td class="num">{{ fmtKm(r.km) }}</td>
          <td class="actions-cell">
            <button
              class="btn-icon"
              :title="t('dashboard.tools.maintenance.edit')"
              @click="emit('edit', r)"
            >
              &#9998;
            </button>
            <button
              class="btn-icon delete"
              :title="t('dashboard.tools.maintenance.delete')"
              @click="emit('delete', r)"
            >
              &#128465;
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty-state">
      <p>{{ t('dashboard.tools.maintenance.empty') }}</p>
      <button class="btn-primary" @click="emit('create')">
        + {{ t('dashboard.tools.maintenance.addFirst') }}
      </button>
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

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
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

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: var(--bg-secondary);
}

.data-table th.num,
.data-table td.num {
  text-align: right;
}

.data-table th.actions-col {
  text-align: center;
  width: 6.25rem;
}

.data-table td {
  padding: 0.625rem;
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: middle;
}

.vehicle-cell {
  white-space: nowrap;
}

.year-tag {
  color: var(--text-disabled);
  font-size: var(--font-size-sm);
}

.desc-cell {
  max-width: 12.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Type badges */
.type-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}

.badge-preventivo {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.badge-correctivo {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.badge-itv {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}

/* Buttons */
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

.btn-icon.delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 0.375rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Empty state */
.empty-state {
  padding: 3rem 1.25rem;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0 0 1rem;
}

@media (max-width: 47.9375em) {
  .data-table {
    font-size: var(--font-size-xs);
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.375rem;
  }

  .desc-cell {
    max-width: 7.5rem;
  }
}
</style>
