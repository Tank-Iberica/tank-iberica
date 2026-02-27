<script setup lang="ts">
import type { VisitBooking, BookingStatus } from '~/composables/dashboard/useDashboardVisitas'

const { t, locale } = useI18n()

defineProps<{
  bookings: VisitBooking[]
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update-status', bookingId: string, status: BookingStatus): void
}>()

function fmtDate(date: string | null): string {
  if (!date) return '--'
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getStatusClass(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'status-pending'
    case 'confirmed':
      return 'status-confirmed'
    case 'cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}
</script>

<template>
  <section class="section-card">
    <h2 class="section-title">{{ t('visits.bookings') }}</h2>

    <div v-if="bookings.length === 0" class="empty-state">
      <p>{{ t('visits.noBookings') }}</p>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('visits.date') }}</th>
            <th>{{ t('visits.time') }}</th>
            <th>{{ t('visits.vehicle') }}</th>
            <th>{{ t('visits.buyerName') }}</th>
            <th>{{ t('visits.status') }}</th>
            <th>{{ t('visits.notes') }}</th>
            <th class="actions-col">{{ t('visits.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.id">
            <td>{{ fmtDate(booking.visit_date) }}</td>
            <td>{{ booking.visit_time }}</td>
            <td class="vehicle-cell">
              <template v-if="booking.vehicle_brand">
                <strong>{{ booking.vehicle_brand }}</strong> {{ booking.vehicle_model }}
              </template>
              <template v-else>--</template>
            </td>
            <td>
              <div>{{ booking.buyer_name }}</div>
              <div v-if="booking.buyer_email" class="buyer-email">
                {{ booking.buyer_email }}
              </div>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(booking.status)">
                {{ t(`visits.statuses.${booking.status}`) }}
              </span>
            </td>
            <td class="notes-cell">{{ booking.notes || '--' }}</td>
            <td class="actions-cell">
              <template v-if="booking.status === 'pending'">
                <button
                  class="btn-sm btn-confirm"
                  :disabled="saving"
                  @click="emit('update-status', booking.id, 'confirmed')"
                >
                  {{ t('visits.confirm') }}
                </button>
                <button
                  class="btn-sm btn-cancel"
                  :disabled="saving"
                  @click="emit('update-status', booking.id, 'cancelled')"
                >
                  {{ t('visits.cancel') }}
                </button>
              </template>
              <template v-else-if="booking.status === 'confirmed'">
                <button
                  class="btn-sm btn-cancel"
                  :disabled="saving"
                  @click="emit('update-status', booking.id, 'cancelled')"
                >
                  {{ t('visits.cancel') }}
                </button>
              </template>
              <span v-else class="text-muted">--</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
/* Section card */
.section-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.section-title {
  margin: 0 0 var(--spacing-4);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

/* Empty state */
.empty-state {
  padding: var(--spacing-10) var(--spacing-5);
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.empty-state p {
  margin: 0;
}

/* Bookings table */
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th {
  text-align: left;
  padding: var(--spacing-3) var(--spacing-2);
  background: var(--bg-secondary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  color: var(--text-auxiliary);
  border-bottom: 1px solid var(--border-color-light);
  white-space: nowrap;
}

.data-table th.actions-col {
  text-align: center;
  width: 140px;
}

.data-table td {
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: middle;
}

.vehicle-cell {
  white-space: nowrap;
}

.buyer-email {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.notes-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
  display: flex;
  gap: var(--spacing-1);
  justify-content: center;
}

.text-muted {
  color: var(--text-disabled);
  font-size: var(--font-size-sm);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-confirmed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.status-cancelled {
  background: #f1f5f9;
  color: var(--text-auxiliary);
}

/* Buttons */
.btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  min-width: 44px;
  padding: var(--spacing-1) var(--spacing-3);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm {
  background: var(--color-success);
  color: var(--color-white);
}

.btn-confirm:hover {
  background: #059669;
}

.btn-cancel {
  background: var(--color-gray-200);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--color-gray-300);
}

@media (min-width: 768px) {
  .section-card {
    padding: var(--spacing-6);
  }
}
</style>
