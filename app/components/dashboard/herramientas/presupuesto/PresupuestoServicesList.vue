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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.form-section h2 {
  margin: 0 0 0.75rem 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

/* Services */
.services-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}

.service-checkbox {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  min-height: 2.75rem;
  flex: 1;
  min-width: 0;
}

.service-checkbox input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.service-label {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.service-amount-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.input-small {
  width: 5.625rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  text-align: right;
  min-height: 2.75rem;
  color: var(--text-primary);
}

.input-small:focus {
  outline: none;
  border-color: var(--color-primary);
}

.currency-symbol {
  color: var(--text-auxiliary);
  font-size: 0.9rem;
  font-weight: 500;
}

.service-amount-text {
  font-size: 0.85rem;
  color: var(--color-info);
  font-weight: 500;
  font-style: italic;
  flex-shrink: 0;
}
</style>
