<script setup lang="ts">
import type { VisitSlot, SlotFormData } from '~/composables/dashboard/useDashboardVisitas'
import { DAYS_KEYS } from '~/composables/dashboard/useDashboardVisitas'

const { t } = useI18n()

defineProps<{
  sortedSlots: VisitSlot[]
  formData: SlotFormData
  isFormValid: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'add-slot'): void
  (e: 'delete-slot', slotId: string): void
  (e: 'update-form', field: keyof SlotFormData, value: string | number): void
}>()

function getDayLabel(dayNum: number): string {
  const key = DAYS_KEYS[dayNum - 1]
  return key ? t(key) : String(dayNum)
}

function onFieldChange(field: keyof SlotFormData, event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  const value =
    field === 'day_of_week' || field === 'max_visitors' ? Number(target.value) : target.value
  emit('update-form', field, value)
}
</script>

<template>
  <section class="section-card">
    <h2 class="section-title">{{ t('visits.slotsConfig') }}</h2>

    <!-- Add Slot Form -->
    <div class="slot-form">
      <div class="slot-form-fields">
        <div class="field">
          <label>{{ t('visits.dayOfWeek') }}</label>
          <select
            class="field-input"
            :value="formData.day_of_week"
            @change="onFieldChange('day_of_week', $event)"
          >
            <option v-for="(dayKey, idx) in DAYS_KEYS" :key="idx" :value="idx + 1">
              {{ t(dayKey) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>{{ t('visits.startTime') }}</label>
          <input
            type="time"
            class="field-input"
            :value="formData.start_time"
            @input="onFieldChange('start_time', $event)"
          >
        </div>
        <div class="field">
          <label>{{ t('visits.endTime') }}</label>
          <input
            type="time"
            class="field-input"
            :value="formData.end_time"
            @input="onFieldChange('end_time', $event)"
          >
        </div>
        <div class="field">
          <label>{{ t('visits.maxVisitors') }}</label>
          <input
            type="number"
            min="1"
            max="100"
            class="field-input"
            :value="formData.max_visitors"
            @input="onFieldChange('max_visitors', $event)"
          >
        </div>
      </div>
      <button class="btn-primary" :disabled="!isFormValid || saving" @click="emit('add-slot')">
        <span v-if="saving" class="spinner-sm" />
        {{ t('visits.addSlot') }}
      </button>
    </div>

    <!-- Existing Slots -->
    <div v-if="sortedSlots.length === 0" class="empty-state">
      <p>{{ t('visits.noSlots') }}</p>
    </div>

    <div v-else class="slots-list">
      <div v-for="slot in sortedSlots" :key="slot.id" class="slot-item">
        <div class="slot-info">
          <span class="slot-day">{{ getDayLabel(slot.day_of_week) }}</span>
          <span class="slot-time">{{ slot.start_time }} - {{ slot.end_time }}</span>
          <span class="slot-capacity">
            {{ t('visits.maxVisitors') }}: {{ slot.max_visitors }}
          </span>
        </div>
        <button
          class="btn-icon delete"
          :title="t('visits.deleteSlot')"
          :disabled="saving"
          @click="emit('delete-slot', slot.id)"
        >
          &times;
        </button>
      </div>
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

/* Slot form */
.slot-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
}

.slot-form-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.field label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
}

.field-input {
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Slots list */
.slots-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
}

.slot-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  align-items: center;
}

.slot-day {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  min-width: 80px;
}

.slot-time {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-family: monospace;
}

.slot-capacity {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
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

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-5);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  gap: var(--spacing-1);
  align-self: flex-start;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-xl);
  border-radius: var(--border-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.btn-icon:hover {
  background: var(--color-gray-100);
}

.btn-icon.delete:hover {
  background: #fee2e2;
  color: var(--color-error);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive: 480px */
@media (min-width: 480px) {
  .slot-form-fields {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive: 768px */
@media (min-width: 768px) {
  .slot-form-fields {
    grid-template-columns: repeat(4, 1fr);
  }

  .slot-form {
    flex-direction: row;
    align-items: flex-end;
  }

  .slot-form-fields {
    flex: 1;
  }

  .section-card {
    padding: var(--spacing-6);
  }
}
</style>
