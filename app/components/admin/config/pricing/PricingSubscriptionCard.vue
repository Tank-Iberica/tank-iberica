<script setup lang="ts">
import type { PlanDefinition } from '~/composables/admin/useAdminConfigPricing'

defineProps<{
  planDefinitions: PlanDefinition[]
  subscriptionPrices: Record<string, { monthly: number; annual: number }>
  savingPrices: boolean
  successPrices: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (
    e: 'update-price',
    payload: { planKey: string; field: 'monthly' | 'annual'; value: number },
  ): void
}>()

const { t } = useI18n()

function onInput(planKey: string, field: 'monthly' | 'annual', event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-price', { planKey, field, value: Number(target.value) })
}
</script>

<template>
  <div class="config-card">
    <h2 class="card-title">{{ t('admin.configPricing.subscriptionPricesTitle') }}</h2>
    <p class="card-description">{{ t('admin.configPricing.subscriptionPricesDesc') }}</p>

    <div class="pricing-table-wrapper">
      <table class="pricing-table">
        <thead>
          <tr>
            <th>{{ t('admin.configPricing.plan') }}</th>
            <th>{{ t('admin.configPricing.monthlyPrice') }}</th>
            <th>{{ t('admin.configPricing.annualPrice') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="plan in planDefinitions"
            :key="plan.key"
            :class="{ 'row-readonly': plan.readonly }"
          >
            <td class="plan-name">
              {{ t(plan.labelKey) }}
              <span v-if="plan.readonly" class="plan-free-tag">{{
                t('admin.configPricing.alwaysFree')
              }}</span>
            </td>
            <td>
              <div v-if="plan.readonly" class="price-readonly">0,00 &euro;</div>
              <div v-else class="input-euro">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="price-input"
                  :value="subscriptionPrices[plan.key]?.monthly ?? 0"
                  @input="onInput(plan.key, 'monthly', $event)"
                >
                <span class="euro-symbol">&euro;/{{ t('admin.configPricing.month') }}</span>
              </div>
            </td>
            <td>
              <div v-if="plan.readonly" class="price-readonly">0,00 &euro;</div>
              <div v-else class="input-euro">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="price-input"
                  :value="subscriptionPrices[plan.key]?.annual ?? 0"
                  @input="onInput(plan.key, 'annual', $event)"
                >
                <span class="euro-symbol">&euro;/{{ t('admin.configPricing.year') }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="successPrices" class="success-banner">
      {{ t('admin.configPricing.pricesSaved') }}
    </div>

    <div class="save-section">
      <button class="btn-primary" :disabled="savingPrices" @click="emit('save')">
        {{ savingPrices ? t('admin.configPricing.saving') : t('admin.configPricing.savePrices') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-description {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: 0.875rem;
}

.pricing-table-wrapper {
  overflow-x: auto;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 22.5rem;
}

.pricing-table th {
  text-align: left;
  padding: var(--spacing-3) var(--spacing-4);
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: var(--color-gray-50);
  border-bottom: 2px solid var(--color-gray-200);
}

.pricing-table td {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  vertical-align: middle;
}

.row-readonly {
  background: var(--color-gray-50);
}

.plan-name {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.plan-free-tag {
  display: inline-block;
  margin-left: var(--spacing-2);
  padding: 0.125rem var(--spacing-2);
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  border-radius: var(--border-radius);
  font-size: 0.7rem;
  font-weight: 600;
}

.price-readonly {
  color: var(--text-disabled);
  font-style: italic;
  font-size: 0.9rem;
}

.input-euro {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 11.25rem;
}

.price-input {
  width: 100%;
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.price-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.euro-symbol {
  color: var(--color-gray-500);
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.85rem;
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  padding: 0.625rem var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  margin-top: var(--spacing-3);
}

.save-section {
  margin-top: var(--spacing-4);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 48em) {
  .config-card {
    padding: var(--spacing-4);
  }

  .pricing-table th,
  .pricing-table td {
    padding: 0.625rem var(--spacing-3);
  }

  .input-euro {
    max-width: 8.75rem;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
