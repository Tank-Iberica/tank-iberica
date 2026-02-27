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
    <table v-if="records.length > 0" class="data-table">
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
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
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
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  padding: 12px 10px;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: #f3f4f6;
}

.data-table th.num,
.data-table td.num {
  text-align: right;
}

.data-table th.actions-col {
  text-align: center;
  width: 100px;
}

.data-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.vehicle-cell {
  white-space: nowrap;
}

.year-tag {
  color: #9ca3af;
  font-size: 0.8rem;
}

.desc-cell {
  max-width: 200px;
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
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-preventivo {
  background: #dbeafe;
  color: #1e40af;
}

.badge-correctivo {
  background: #fee2e2;
  color: #991b1b;
}

.badge-itv {
  background: #dcfce7;
  color: #166534;
}

/* Buttons */
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
  background: #f3f4f6;
}

.btn-icon.delete:hover {
  background: #fee2e2;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 6px;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Empty state */
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0 0 16px;
}

@media (max-width: 767px) {
  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 8px 6px;
  }

  .desc-cell {
    max-width: 120px;
  }
}
</style>
