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
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Caracteristica' : 'Nueva Caracteristica' }}</h3>
          <button class="modal-close" @click="emit('close')">&#xD7;</button>
        </div>

        <div class="modal-body">
          <!-- Names -->
          <div class="form-row">
            <div class="form-group">
              <label for="name">Nombre (ES) *</label>
              <input
                id="name"
                type="text"
                placeholder="Ej: Volumen"
                required
                :value="formData.name"
                @input="onTextInput('name', $event)"
              />
            </div>
            <div class="form-group">
              <label for="label_en">Nombre (EN)</label>
              <input
                id="label_en"
                type="text"
                placeholder="Ej: Volume"
                :value="formData.label_en"
                @input="onTextInput('label_en', $event)"
              />
            </div>
          </div>

          <!-- Type and Unit -->
          <div class="form-row">
            <div class="form-group">
              <label for="type">Tipo *</label>
              <select
                id="type"
                required
                :value="formData.type"
                @change="onSelectChange('type', $event)"
              >
                <option value="" disabled>Seleccionar</option>
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
              <label for="unit">Unidad de medida</label>
              <input
                id="unit"
                type="text"
                placeholder="Ej: Km, Kg, L, CV..."
                :value="formData.unit"
                @input="onTextInput('unit', $event)"
              />
            </div>
          </div>

          <!-- Extra filters (only for tick type) -->
          <div v-if="showTickOptions" class="form-group tick-options">
            <label>Extra caracteristicas (aparecen cuando este tick esta activo)</label>
            <div class="checkbox-grid extra-grid">
              <template v-if="availableFiltersForSelection.length">
                <label v-for="f in availableFiltersForSelection" :key="f.id" class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isChecked(formData.extra_filters, f.id)"
                    @change="onCheckboxToggle('extra_filters', f.id)"
                  />
                  <span>{{ f.label_es || f.name }}</span>
                </label>
              </template>
              <p v-else class="text-muted">No hay otras caracteristicas disponibles.</p>
            </div>
          </div>

          <!-- Hide filters (only for tick type) -->
          <div v-if="showTickOptions" class="form-group tick-options">
            <label>Ocultar caracteristicas (se ocultan cuando este tick esta activo)</label>
            <div class="checkbox-grid hide-grid">
              <template v-if="availableFiltersForSelection.length">
                <label v-for="f in availableFiltersForSelection" :key="f.id" class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isChecked(formData.hides, f.id)"
                    @change="onCheckboxToggle('hides', f.id)"
                  />
                  <span>{{ f.label_es || f.name }}</span>
                </label>
              </template>
              <p v-else class="text-muted">No hay otras caracteristicas disponibles.</p>
            </div>
          </div>

          <!-- Default value -->
          <div class="form-group">
            <label for="default_value">Valor por defecto</label>
            <input
              id="default_value"
              type="text"
              placeholder="Opcional"
              :value="formData.default_value"
              @input="onTextInput('default_value', $event)"
            />
          </div>

          <!-- Desplegable options -->
          <div v-if="showChoicesOptions" class="type-options-section">
            <h4 class="type-options-title">Opciones del desplegable</h4>

            <!-- Source selector -->
            <div class="form-group">
              <label>Origen de las opciones</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    name="choices_source"
                    value="manual"
                    :checked="formData.choices_source === 'manual'"
                    @change="onRadioChange('choices_source', 'manual')"
                  />
                  <span>Manual</span>
                  <small>Solo las opciones que definas aqui</small>
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    name="choices_source"
                    value="auto"
                    :checked="formData.choices_source === 'auto'"
                    @change="onRadioChange('choices_source', 'auto')"
                  />
                  <span>Automatico</span>
                  <small>Valores unicos de los vehiculos del catalogo</small>
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    name="choices_source"
                    value="both"
                    :checked="formData.choices_source === 'both'"
                    @change="onRadioChange('choices_source', 'both')"
                  />
                  <span>Ambos</span>
                  <small>Opciones manuales + valores de vehiculos</small>
                </label>
              </div>
            </div>

            <!-- Manual choices input -->
            <div v-if="formData.choices_source !== 'auto'" class="form-group">
              <label>Opciones manuales</label>
              <div class="choices-input-row">
                <input
                  type="text"
                  placeholder="Escribir opcion y pulsar Anadir"
                  :value="choiceInput"
                  @input="onChoiceInputChange"
                  @keydown="onChoiceKeydown"
                />
                <button type="button" class="btn-add-choice" @click="emit('add-choice')">
                  Anadir
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
              <p v-else class="text-muted">No hay opciones definidas.</p>
            </div>
          </div>

          <!-- Calc step -->
          <div v-if="showCalcOptions" class="type-options-section">
            <h4 class="type-options-title">Configuracion del calculador</h4>
            <div class="form-group">
              <label for="step">Paso (incremento/decremento)</label>
              <input
                id="step"
                type="number"
                min="1"
                placeholder="1"
                :value="formData.step"
                @input="onNumberInput('step', $event)"
              />
            </div>
          </div>

          <!-- Slider info -->
          <div v-if="showSliderInfo" class="type-options-section">
            <h4 class="type-options-title">Configuracion del slider</h4>
            <p class="type-options-info">
              El rango del slider se calcula automaticamente a partir de los valores minimo y maximo
              de los vehiculos visibles en el catalogo. No necesita configuracion manual.
            </p>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label for="status">Estado</label>
            <select id="status" :value="formData.status" @change="onSelectChange('status', $event)">
              <option v-for="s in filterStatuses" :key="s.value" :value="s.value">
                {{ s.label }} - {{ s.description }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button class="btn-primary" :disabled="saving" @click="emit('save')">
            {{ saving ? 'Guardando...' : 'Guardar' }}
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
  padding: 20px;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
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
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.type-options-section {
  margin-top: 8px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
}

.type-options-title {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.type-options-info {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-label input[type='radio'] {
  margin-top: 3px;
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
  color: #6b7280;
  margin-top: 2px;
}

.choices-input-row {
  display: flex;
  gap: 8px;
}

.choices-input-row input {
  flex: 1;
}

.btn-add-choice {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
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
  gap: 6px;
  margin-top: 8px;
}

.choice-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.choice-remove {
  background: none;
  border: none;
  color: var(--color-info);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  min-height: auto;
  min-width: auto;
}

.choice-remove:hover {
  color: var(--color-error);
}

.tick-options {
  margin-top: 8px;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
}

.extra-grid {
  background: #f0fff4;
}

.hide-grid {
  background: #fff5f5;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.text-muted {
  color: var(--text-disabled);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
}
</style>
