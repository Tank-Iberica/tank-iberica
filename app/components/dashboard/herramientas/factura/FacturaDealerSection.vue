<script setup lang="ts">
import type { DealerField } from '~/composables/dashboard/useDashboardFactura'

defineProps<{
  companyName: string
  companyTaxId: string
  companyAddress1: string
  companyAddress2: string
  companyAddress3: string
  companyPhone: string
  companyEmail: string
}>()

const emit = defineEmits<{
  update: [field: DealerField, value: string]
}>()

const { t } = useI18n()

function onInput(field: DealerField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, target.value)
}
</script>

<template>
  <fieldset class="form-section">
    <legend class="form-section__legend">
      {{ t('dashboard.tools.invoice.dealerData') }}
    </legend>
    <div class="form-grid">
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.companyName') }}</label>
        <input
          type="text"
          class="form-field__input"
          :value="companyName"
          @input="onInput('companyName', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.taxId') }}</label>
        <input
          type="text"
          class="form-field__input"
          placeholder="B12345678"
          :value="companyTaxId"
          @input="onInput('companyTaxId', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.phone') }}</label>
        <input
          type="tel"
          class="form-field__input"
          :value="companyPhone"
          @input="onInput('companyPhone', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.email') }}</label>
        <input
          type="email"
          class="form-field__input"
          :value="companyEmail"
          @input="onInput('companyEmail', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 1</label>
        <input
          type="text"
          class="form-field__input"
          :value="companyAddress1"
          @input="onInput('companyAddress1', $event)"
        >
      </div>
      <div class="form-field">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 2</label>
        <input
          type="text"
          class="form-field__input"
          :value="companyAddress2"
          @input="onInput('companyAddress2', $event)"
        >
      </div>
      <div class="form-field form-field--full">
        <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 3</label>
        <input
          type="text"
          class="form-field__input"
          :value="companyAddress3"
          @input="onInput('companyAddress3', $event)"
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

.form-field__input {
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

.form-field__input:focus {
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
