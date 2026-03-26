<script setup lang="ts">
/**
 * Contract Sale Terms Component
 * Displays sale-specific fields
 */

interface Props {
  salePrice: number
  paymentMethod: string
  deliveryConditions: string
  warranty: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:salePrice': [value: number]
  'update:paymentMethod': [value: string]
  'update:deliveryConditions': [value: string]
  'update:warranty': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="contrato-terminos-compraventa">
    <h4 class="section-subtitle">{{ t('dashboard.tools.contract.saleTerms') }}</h4>

    <div class="form-grid-3">
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.salePrice') }}</label>
        <input
          :value="salePrice"
          type="number"
          step="1000"
          @input="emit('update:salePrice', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.paymentMethod') }}</label>
        <select
          :value="paymentMethod"
          @change="emit('update:paymentMethod', ($event.target as HTMLSelectElement).value)"
        >
          <option :value="t('dashboard.tools.contract.paymentBankTransfer')">
            {{ t('dashboard.tools.contract.paymentBankTransfer') }}
          </option>
          <option :value="t('dashboard.tools.contract.paymentCash')">
            {{ t('dashboard.tools.contract.paymentCash') }}
          </option>
          <option :value="t('dashboard.tools.contract.paymentCheck')">
            {{ t('dashboard.tools.contract.paymentCheck') }}
          </option>
          <option :value="t('dashboard.tools.contract.paymentFinancing')">
            {{ t('dashboard.tools.contract.paymentFinancing') }}
          </option>
        </select>
      </div>
      <div class="form-group" style="grid-column: 1 / -1">
        <label>{{ t('dashboard.tools.contract.deliveryConditions') }}</label>
        <input
          :value="deliveryConditions"
          type="text"
          :placeholder="t('dashboard.tools.contract.deliveryPlaceholder')"
          @input="emit('update:deliveryConditions', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group" style="grid-column: 1 / -1">
        <label>{{ t('dashboard.tools.contract.warranty') }}</label>
        <input
          :value="warranty"
          type="text"
          :placeholder="t('dashboard.tools.contract.warrantyPlaceholder')"
          @input="emit('update:warranty', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrato-terminos-compraventa {
  margin-bottom: 1.25rem;
}

.section-subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary-darker);
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 7.5rem;
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-group input,
.form-group select {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

@media (max-width: 48em) {
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 48.0625em) and (max-width: 48.0625em) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
