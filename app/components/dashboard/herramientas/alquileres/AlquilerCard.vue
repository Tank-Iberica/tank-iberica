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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-card);
  border-left: 0.25rem solid var(--color-gray-200);
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.rental-card.status-active {
  border-left-color: var(--color-success);
}

.rental-card.status-finished {
  border-left-color: var(--text-disabled);
}

.rental-card.status-overdue {
  border-left-color: var(--color-error);
}

.rental-card.ending-soon {
  background: var(--color-amber-50);
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

.card-vehicle {
  font-size: var(--font-size-base);
}

.year-tag {
  color: var(--text-disabled);
  font-size: 0.85rem;
  font-weight: 400;
}

.card-client {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.client-name {
  font-size: 0.9rem;
  color: var(--color-gray-700);
}

.client-contact {
  font-size: var(--font-size-sm);
  color: var(--text-disabled);
}

.card-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-disabled);
  text-transform: uppercase;
}

.detail-value {
  font-size: 0.85rem;
  color: var(--color-gray-700);
}

.detail-value.rent {
  font-weight: 700;
  color: var(--color-primary);
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

.card-notes {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  padding: 0.5rem 0.625rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-style: italic;
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
</style>
