<script setup lang="ts">
import type { OptionalService } from '~/composables/dashboard/useDashboardPresupuesto'

defineProps<{
  services: OptionalService[]
}>()

const emit = defineEmits<{
  (e: 'toggle', key: string, enabled: boolean): void
  (e: 'update-amount', key: string, amount: number): void
}>()

const { t } = useI18n()

function onToggle(service: OptionalService, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('toggle', service.key, target.checked)
}

function onAmountInput(service: OptionalService, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update-amount', service.key, Number(target.value) || 0)
}
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.quote.optionalServices') }}</h2>
    <div class="services-list">
      <div v-for="service in services" :key="service.key" class="service-row">
        <label class="service-checkbox">
          <input type="checkbox" :checked="service.enabled" @change="onToggle(service, $event)" >
          <span class="service-label">{{ t(service.labelKey) }}</span>
        </label>
        <div v-if="service.isQuoteOnly" class="service-amount-text">
          {{ t('dashboard.quote.insuranceQuote') }}
        </div>
        <div v-else class="service-amount-input">
          <input
            type="number"
            min="0"
            step="50"
            class="input-small"
            :value="service.amount"
            @input="onAmountInput(service, $event)"
          >
          <span class="currency-symbol">&euro;</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

/* Services */
.services-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.service-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-height: 44px;
  flex: 1;
  min-width: 0;
}

.service-checkbox input[type='checkbox'] {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary, #23424a);
  cursor: pointer;
  flex-shrink: 0;
}

.service-label {
  font-size: 0.95rem;
  color: #1e293b;
}

.service-amount-input {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.input-small {
  width: 90px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: right;
  min-height: 44px;
  color: #1e293b;
}

.input-small:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.currency-symbol {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.service-amount-text {
  font-size: 0.85rem;
  color: #3b82f6;
  font-weight: 500;
  font-style: italic;
  flex-shrink: 0;
}
</style>
