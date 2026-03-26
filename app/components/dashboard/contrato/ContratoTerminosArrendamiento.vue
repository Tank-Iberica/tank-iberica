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

.option-toggle {
  margin: 1rem 0;
}

.option-toggle label {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.option-toggle input {
  width: 1.125rem;
  height: 1.125rem;
}

.purchase-options {
  background: var(--color-gray-50);
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-top: 0.75rem;
}

@media (max-width: 48em) {
  .form-grid-3 {
    grid-template-columns: 1fr;
  }

  .purchase-options {
    padding: 0.75rem;
  }
}

@media (min-width: 48.0625em) and (max-width: 48.0625em) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
