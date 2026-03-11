<script setup lang="ts">
import type {
  FilterFormData,
  FilterType,
  FilterStatus,
  AdminFilter,
} from '~/composables/admin/useAdminFilters'

defineProps<{
  show: boolean
  editingId: string | null
  formData: FilterFormData
  choiceInput: string
  saving: boolean
  showTickOptions: boolean
  showChoicesOptions: boolean
  showCalcOptions: boolean
  showSliderInfo: boolean
  availableFiltersForSelection: AdminFilter[]
  filterTypes: { value: FilterType; label: string; description: string }[]
  filterStatuses: { value: FilterStatus; label: string; description: string }[]
}>()

const emit = defineEmits<{
  (e: 'close' | 'save' | 'add-choice'): void
  (e: 'update-field', field: keyof FilterFormData, value: string | number | boolean | null): void
  (e: 'toggle-array-item', field: 'extra_filters' | 'hides', id: string): void
  (e: 'update-choice-input', value: string): void
  (e: 'remove-choice', index: number): void
}>()

function onTextInput(field: keyof FilterFormData, event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-field', field, target.value)
}

function onSelectChange(field: keyof FilterFormData, event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update-field', field, target.value)
}

function onRadioChange(field: keyof FilterFormData, value: string) {
  emit('update-field', field, value)
}

function onNumberInput(field: keyof FilterFormData, event: Event) {
  const target = event.target as HTMLInputElement
  const num = target.value === '' ? null : Number(target.value)
  emit('update-field', field, num)
}

function onChoiceInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-choice-input', target.value)
}

function onChoiceKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('add-choice')
  }
}

function onCheckboxToggle(field: 'extra_filters' | 'hides', id: string) {
  emit('toggle-array-item', field, id)
}

function isChecked(arr: string[], id: string): boolean {
  return arr.includes(id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? $t('admin.config.editCharacteristic') : $t('admin.config.newCharacteristic') }}</h3>
          <button class="modal-close" @click="emit('close')">&#xD7;</button>
        </div>

        <div class="modal-body">
          <!-- Names -->
          <div class="form-row">
            <div class="form-group">
              <label for="name">{{ $t('admin.config.nameEs') }} *</label>
              <input
                id="name"
                type="text"
                placeholder="Ej: Volumen"
                required
                :value="formData.name"
                @input="onTextInput('name', $event)"
              >
            </div>
            <div class="form-group">
              <label for="label_en">{{ $t('admin.config.nameEn') }}</label>
              <input
                id="label_en"
                type="text"
                placeholder="Ej: Volume"
                :value="formData.label_en"
                @input="onTextInput('label_en', $event)"
              >
            </div>
          </div>

          <!-- Type and Unit -->
          <div class="form-row">
            <div class="form-group">
              <label for="type">{{ $t('admin.config.typeLabel') }} *</label>
              <select
                id="type"
                required
                :value="formData.type"
                @change="onSelectChange('type', $event)"
              >
                <option value="" disabled>{{ $t('admin.config.selectType') }}</option>
                <option
                  v-for="filterType in filterTypes"
                  :key="filterType.value"
                  :value="filterType.value"
                >
                  {{ filterType.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="unit">{{ $t('admin.config.unitLabel') }}</label>
              <input
                id="unit"
                type="text"
                placeholder="Ej: Km, Kg, L, CV..."
                :value="formData.unit"
                @input="onTextInput('unit', $event)"
              >
            </div>
          </div>

          <!-- Extra filters (only for tick type) -->
          <div v-if="showTickOptions" class="form-group tick-options">
            <label>{{ $t('admin.config.extraFilters') }}</label>
            <div class="checkbox-grid extra-grid">
              <template v-if="availableFiltersForSelection.length">
                <label v-for="f in availableFiltersForSelection" :key="f.id" class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isChecked(formData.extra_filters, f.id)"
                    @change="onCheckboxToggle('extra_filters', f.id)"
                  >
                  <span>{{ f.label_es || f.name }}</span>
                </label>
              </template>
              <p v-else class="text-muted">{{ $t('admin.config.noOtherFilters') }}</p>
            </div>
          </div>

          <!-- Hide filters (only for tick type) -->
          <div v-if="showTickOptions" class="form-group tick-options">
            <label>{{ $t('admin.config.hideFilters') }}</label>
            <div class="checkbox-grid hide-grid">
              <template v-if="availableFiltersForSelection.length">
                <label v-for="f in availableFiltersForSelection" :key="f.id" class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isChecked(formData.hides, f.id)"
                    @change="onCheckboxToggle('hides', f.id)"
                  >
                  <span>{{ f.label_es || f.name }}</span>
                </label>
              </template>
              <p v-else class="text-muted">{{ $t('admin.config.noOtherFilters') }}</p>
            </div>
          </div>

          <!-- Default value -->
          <div class="form-group">
            <label for="default_value">{{ $t('admin.config.defaultValue') }}</label>
            <input
              id="default_value"
              type="text"
              placeholder="Opcional"
              :value="formData.default_value"
              @input="onTextInput('default_value', $event)"
            >
          </div>

          <!-- Desplegable options -->
          <div v-if="showChoicesOptions" class="type-options-section">
            <h4 class="type-options-title">{{ $t('admin.config.dropdownOptions') }}</h4>

            <!-- Source selector -->
            <div class="form-group">
              <label>{{ $t('admin.config.optionsSource') }}</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    name="choices_source"
                    value="manual"
                    :checked="formData.choices_source === 'manual'"
                    @change="onRadioChange('choices_source', 'manual')"
                  >
                  <span>{{ $t('admin.config.sourceManual') }}</span>
                  <small>{{ $t('admin.config.sourceManualDesc') }}</small>
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    name="choices_source"
                    value="auto"
                    :checked="formData.choices_source === 'auto'"
                    @change="onRadioChange('choices_source', 'auto')"
                  >
                  <span>{{ $t('admin.config.sourceAuto') }}</span>
                  <small>{{ $t('admin.config.sourceAutoDesc') }}</small>
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    name="choices_source"
                    value="both"
                    :checked="formData.choices_source === 'both'"
                    @change="onRadioChange('choices_source', 'both')"
                  >
                  <span>{{ $t('admin.config.sourceBoth') }}</span>
                  <small>{{ $t('admin.config.sourceBothDesc') }}</small>
                </label>
              </div>
            </div>

            <!-- Manual choices input -->
            <div v-if="formData.choices_source !== 'auto'" class="form-group">
              <label>{{ $t('admin.config.manualOptions') }}</label>
              <div class="choices-input-row">
                <input
                  type="text"
                  :placeholder="$t('admin.config.typeAndAdd')"
                  :value="choiceInput"
                  @input="onChoiceInputChange"
                  @keydown="onChoiceKeydown"
                >
                <button type="button" class="btn-add-choice" @click="emit('add-choice')">
                  {{ $t('admin.config.addOption') }}
                </button>
              </div>
              <div v-if="formData.choices.length" class="choices-list">
                <span v-for="(choice, idx) in formData.choices" :key="idx" class="choice-chip">
                  {{ choice }}
                  <button type="button" class="choice-remove" @click="emit('remove-choice', idx)">
                    &#xD7;
                  </button>
                </span>
              </div>
              <p v-else class="text-muted">{{ $t('admin.config.noOptionsDefined') }}</p>
            </div>
          </div>

          <!-- Calc step -->
          <div v-if="showCalcOptions" class="type-options-section">
            <h4 class="type-options-title">{{ $t('admin.config.calcConfig') }}</h4>
            <div class="form-group">
              <label for="step">{{ $t('admin.config.calcStep') }}</label>
              <input
                id="step"
                type="number"
                min="1"
                placeholder="1"
                :value="formData.step"
                @input="onNumberInput('step', $event)"
              >
            </div>
          </div>

          <!-- Slider info -->
          <div v-if="showSliderInfo" class="type-options-section">
            <h4 class="type-options-title">{{ $t('admin.config.sliderConfig') }}</h4>
            <p class="type-options-info">
              {{ $t('admin.config.sliderAutoRange') }}
            </p>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label for="status">{{ $t('common.status') }}</label>
            <select id="status" :value="formData.status" @change="onSelectChange('status', $event)">
              <option v-for="s in filterStatuses" :key="s.value" :value="s.value">
                {{ s.label }} - {{ s.description }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn-primary" :disabled="saving" @click="emit('save')">
            {{ saving ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
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
  padding: 1.25rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 34.375rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-500);
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-gray-700);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--bg-tertiary);
  background: var(--color-gray-50);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--border-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.type-options-section {
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
}

.type-options-title {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.type-options-info {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-gray-500);
  line-height: 1.5;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-label input[type='radio'] {
  margin-top: 0.1875rem;
  width: auto;
  min-height: auto;
  min-width: auto;
}

.radio-label span {
  font-weight: 500;
}

.radio-label small {
  display: block;
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-top: 0.125rem;
}

.choices-input-row {
  display: flex;
  gap: var(--spacing-2);
}

.choices-input-row input {
  flex: 1;
}

.btn-add-choice {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.btn-add-choice:hover {
  background: var(--color-primary-dark);
}

.choices-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: var(--spacing-2);
}

.choice-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
}

.choice-remove {
  background: none;
  border: none;
  color: var(--color-info);
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  padding: 0 0.125rem;
  min-height: auto;
  min-width: auto;
}

.choice-remove:hover {
  color: var(--color-error);
}

.tick-options {
  margin-top: var(--spacing-2);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.75rem, 1fr));
  gap: 0.5rem;
  max-height: 9.375rem;
  overflow-y: auto;
  padding: 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
}

.extra-grid {
  background: var(--color-green-50);
}

.hide-grid {
  background: var(--color-red-50);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.85rem;
}

.checkbox-label input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.text-muted {
  color: var(--text-disabled);
  font-size: 0.875rem;
}

@media (max-width: 48em) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 0.625rem;
    max-height: calc(100vh - 1.25rem);
  }
}
</style>
