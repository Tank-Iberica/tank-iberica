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
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #fff;
  border-radius: 12px 12px 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #9ca3af;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-head button:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 16px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: #f8fafc;
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
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
  gap: 6px;
  margin-bottom: 14px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.field-input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

textarea.field-input {
  resize: vertical;
  min-height: 80px;
}

.field-row {
  display: flex;
  gap: 12px;
}

.field-row .field {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  min-height: 44px;
}

.radio-label input {
  margin: 0;
  accent-color: var(--color-primary, #23424a);
}

@media (max-width: 767px) {
  .field-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
