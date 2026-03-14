<script setup lang="ts">
/**
 * Create/Edit form modal for rental records.
 * Teleported to body for proper stacking context.
 *
 * Uses emit-based updates to avoid mutating props directly.
 */
import type {
  DealerVehicleOption,
  RentalFormData,
} from '~/composables/dashboard/useDashboardAlquileres'

const props = defineProps<{
  show: boolean
  editingId: string | null
  form: RentalFormData
  vehicleOptions: DealerVehicleOption[]
  isFormValid: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
  close: []
  'update:form': [value: RentalFormData]
}>()

const { t } = useI18n()

function updateField<K extends keyof RentalFormData>(key: K, value: RentalFormData[K]) {
  emit('update:form', { ...props.form, [key]: value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>
            {{
              editingId
                ? t('dashboard.tools.rentals.editTitle')
                : t('dashboard.tools.rentals.createTitle')
            }}
          </span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Vehicle -->
          <div class="field">
            <label>{{ t('dashboard.tools.rentals.form.vehicle') }} *</label>
            <select
              :value="form.vehicle_id"
              class="field-input"
              @change="updateField('vehicle_id', ($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>
                {{ t('dashboard.tools.rentals.form.selectVehicle') }}
              </option>
              <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">
                {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
              </option>
            </select>
          </div>

          <!-- Client name & contact -->
          <div class="field-row">
            <div class="field">
              <label>{{ t('dashboard.tools.rentals.form.clientName') }} *</label>
              <input
                :value="form.client_name"
                type="text"
                class="field-input"
                :placeholder="t('dashboard.tools.rentals.form.clientNamePlaceholder')"
                @input="updateField('client_name', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="field">
              <label>{{ t('dashboard.tools.rentals.form.clientContact') }}</label>
              <input
                :value="form.client_contact"
                type="text"
                class="field-input"
                :placeholder="t('dashboard.tools.rentals.form.clientContactPlaceholder')"
                @input="updateField('client_contact', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <!-- Dates -->
          <div class="field-row">
            <div class="field">
              <label>{{ t('dashboard.tools.rentals.form.startDate') }} *</label>
              <input
                :value="form.start_date"
                type="date"
                class="field-input"
                @input="updateField('start_date', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="field">
              <label>{{ t('dashboard.tools.rentals.form.endDate') }}</label>
              <input
                :value="form.end_date"
                type="date"
                class="field-input"
                @input="updateField('end_date', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <!-- Money -->
          <div class="field-row">
            <div class="field">
              <label>{{ t('dashboard.tools.rentals.form.monthlyRent') }} *</label>
              <input
                :value="form.monthly_rent"
                type="number"
                min="0"
                step="0.01"
                class="field-input"
                placeholder="0.00"
                @input="
                  updateField('monthly_rent', Number(($event.target as HTMLInputElement).value))
                "
              >
            </div>
            <div class="field">
              <label>{{ t('dashboard.tools.rentals.form.deposit') }}</label>
              <input
                :value="form.deposit"
                type="number"
                min="0"
                step="0.01"
                class="field-input"
                placeholder="0.00"
                @input="updateField('deposit', Number(($event.target as HTMLInputElement).value))"
              >
            </div>
          </div>

          <!-- Status -->
          <div class="field">
            <label>{{ t('dashboard.tools.rentals.form.status') }} *</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  :checked="form.status === 'active'"
                  type="radio"
                  name="rental-status"
                  value="active"
                  @change="updateField('status', 'active')"
                >
                {{ t('dashboard.tools.rentals.statuses.active') }}
              </label>
              <label class="radio-label">
                <input
                  :checked="form.status === 'finished'"
                  type="radio"
                  name="rental-status"
                  value="finished"
                  @change="updateField('status', 'finished')"
                >
                {{ t('dashboard.tools.rentals.statuses.finished') }}
              </label>
              <label class="radio-label">
                <input
                  :checked="form.status === 'overdue'"
                  type="radio"
                  name="rental-status"
                  value="overdue"
                  @change="updateField('status', 'overdue')"
                >
                {{ t('dashboard.tools.rentals.statuses.overdue') }}
              </label>
            </div>
          </div>

          <!-- Notes -->
          <div class="field">
            <label>{{ t('dashboard.tools.rentals.form.notes') }}</label>
            <textarea
              :value="form.notes"
              rows="3"
              class="field-input"
              :placeholder="t('dashboard.tools.rentals.form.notesPlaceholder')"
              @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.tools.rentals.form.cancel') }}
          </button>
          <button class="btn btn-primary" :disabled="!isFormValid || saving" @click="emit('save')">
            <span v-if="saving" class="spinner-sm" />
            {{
              editingId
                ? t('dashboard.tools.rentals.form.update')
                : t('dashboard.tools.rentals.form.save')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 35rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-disabled);
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.modal-head button:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1rem;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  position: sticky;
  bottom: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm {
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: var(--border-radius-full);
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Form fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
}

.field label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
}

.field-input {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background: var(--bg-primary);
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

textarea.field-input {
  resize: vertical;
  min-height: 5rem;
}

.field-row {
  display: flex;
  gap: 0.75rem;
}

.field-row .field {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.radio-label input {
  margin: 0;
  accent-color: var(--color-primary);
}

(@media ()max-width: 47.9375em())) {
  .field-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
