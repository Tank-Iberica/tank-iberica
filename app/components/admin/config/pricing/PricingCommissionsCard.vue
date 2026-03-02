<script setup lang="ts">
import type { CommissionDefinition } from '~/composables/admin/useAdminConfigPricing'

defineProps<{
  commissionDefinitions: CommissionDefinition[]
  commissionRates: Record<string, number>
  savingCommissions: boolean
  successCommissions: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'update-rate', payload: { rateKey: string; value: number }): void
}>()

const { t } = useI18n()

function onInput(rateKey: string, event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-rate', { rateKey, value: Number(target.value) })
}
</script>

<template>
  <div class="config-card">
    <h2 class="card-title">{{ t('admin.configPricing.commissionRatesTitle') }}</h2>
    <p class="card-description">{{ t('admin.configPricing.commissionRatesDesc') }}</p>

    <div class="commission-grid">
      <div v-for="def in commissionDefinitions" :key="def.key" class="commission-field">
        <label :for="`commission-${def.key}`" class="commission-label">{{ t(def.labelKey) }}</label>
        <div class="input-with-suffix">
          <input
            :id="`commission-${def.key}`"
            type="number"
            min="0"
            :step="def.type === 'pct' ? '0.1' : '0.01'"
            class="commission-input"
            :value="commissionRates[def.key]"
            @input="onInput(def.key, $event)"
          >
          <span class="input-suffix">{{ def.type === 'pct' ? '%' : '&euro;' }}</span>
        </div>
      </div>
    </div>

    <div v-if="successCommissions" class="success-banner">
      {{ t('admin.configPricing.commissionsSaved') }}
    </div>

    <div class="save-section">
      <button class="btn-primary" :disabled="savingCommissions" @click="emit('save')">
        {{
          savingCommissions
            ? t('admin.configPricing.saving')
            : t('admin.configPricing.saveCommissions')
        }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-description {
  margin: 0 0 20px;
  color: var(--text-auxiliary);
  font-size: 0.875rem;
}

.commission-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.commission-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.commission-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 200px;
}

.commission-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.commission-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.input-suffix {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.95rem;
  flex-shrink: 0;
  min-width: 20px;
}

.success-banner {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 12px;
}

.save-section {
  margin-top: 16px;
}

.btn-primary {
  background: var(--color-primary);
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
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .commission-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .config-card {
    padding: 16px;
  }

  .input-with-suffix {
    max-width: 100%;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
