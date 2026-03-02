<script setup lang="ts">
/**
 * Create/Edit form modal for maintenance records.
 * Teleported to body for proper stacking context.
 *
 * Uses emit-based updates to avoid mutating props directly.
 */
import type {
  DealerVehicleOption,
  MaintenanceFormData,
} from '~/composables/dashboard/useDashboardMantenimientos'

const props = defineProps<{
  show: boolean
  editingId: string | null
  form: MaintenanceFormData
  vehicleOptions: DealerVehicleOption[]
  isFormValid: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
  close: []
  'update:form': [value: MaintenanceFormData]
}>()

const { t } = useI18n()

function updateField<K extends keyof MaintenanceFormData>(key: K, value: MaintenanceFormData[K]) {
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
                ? t('dashboard.tools.maintenance.editTitle')
                : t('dashboard.tools.maintenance.createTitle')
            }}
          </span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Vehicle -->
          <div class="field">
            <label>{{ t('dashboard.tools.maintenance.form.vehicle') }} *</label>
            <select
              :value="form.vehicle_id"
              class="field-input"
              @change="updateField('vehicle_id', ($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>
                {{ t('dashboard.tools.maintenance.form.selectVehicle') }}
              </option>
              <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">
                {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
              </option>
            </select>
          </div>

          <!-- Date -->
          <div class="field">
            <label>{{ t('dashboard.tools.maintenance.form.date') }} *</label>
            <input
              :value="form.date"
              type="date"
              class="field-input"
              @input="updateField('date', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Type -->
          <div class="field">
            <label>{{ t('dashboard.tools.maintenance.form.type') }} *</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  :checked="form.type === 'preventivo'"
                  type="radio"
                  name="maintenance-type"
                  value="preventivo"
                  @change="updateField('type', 'preventivo')"
                >
                {{ t('dashboard.tools.maintenance.types.preventivo') }}
              </label>
              <label class="radio-label">
                <input
                  :checked="form.type === 'correctivo'"
                  type="radio"
                  name="maintenance-type"
                  value="correctivo"
                  @change="updateField('type', 'correctivo')"
                >
                {{ t('dashboard.tools.maintenance.types.correctivo') }}
              </label>
              <label class="radio-label">
                <input
                  :checked="form.type === 'itv'"
                  type="radio"
                  name="maintenance-type"
                  value="itv"
                  @change="updateField('type', 'itv')"
                >
                {{ t('dashboard.tools.maintenance.types.itv') }}
              </label>
            </div>
          </div>

          <!-- Description -->
          <div class="field">
            <label>{{ t('dashboard.tools.maintenance.form.description') }} *</label>
            <textarea
              :value="form.description"
              rows="3"
              class="field-input"
              :placeholder="t('dashboard.tools.maintenance.form.descriptionPlaceholder')"
              @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <!-- Cost & Km -->
          <div class="field-row">
            <div class="field">
              <label>{{ t('dashboard.tools.maintenance.form.cost') }} *</label>
              <input
                :value="form.cost"
                type="number"
                min="0"
                step="0.01"
                class="field-input"
                placeholder="0.00"
                @input="
                  updateField('cost', Number(($event.target as HTMLInputElement).value) || null)
                "
              >
            </div>

            <div class="field">
              <label>{{ t('dashboard.tools.maintenance.form.km') }}</label>
              <input
                :value="form.km"
                type="number"
                min="0"
                class="field-input"
                placeholder="0"
                @input="
                  updateField('km', Number(($event.target as HTMLInputElement).value) || null)
                "
              >
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.tools.maintenance.form.cancel') }}
          </button>
          <button class="btn btn-primary" :disabled="!isFormValid || saving" @click="emit('save')">
            <span v-if="saving" class="spinner-sm" />
            {{
              editingId
                ? t('dashboard.tools.maintenance.form.update')
                : t('dashboard.tools.maintenance.form.save')
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
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
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
  background: var(--bg-primary);
  border-radius: 12px 12px 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-disabled);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-head button:hover {
  background: var(--bg-secondary);
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
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.875rem;
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
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary);
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
  background: var(--color-primary-dark);
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
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
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
  accent-color: var(--color-primary);
}

@media (max-width: 767px) {
  .field-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
