<script setup lang="ts">
/**
 * Table view of rental records.
 * Shows all records in a responsive table with actions.
 */
import type { RentalRecord, RentalStatus } from '~/composables/dashboard/useDashboardAlquileres'

defineProps<{
  sortedRecords: RentalRecord[]
  getStatusClass: (status: RentalStatus) => string
  fmt: (val: number) => string
  fmtDate: (date: string | null) => string
  isEndingSoon: (record: RentalRecord) => boolean
  daysUntilEnd: (record: RentalRecord) => number
}>()

const emit = defineEmits<{
  edit: [record: RentalRecord]
  delete: [record: RentalRecord]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="table-container">
    <table v-if="sortedRecords.length" class="data-table">
      <thead>
        <tr>
          <th>{{ t('dashboard.tools.rentals.table.vehicle') }}</th>
          <th>{{ t('dashboard.tools.rentals.table.client') }}</th>
          <th>{{ t('dashboard.tools.rentals.table.startDate') }}</th>
          <th>{{ t('dashboard.tools.rentals.table.endDate') }}</th>
          <th class="num">{{ t('dashboard.tools.rentals.table.monthlyRent') }}</th>
          <th>{{ t('dashboard.tools.rentals.table.status') }}</th>
          <th class="actions-col">{{ t('dashboard.tools.rentals.table.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in sortedRecords" :key="r.id">
          <td class="vehicle-cell">
            <strong>{{ r.vehicle_brand }}</strong> {{ r.vehicle_model }}
          </td>
          <td>{{ r.client_name }}</td>
          <td>{{ fmtDate(r.start_date) }}</td>
          <td :class="{ 'ending-text': isEndingSoon(r) }">
            {{ fmtDate(r.end_date) }}
            <span v-if="isEndingSoon(r)" class="ending-badge">{{ daysUntilEnd(r) }}d</span>
          </td>
          <td class="num">
            <strong>{{ fmt(r.monthly_rent) }}</strong>
          </td>
          <td>
            <span class="status-badge" :class="getStatusClass(r.status)">
              {{ t(`dashboard.tools.rentals.statuses.${r.status}`) }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="btn-icon" @click="emit('edit', r)">&#9998;</button>
            <button class="btn-icon delete" @click="emit('delete', r)">&#128465;</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty-state">
      <p>{{ t('dashboard.tools.rentals.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
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

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.status-active {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}

.status-badge.status-finished {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

.status-badge.status-overdue {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.ending-text {
  color: var(--color-error);
}

.ending-badge {
  display: inline-block;
  padding: 0.0625rem 0.375rem;
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
  border-radius: var(--border-radius);
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 0.25rem;
}

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

(@media ()max-width: 47.9375em())) {
  .data-table {
    font-size: var(--font-size-xs);
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.375rem;
  }
}
</style>
