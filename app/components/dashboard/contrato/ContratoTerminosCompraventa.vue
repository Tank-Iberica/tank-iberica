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
          <option>Transferencia bancaria</option>
          <option>Efectivo</option>
          <option>Cheque</option>
          <option>Financiacion</option>
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
  margin-bottom: 20px;
}

.section-subtitle {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f2a2e;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

@media (max-width: 768px) {
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
