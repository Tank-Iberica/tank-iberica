<script setup lang="ts">
import type { SettingsField } from '~/composables/dashboard/useDashboardFactura'
import type { VehicleOption } from '~/composables/dashboard/useInvoice'

defineProps<{
  invoiceNumber: string
  invoiceDate: string
  invoiceLanguage: string
  invoiceConditions: string
  vehicleSearch: string
  showVehicleDropdown: boolean
  selectedVehicle: string
  filteredVehicles: VehicleOption[]
  loadingVehicles: boolean
}>()

const emit = defineEmits<{
  (e: 'update', field: SettingsField, value: string): void
  (e: 'select-vehicle', vehicle: VehicleOption): void
  (e: 'clear-vehicle' | 'open-dropdown' | 'blur-vehicle'): void
}>()

const { t } = useI18n()

function onInput(field: SettingsField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, target.value)
}

function onSelect(field: SettingsField, event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update', field, target.value)
}
</script>

<template>
  <fieldset class="form-section">
    <legend class="form-section__legend">
      {{ t('dashboard.tools.invoice.invoiceSettings') }}
    </legend>
    <div class="form-grid">
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.invoiceNumber') }}</label>
        <input
          type="text"
          class="form-field__input"
          :value="invoiceNumber"
          @input="onInput('invoiceNumber', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.invoiceDate') }}</label>
        <input
          type="date"
          class="form-field__input"
          :value="invoiceDate"
          @input="onInput('invoiceDate', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.language') }}</label>
        <select
          class="form-field__select"
          :value="invoiceLanguage"
          @change="onSelect('invoiceLanguage', $event)"
        >
          <option value="es">{{ t('dashboard.tools.invoice.langES') }}</option>
          <option value="en">{{ t('dashboard.tools.invoice.langEN') }}</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.conditions') }}</label>
        <input
          type="text"
          class="form-field__input"
          :value="invoiceConditions"
          @input="onInput('invoiceConditions', $event)"
        >
      </div>
      <div class="form-field form-field--full form-field--autocomplete">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.vehicle') }}</label>
        <div class="autocomplete-wrapper">
          <input
            type="text"
            class="form-field__input"
            :placeholder="t('dashboard.tools.invoice.vehiclePlaceholder')"
            :value="vehicleSearch"
            @input="onInput('vehicleSearch', $event)"
            @focus="emit('open-dropdown')"
            @blur="emit('blur-vehicle')"
          >
          <button
            v-if="selectedVehicle"
            class="autocomplete-clear"
            type="button"
            @click="emit('clear-vehicle')"
          >
            &times;
          </button>
          <ul
            v-if="showVehicleDropdown && filteredVehicles.length > 0"
            class="autocomplete-dropdown"
          >
            <li
              v-for="v in filteredVehicles"
              :key="v.id"
              class="autocomplete-dropdown__item"
              @mousedown.prevent="emit('select-vehicle', v)"
            >
              {{ v.label }}
            </li>
          </ul>
          <div
            v-if="showVehicleDropdown && filteredVehicles.length === 0 && vehicleSearch"
            class="autocomplete-dropdown autocomplete-dropdown--empty"
          >
            {{ t('dashboard.tools.invoice.noVehicles') }}
          </div>
          <div v-if="loadingVehicles" class="autocomplete-loading">
            {{ t('dashboard.tools.invoice.loading') }}...
          </div>
        </div>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section__legend {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.form-field__input,
.form-field__select {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  background: white;
  transition: border-color 0.2s;
  width: 100%;
}

.form-field__input:focus,
.form-field__select:focus {
  outline: none;
  border-color: var(--primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

/* Autocomplete */
.form-field--autocomplete {
  position: relative;
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  list-style: none;
  margin: 0;
  padding: 0;
}

.autocomplete-dropdown--empty {
  padding: 0.75rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.autocomplete-dropdown__item {
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.autocomplete-dropdown__item:hover {
  background: #f1f5f9;
}

.autocomplete-loading {
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .form-section {
    padding: 1.5rem;
  }
}
</style>
