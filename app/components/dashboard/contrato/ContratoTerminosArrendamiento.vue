<script setup lang="ts">
/**
 * Contract Rental Terms Component
 * Displays rental-specific fields and purchase option
 */

type DurationUnit = 'meses' | 'anos'

interface Props {
  monthlyRent: number
  deposit: number
  paymentDays: number
  duration: number
  durationUnit: DurationUnit
  residualValue: number
  hasPurchaseOption: boolean
  purchasePrice: number
  purchaseNotice: number
  rentMonthsToDiscount: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:monthlyRent': [value: number]
  'update:deposit': [value: number]
  'update:paymentDays': [value: number]
  'update:duration': [value: number]
  'update:durationUnit': [value: DurationUnit]
  'update:residualValue': [value: number]
  'update:hasPurchaseOption': [value: boolean]
  'update:purchasePrice': [value: number]
  'update:purchaseNotice': [value: number]
  'update:rentMonthsToDiscount': [value: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="contrato-terminos-arrendamiento">
    <h4 class="section-subtitle">{{ t('dashboard.tools.contract.rentalTerms') }}</h4>

    <div class="form-grid-3">
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.monthlyRent') }}</label>
        <input
          :value="monthlyRent"
          type="number"
          step="100"
          @input="emit('update:monthlyRent', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.deposit') }}</label>
        <input
          :value="deposit"
          type="number"
          step="100"
          @input="emit('update:deposit', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.paymentDays') }}</label>
        <input
          :value="paymentDays"
          type="number"
          @input="emit('update:paymentDays', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.duration') }}</label>
        <input
          :value="duration"
          type="number"
          @input="emit('update:duration', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.durationUnit') }}</label>
        <select
          :value="durationUnit"
          @change="
            emit('update:durationUnit', ($event.target as HTMLSelectElement).value as DurationUnit)
          "
        >
          <option value="meses">
            {{ t('dashboard.tools.contract.months') }}
          </option>
          <option value="anos">
            {{ t('dashboard.tools.contract.years') }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.residualValue') }}</label>
        <input
          :value="residualValue"
          type="number"
          step="1000"
          @input="emit('update:residualValue', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
    </div>

    <!-- Purchase Option Toggle -->
    <div class="option-toggle">
      <label>
        <input
          :checked="hasPurchaseOption"
          type="checkbox"
          @change="emit('update:hasPurchaseOption', ($event.target as HTMLInputElement).checked)"
        >
        <span>{{ t('dashboard.tools.contract.includePurchaseOption') }}</span>
      </label>
    </div>

    <div v-if="hasPurchaseOption" class="form-grid-3 purchase-options">
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.purchasePrice') }}</label>
        <input
          :value="purchasePrice"
          type="number"
          step="1000"
          @input="emit('update:purchasePrice', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.purchaseNotice') }}</label>
        <input
          :value="purchaseNotice"
          type="number"
          @input="emit('update:purchaseNotice', Number(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.rentMonthsDiscount') }}</label>
        <input
          :value="rentMonthsToDiscount"
          type="number"
          @input="
            emit('update:rentMonthsToDiscount', Number(($event.target as HTMLInputElement).value))
          "
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrato-terminos-arrendamiento {
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

.option-toggle {
  margin: 16px 0;
}

.option-toggle label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  min-height: 44px;
}

.option-toggle input {
  width: 18px;
  height: 18px;
}

.purchase-options {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .form-grid-3 {
    grid-template-columns: 1fr;
  }

  .purchase-options {
    padding: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
