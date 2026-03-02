<script setup lang="ts">
/**
 * ContratoFormHeader
 * Contract type radio selector, date, and location fields.
 */
import type { ContractType } from '~/composables/dashboard/useDashboardContrato'

defineProps<{
  contractType: ContractType
  contractDate: string
  contractLocation: string
}>()

const emit = defineEmits<{
  (e: 'update:contractType', value: ContractType): void
  (e: 'update:contractDate' | 'update:contractLocation', value: string): void
}>()

const { t } = useI18n()

function onTypeChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value as ContractType
  emit('update:contractType', value)
}
</script>

<template>
  <div class="contrato-form-header">
    <div class="form-row">
      <div class="form-group" style="flex: 2">
        <label>{{ t('dashboard.tools.contract.contractType') }}</label>
        <div class="radio-group-inline">
          <label class="radio-card" :class="{ active: contractType === 'arrendamiento' }">
            <input
              type="radio"
              value="arrendamiento"
              :checked="contractType === 'arrendamiento'"
              @change="onTypeChange"
            >
            <span class="radio-icon-svg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </span>
            <span class="radio-label">{{ t('dashboard.tools.contract.typeRental') }}</span>
          </label>
          <label class="radio-card" :class="{ active: contractType === 'compraventa' }">
            <input
              type="radio"
              value="compraventa"
              :checked="contractType === 'compraventa'"
              @change="onTypeChange"
            >
            <span class="radio-icon-svg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span class="radio-label">{{ t('dashboard.tools.contract.typeSale') }}</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.date') }}</label>
        <input
          :value="contractDate"
          type="date"
          @input="emit('update:contractDate', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.location') }}</label>
        <input
          :value="contractLocation"
          type="text"
          @input="emit('update:contractLocation', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
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
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.radio-group-inline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid var(--border-color-light);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 180px;
  min-height: 44px;
}

.radio-card:hover {
  border-color: var(--color-primary);
}

.radio-card.active {
  border-color: var(--color-primary);
  background: #f0f9ff;
}

.radio-card input {
  display: none;
}

.radio-icon-svg {
  flex-shrink: 0;
  color: var(--color-primary);
}

.radio-label {
  font-weight: 500;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .radio-group-inline {
    flex-direction: column;
  }

  .radio-card {
    min-width: 100%;
  }
}
</style>
