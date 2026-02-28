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
                  :value="subscriptionPrices[plan.key].monthly"
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
                  :value="subscriptionPrices[plan.key].annual"
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.card-description {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 0.875rem;
}

.pricing-table-wrapper {
  overflow-x: auto;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 360px;
}

.pricing-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: #374151;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.pricing-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.row-readonly {
  background: #f9fafb;
}

.plan-name {
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.plan-free-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.price-readonly {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
}

.input-euro {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
}

.price-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.price-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.euro-symbol {
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.85rem;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 12px;
}

.save-section {
  margin-top: 16px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .config-card {
    padding: 16px;
  }

  .pricing-table th,
  .pricing-table td {
    padding: 10px 12px;
  }

  .input-euro {
    max-width: 140px;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
