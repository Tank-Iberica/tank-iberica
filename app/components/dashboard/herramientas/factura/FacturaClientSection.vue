<script setup lang="ts">
import type { ClientField } from '~/composables/dashboard/useDashboardFactura'

defineProps<{
  clientName: string
  clientDocType: string
  clientDocNumber: string
  clientAddress1: string
  clientAddress2: string
  clientAddress3: string
}>()

const emit = defineEmits<{
  (e: 'update', field: ClientField, value: string): void
}>()

const { t } = useI18n()

function onInput(field: ClientField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, target.value)
}

function onSelect(field: ClientField, event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update', field, target.value)
}
</script>

<template>
  <fieldset class="form-section">
    <legend class="form-section__legend">
      {{ t('dashboard.tools.invoice.clientData') }}
    </legend>
    <div class="form-grid">
      <div class="form-field form-field--full">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.clientName') }} *</label>
        <input
          type="text"
          class="form-field__input"
          required
          :value="clientName"
          @input="onInput('clientName', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.docType') }}</label>
        <select
          class="form-field__select"
          :value="clientDocType"
          @change="onSelect('clientDocType', $event)"
        >
          <option value="NIF">NIF</option>
          <option value="DNI">DNI</option>
          <option value="CIF">CIF</option>
          <option value="Pasaporte">{{ t('dashboard.tools.invoice.passport') }}</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.docNumber') }}</label>
        <input
          type="text"
          class="form-field__input"
          :value="clientDocNumber"
          @input="onInput('clientDocNumber', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 1</label>
        <input
          type="text"
          class="form-field__input"
          :value="clientAddress1"
          @input="onInput('clientAddress1', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 2</label>
        <input
          type="text"
          class="form-field__input"
          :value="clientAddress2"
          @input="onInput('clientAddress2', $event)"
        >
      </div>
      <div class="form-field form-field--full">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 3</label>
        <input
          type="text"
          class="form-field__input"
          :value="clientAddress3"
          @input="onInput('clientAddress3', $event)"
        >
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
