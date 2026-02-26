<script setup lang="ts">
/**
 * Single rental card for the cards view.
 * Displays vehicle, client, details, and actions.
 */
import type { RentalRecord, RentalStatus } from '~/composables/dashboard/useDashboardAlquileres'

const props = defineProps<{
  record: RentalRecord
  isEndingSoon: (record: RentalRecord) => boolean
  daysUntilEnd: (record: RentalRecord) => number
  getStatusClass: (status: RentalStatus) => string
  fmt: (val: number) => string
  fmtDate: (date: string | null) => string
}>()

const emit = defineEmits<{
  edit: [record: RentalRecord]
  delete: [record: RentalRecord]
}>()

const { t } = useI18n()

const r = computed(() => props.record)
</script>

<template>
  <div
    class="rental-card"
    :class="{ 'ending-soon': isEndingSoon(r), [getStatusClass(r.status)]: true }"
  >
    <!-- Status badge -->
    <div class="card-top">
      <span class="status-badge" :class="getStatusClass(r.status)">
        {{ t(`dashboard.tools.rentals.statuses.${r.status}`) }}
      </span>
      <div class="card-actions">
        <button
          class="btn-icon"
          :title="t('dashboard.tools.rentals.edit')"
          @click="emit('edit', r)"
        >
          &#9998;
        </button>
        <button
          class="btn-icon delete"
          :title="t('dashboard.tools.rentals.delete')"
          @click="emit('delete', r)"
        >
          &#128465;
        </button>
      </div>
    </div>

    <!-- Vehicle info -->
    <div class="card-vehicle">
      <strong>{{ r.vehicle_brand }} {{ r.vehicle_model }}</strong>
      <span v-if="r.vehicle_year" class="year-tag">({{ r.vehicle_year }})</span>
    </div>

    <!-- Client -->
    <div class="card-client">
      <span class="client-name">{{ r.client_name }}</span>
      <span v-if="r.client_contact" class="client-contact">{{ r.client_contact }}</span>
    </div>

    <!-- Details grid -->
    <div class="card-details">
      <div class="detail">
        <span class="detail-label">{{ t('dashboard.tools.rentals.table.monthlyRent') }}</span>
        <span class="detail-value rent"
          >{{ fmt(r.monthly_rent) }}/{{ t('dashboard.tools.rentals.month') }}</span
        >
      </div>
      <div class="detail">
        <span class="detail-label">{{ t('dashboard.tools.rentals.table.deposit') }}</span>
        <span class="detail-value">{{ r.deposit ? fmt(r.deposit) : '--' }}</span>
      </div>
      <div class="detail">
        <span class="detail-label">{{ t('dashboard.tools.rentals.table.startDate') }}</span>
        <span class="detail-value">{{ fmtDate(r.start_date) }}</span>
      </div>
      <div class="detail">
        <span class="detail-label">{{ t('dashboard.tools.rentals.table.endDate') }}</span>
        <span class="detail-value" :class="{ 'ending-text': isEndingSoon(r) }">
          {{ fmtDate(r.end_date) }}
          <span v-if="isEndingSoon(r)" class="ending-badge"> {{ daysUntilEnd(r) }}d </span>
        </span>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="r.notes" class="card-notes">
      {{ r.notes }}
    </div>
  </div>
</template>

<style scoped>
.rental-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rental-card.status-active {
  border-left-color: #22c55e;
}

.rental-card.status-finished {
  border-left-color: #94a3b8;
}

.rental-card.status-overdue {
  border-left-color: #ef4444;
}

.rental-card.ending-soon {
  background: #fffbeb;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 0;
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

.card-vehicle {
  font-size: 1rem;
}

.year-tag {
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 400;
}

.card-client {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-name {
  font-size: 0.9rem;
  color: #374151;
}

.client-contact {
  font-size: 0.8rem;
  color: #9ca3af;
}

.card-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
}

.detail-value {
  font-size: 0.85rem;
  color: #374151;
}

.detail-value.rent {
  font-weight: 700;
  color: var(--color-primary, #23424a);
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

.card-notes {
  font-size: 0.8rem;
  color: #6b7280;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-style: italic;
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
</style>
