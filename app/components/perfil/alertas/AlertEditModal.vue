<script setup lang="ts">
import type { SearchAlert, AlertEditForm } from '~/composables/usePerfilAlertas'

defineProps<{
  visible: boolean
  targetAlert: SearchAlert | null
  editForm: AlertEditForm
}>()

const emit = defineEmits<{
  (e: 'close' | 'save'): void
  (e: 'update-field', field: string, value: string): void
}>()

function onFieldInput(field: string, event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-field', field, target.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && targetAlert" class="modal-overlay" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ $t('profile.alerts.editTitle') }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ $t('profile.alerts.frequency') }}</label>
            <div class="radio-group">
              <label v-for="freq in ['instant', 'daily', 'weekly']" :key="freq" class="radio-label">
                <input
                  type="radio"
                  :value="freq"
                  :checked="editForm.frequency === freq"
                  @change="emit('update-field', 'frequency', freq)"
                >
                {{ $t(`profile.alerts.freq_${freq}`) }}
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('profile.alerts.filterBrand') }}</label>
            <input
              type="text"
              class="form-input"
              :value="String(editForm.filters.brand ?? '')"
              @input="onFieldInput('brand', $event)"
            >
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label class="form-label">{{ $t('profile.alerts.filterPriceMin') }}</label>
              <input
                type="number"
                class="form-input"
                :value="editForm.filters.price_min ?? ''"
                @input="onFieldInput('price_min', $event)"
              >
            </div>
            <div class="form-group half">
              <label class="form-label">{{ $t('profile.alerts.filterPriceMax') }}</label>
              <input
                type="number"
                class="form-input"
                :value="editForm.filters.price_max ?? ''"
                @input="onFieldInput('price_max', $event)"
              >
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label class="form-label">{{ $t('profile.alerts.filterYearMin') }}</label>
              <input
                type="number"
                class="form-input"
                :value="editForm.filters.year_min ?? ''"
                @input="onFieldInput('year_min', $event)"
              >
            </div>
            <div class="form-group half">
              <label class="form-label">{{ $t('profile.alerts.filterYearMax') }}</label>
              <input
                type="number"
                class="form-input"
                :value="editForm.filters.year_max ?? ''"
                @input="onFieldInput('year_max', $event)"
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn-primary" @click="emit('save')">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color-light);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--text-auxiliary);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color-light);
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 0.375rem;
}

.form-input {
  display: block;
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  min-height: 44px;
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.form-group.half {
  flex: 1;
  min-width: 0;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
  min-height: 44px;
  padding: 0 0.25rem;
}

.radio-label input[type='radio'] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  min-height: 44px;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, var(--bg-secondary));
  border-color: var(--border-color);
}
</style>
