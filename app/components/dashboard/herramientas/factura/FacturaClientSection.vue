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
  update: [field: ClientField, value: string]
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
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section__legend {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--primary, var(--color-primary));
  text-transform: uppercase;
  letter-spacing: 0.0313rem;
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
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.form-field__input,
.form-field__select {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: border-color 0.2s;
  width: 100%;
}

.form-field__input:focus,
.form-field__select:focus {
  outline: none;
  border-color: var(--primary, var(--color-primary));
  box-shadow: var(--shadow-ring-strong);
}

@media (min-width: 48em) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 64em) {
  .form-section {
    padding: 1.5rem;
  }
}
</style>
