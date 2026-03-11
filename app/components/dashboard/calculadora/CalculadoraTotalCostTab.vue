<script setup lang="ts">
import type {
  ItpRateEntry,
  TotalCostResultView,
} from '~/composables/dashboard/useDashboardCalculadora'
import { formatCurrency } from '~/composables/dashboard/useDashboardCalculadora'

defineProps<{
  tcPurchasePrice: number
  tcYears: number
  tcInsuranceEstimate: number
  tcMaintenanceEstimate: number
  selectedComunidad: string
  itpRates: readonly ItpRateEntry[]
  hasValidTotalCost: boolean
  itpRate: number
  itpAmount: number
  totalCostResult: TotalCostResultView | null
  yearLabel: string
  yearsLabel: string
}>()

const emit = defineEmits<{
  (
    e:
      | 'update:tcPurchasePrice'
      | 'update:tcInsuranceEstimate'
      | 'update:tcMaintenanceEstimate'
      | 'update:tcYears',
    value: number,
  ): void
  (e: 'update:selectedComunidad', value: string): void
  (e: 'autoEstimate' | 'print'): void
}>()

const { t } = useI18n()

function onNumberInput(
  field: 'update:tcPurchasePrice' | 'update:tcInsuranceEstimate' | 'update:tcMaintenanceEstimate',
  event: Event,
): void {
  const target = event.target as HTMLInputElement
  emit(field, Number(target.value) || 0)
}

function onPriceChange(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:tcPurchasePrice', Number(target.value) || 0)
  emit('autoEstimate')
}

function onComunidadChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update:selectedComunidad', target.value)
}

function onYearsInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:tcYears', Number(target.value) || 1)
}
</script>

<template>
  <section class="form-section">
    <div class="input-group input-group--full">
      <label class="input-label" for="tc-price">
        {{ t('dashboard.calculator.purchasePrice') }}
      </label>
      <div class="input-with-unit">
        <input
          id="tc-price"
          type="number"
          min="0"
          step="1000"
          class="input-field"
          placeholder="0"
          :value="tcPurchasePrice"
          @input="onNumberInput('update:tcPurchasePrice', $event)"
          @change="onPriceChange"
        >
        <span class="input-unit">&euro;</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="tc-comunidad">
        {{ t('dashboard.calculator.comunidadAutonoma') }}
      </label>
      <select
        id="tc-comunidad"
        class="input-field"
        :value="selectedComunidad"
        @change="onComunidadChange"
      >
        <option v-for="entry in itpRates" :key="entry.comunidad" :value="entry.comunidad">
          {{ entry.comunidad }} ({{ entry.rate }}%)
        </option>
      </select>
    </div>

    <div class="input-group">
      <label class="input-label" for="tc-years">
        {{ t('dashboard.calculator.yearsOwnership') }}: {{ tcYears }}
        {{ tcYears === 1 ? yearLabel : yearsLabel }}
      </label>
      <input
        id="tc-years"
        type="range"
        min="1"
        max="10"
        step="1"
        class="range-slider"
        :value="tcYears"
        @input="onYearsInput"
      >
      <div class="range-labels">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="tc-insurance">
        {{ t('dashboard.calculator.estimatedInsurance') }}
      </label>
      <div class="input-with-unit">
        <input
          id="tc-insurance"
          type="number"
          min="0"
          step="100"
          class="input-field"
          placeholder="1500"
          :value="tcInsuranceEstimate"
          @input="onNumberInput('update:tcInsuranceEstimate', $event)"
        >
        <span class="input-unit">&euro;/{{ yearLabel }}</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="tc-maintenance">
        {{ t('dashboard.calculator.estimatedMaintenance') }}
      </label>
      <div class="input-with-unit">
        <input
          id="tc-maintenance"
          type="number"
          min="0"
          step="100"
          class="input-field"
          placeholder="3000"
          :value="tcMaintenanceEstimate"
          @input="onNumberInput('update:tcMaintenanceEstimate', $event)"
        >
        <span class="input-unit">&euro;/{{ yearLabel }}</span>
      </div>
    </div>
  </section>

  <template v-if="hasValidTotalCost && totalCostResult">
    <section class="results-section">
      <h2>{{ t('dashboard.calculator.results') }}</h2>
      <div class="metrics-grid">
        <div class="metric-card metric-neutral">
          <span class="metric-value">{{ formatCurrency(tcPurchasePrice) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.purchasePrice') }}</span>
        </div>
        <div class="metric-card metric-negative">
          <span class="metric-value">{{ formatCurrency(itpAmount) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.itpTax') }} ({{ itpRate }}%)</span>
        </div>
        <div class="metric-card metric-warning">
          <span class="metric-value">{{ formatCurrency(totalCostResult.grandTotal) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.grandTotal') }}</span>
        </div>
      </div>
    </section>

    <!-- Year-by-year breakdown table -->
    <section class="table-section">
      <h2>{{ t('dashboard.calculator.yearByYearBreakdown') }}</h2>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('dashboard.calculator.yearLabel') }}</th>
              <th>{{ t('dashboard.calculator.insuranceLabel') }}</th>
              <th>{{ t('dashboard.calculator.maintenanceLabel') }}</th>
              <th>{{ t('dashboard.calculator.cumulativeTotal') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="yearIdx in tcYears" :key="yearIdx">
              <td>{{ yearIdx }}</td>
              <td>{{ formatCurrency(totalCostResult.insurance[yearIdx - 1] || 0) }}</td>
              <td>{{ formatCurrency(totalCostResult.maintenance[yearIdx - 1] || 0) }}</td>
              <td class="cell-highlight">
                {{ formatCurrency(totalCostResult.totalByYear[yearIdx - 1] || 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="actions-bar">
      <button type="button" class="btn-primary" @click="emit('print')">
        {{ t('dashboard.calculator.printResults') }}
      </button>
    </div>
  </template>

  <div v-else class="empty-state">
    <p>{{ t('dashboard.calculator.enterTotalCostValues') }}</p>
  </div>
</template>

<style scoped>
/* Form */
.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-group--full {
  grid-column: 1 / -1;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-field {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 2.75rem;
  transition: border-color 0.2s;
  font-variant-numeric: tabular-nums;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

select.input-field {
  appearance: auto;
  cursor: pointer;
}

.input-unit {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  font-weight: 500;
  white-space: nowrap;
  min-width: 2rem;
}

/* Range slider */
.range-slider {
  width: 100%;
  height: 0.375rem;
  appearance: none;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  outline: none;
  margin: 0.5rem 0;
}

.range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--border-radius-full);
  background: var(--color-primary);
  cursor: pointer;
  border: 0.1875rem solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.range-slider::-moz-range-thumb {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--border-radius-full);
  background: var(--color-primary);
  cursor: pointer;
  border: 0.1875rem solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
}

/* Results */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results-section h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.metric-card {
  border-radius: var(--border-radius-md);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: 1.3;
}

/* Metric colors */
.metric-positive {
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
}
.metric-positive .metric-value {
  color: var(--color-success);
}
.metric-positive .metric-label {
  color: var(--color-green-700);
}

.metric-negative {
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
}
.metric-negative .metric-value {
  color: var(--color-error);
}
.metric-negative .metric-label {
  color: var(--color-error);
}

.metric-neutral {
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-200);
}
.metric-neutral .metric-value {
  color: var(--color-primary);
}
.metric-neutral .metric-label {
  color: var(--text-auxiliary);
}

.metric-warning {
  background: var(--color-amber-50);
  border: 1px solid var(--color-amber-200);
}
.metric-warning .metric-value {
  color: var(--color-warning);
}
.metric-warning .metric-label {
  color: var(--color-warning-text);
}

/* Table */
.table-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.table-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.data-table th {
  text-align: left;
  padding: 0.625rem 0.5rem;
  border-bottom: 0.125rem solid var(--color-gray-200);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.data-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-gray-100);
  color: var(--text-primary);
  white-space: nowrap;
}

.cell-highlight {
  font-weight: 700;
  color: var(--color-primary);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3.75rem 1.25rem;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0;
}

/* Actions */
.actions-bar {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Responsive */
@media (min-width: 30em) {
  .form-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .input-group:first-child,
  .input-group--full {
    grid-column: 1 / -1;
  }
}

@media (min-width: 48em) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .btn-primary {
    width: auto;
  }
}

@media (min-width: 64em) {
  .metric-value {
    font-size: var(--font-size-2xl);
  }

  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
