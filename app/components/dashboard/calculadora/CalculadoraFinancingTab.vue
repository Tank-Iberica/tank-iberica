<script setup lang="ts">
import type {
  AmortizationRow,
  FinancingResultView,
} from '~/composables/dashboard/useDashboardCalculadora'
import {
  formatCurrency,
  formatCurrencyDecimals,
} from '~/composables/dashboard/useDashboardCalculadora'

defineProps<{
  finVehiclePrice: number
  finDownPaymentPct: number
  finInterestRate: number
  finTermMonths: number
  termOptions: number[]
  finDownPaymentAmount: number
  hasValidFinancing: boolean
  financingResult: FinancingResultView | null
  amortizationPreview: Array<AmortizationRow | null>
}>()

const emit = defineEmits<{
  (
    e:
      | 'update:finVehiclePrice'
      | 'update:finDownPaymentPct'
      | 'update:finInterestRate'
      | 'update:finTermMonths',
    value: number,
  ): void
  (e: 'print'): void
}>()

const { t } = useI18n()

function onNumberInput(
  field: 'update:finVehiclePrice' | 'update:finDownPaymentPct' | 'update:finInterestRate',
  event: Event,
): void {
  const target = event.target as HTMLInputElement
  emit(field, Number(target.value) || 0)
}

function onTermChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update:finTermMonths', Number(target.value) || 0)
}
</script>

<template>
  <section class="form-section">
    <div class="input-group input-group--full">
      <label class="input-label" for="fin-price">
        {{ t('dashboard.calculator.vehiclePrice') }}
      </label>
      <div class="input-with-unit">
        <input
          id="fin-price"
          type="number"
          min="0"
          step="1000"
          class="input-field"
          placeholder="0"
          :value="finVehiclePrice"
          @input="onNumberInput('update:finVehiclePrice', $event)"
        >
        <span class="input-unit">&euro;</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="fin-down">
        {{ t('dashboard.calculator.downPaymentPercent') }}
      </label>
      <div class="input-with-unit">
        <input
          id="fin-down"
          type="number"
          min="0"
          max="100"
          step="5"
          class="input-field"
          placeholder="20"
          :value="finDownPaymentPct"
          @input="onNumberInput('update:finDownPaymentPct', $event)"
        >
        <span class="input-unit">%</span>
      </div>
      <span class="input-hint">
        {{ t('dashboard.calculator.downPaymentAmount') }}:
        {{ formatCurrency(finDownPaymentAmount) }}
      </span>
    </div>

    <div class="input-group">
      <label class="input-label" for="fin-interest">
        {{ t('dashboard.calculator.interestRate') }}
      </label>
      <div class="input-with-unit">
        <input
          id="fin-interest"
          type="number"
          min="0"
          max="30"
          step="0.1"
          class="input-field"
          placeholder="5.5"
          :value="finInterestRate"
          @input="onNumberInput('update:finInterestRate', $event)"
        >
        <span class="input-unit">%</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="fin-term">
        {{ t('dashboard.calculator.termMonths') }}
      </label>
      <select id="fin-term" class="input-field" :value="finTermMonths" @change="onTermChange">
        <option v-for="term in termOptions" :key="term" :value="term">
          {{ term }} {{ t('dashboard.calculator.months') }}
        </option>
      </select>
    </div>
  </section>

  <template v-if="hasValidFinancing && financingResult">
    <section class="results-section">
      <h2>{{ t('dashboard.calculator.results') }}</h2>
      <div class="metrics-grid">
        <div class="metric-card metric-neutral">
          <span class="metric-value">{{
            formatCurrencyDecimals(financingResult.monthlyPayment)
          }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.monthlyPayment') }}</span>
        </div>
        <div class="metric-card metric-negative">
          <span class="metric-value">{{ formatCurrency(financingResult.totalInterest) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.totalInterest') }}</span>
        </div>
        <div class="metric-card metric-warning">
          <span class="metric-value">{{
            formatCurrency(financingResult.totalPayment + finDownPaymentAmount)
          }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.totalCostFinancing') }}</span>
        </div>
      </div>
    </section>

    <!-- Amortization summary table -->
    <section v-if="amortizationPreview.length" class="table-section">
      <h2>{{ t('dashboard.calculator.amortizationSummary') }}</h2>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('dashboard.calculator.amortMonth') }}</th>
              <th>{{ t('dashboard.calculator.amortPayment') }}</th>
              <th>{{ t('dashboard.calculator.amortPrincipal') }}</th>
              <th>{{ t('dashboard.calculator.amortInterest') }}</th>
              <th>{{ t('dashboard.calculator.amortBalance') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, idx) in amortizationPreview" :key="idx">
              <tr v-if="row === null" class="separator-row">
                <td colspan="5">...</td>
              </tr>
              <tr v-else>
                <td>{{ row.month }}</td>
                <td>{{ formatCurrencyDecimals(row.payment) }}</td>
                <td>{{ formatCurrencyDecimals(row.principal) }}</td>
                <td>{{ formatCurrencyDecimals(row.interest) }}</td>
                <td>{{ formatCurrencyDecimals(row.balance) }}</td>
              </tr>
            </template>
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
    <p>{{ t('dashboard.calculator.enterFinancingValues') }}</p>
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

.input-hint {
  font-size: var(--font-size-sm);
  color: var(--text-disabled);
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

.data-table .separator-row td {
  text-align: center;
  color: var(--text-disabled);
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-bottom: none;
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
