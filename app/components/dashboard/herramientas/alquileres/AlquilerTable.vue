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
    <table v-if="sortedRecords.length > 0" class="data-table">
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

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.status-finished {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge.status-overdue {
  background: #fee2e2;
  color: #991b1b;
}

.ending-text {
  color: #dc2626;
}

.ending-badge {
  display: inline-block;
  padding: 1px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 4px;
}

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
}
</style>
