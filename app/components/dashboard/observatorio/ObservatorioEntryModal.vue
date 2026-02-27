<script setup lang="ts">
/**
 * ObservatorioEntryModal — Add / Edit competitor vehicle modal.
 */
import type {
  CompetitorVehicle,
  CompetitorVehicleForm,
  Platform,
} from '~/composables/dashboard/useDashboardObservatorio'
import { STATUS_OPTIONS } from '~/composables/dashboard/useDashboardObservatorio'

const props = defineProps<{
  visible: boolean
  editingEntry: CompetitorVehicle | null
  form: CompetitorVehicleForm
  saving: boolean
  selectablePlatforms: Platform[]
}>()

const emit = defineEmits<{
  (e: 'close' | 'save'): void
  (e: 'update:form', value: CompetitorVehicleForm): void
}>()

const { t } = useI18n()

/** Helper to emit a partial form update without mutating the prop directly */
function updateField<K extends keyof CompetitorVehicleForm>(
  key: K,
  value: CompetitorVehicleForm[K],
): void {
  emit('update:form', { ...props.form, [key]: value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
      <div
        class="modal-content"
        role="dialog"
        :aria-label="
          editingEntry ? t('dashboard.observatory.editEntry') : t('dashboard.observatory.addEntry')
        "
      >
        <div class="modal-header">
          <h2>
            {{
              editingEntry
                ? t('dashboard.observatory.editEntry')
                : t('dashboard.observatory.addEntry')
            }}
          </h2>
          <button type="button" class="btn-close" @click="emit('close')">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <form class="modal-form" @submit.prevent="emit('save')">
          <div class="form-group">
            <label for="obs-platform">{{ t('dashboard.observatory.platform') }}</label>
            <select
              id="obs-platform"
              :value="form.platform_id"
              @change="updateField('platform_id', ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ t('dashboard.observatory.selectPlatform') }}</option>
              <option v-for="p in selectablePlatforms" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="obs-url">{{ t('dashboard.observatory.url') }}</label>
            <input
              id="obs-url"
              type="url"
              placeholder="https://..."
              :value="form.url"
              @input="updateField('url', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="obs-brand">{{ t('dashboard.observatory.brand') }} *</label>
              <input
                id="obs-brand"
                type="text"
                required
                :placeholder="t('dashboard.observatory.brandPlaceholder')"
                :value="form.brand"
                @input="updateField('brand', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-group">
              <label for="obs-model">{{ t('dashboard.observatory.model') }} *</label>
              <input
                id="obs-model"
                type="text"
                required
                :placeholder="t('dashboard.observatory.modelPlaceholder')"
                :value="form.model"
                @input="updateField('model', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="obs-year">{{ t('dashboard.observatory.year') }}</label>
              <input
                id="obs-year"
                type="number"
                min="1950"
                max="2030"
                :value="form.year"
                @input="updateField('year', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-group">
              <label for="obs-price">{{ t('dashboard.observatory.price') }}</label>
              <input
                id="obs-price"
                type="number"
                min="0"
                step="1"
                :value="form.price"
                @input="updateField('price', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="obs-location">{{ t('dashboard.observatory.location') }}</label>
            <input
              id="obs-location"
              type="text"
              :placeholder="t('dashboard.observatory.locationPlaceholder')"
              :value="form.location"
              @input="updateField('location', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="form-group">
            <label for="obs-status">{{ t('dashboard.observatory.statusLabel') }}</label>
            <select
              id="obs-status"
              :value="form.status"
              @change="
                updateField(
                  'status',
                  ($event.target as HTMLSelectElement).value as CompetitorVehicleForm['status'],
                )
              "
            >
              <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">
                {{ t(`dashboard.observatory.status.${s}`) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="obs-notes">{{ t('dashboard.observatory.notes') }}</label>
            <textarea
              id="obs-notes"
              rows="3"
              :placeholder="t('dashboard.observatory.notesPlaceholder')"
              :value="form.notes"
              @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="emit('close')">
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="saving || !form.brand.trim() || !form.model.trim()"
            >
              {{ saving ? t('common.loading') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-secondary:hover {
  background: #f8fafc;
}
</style>
