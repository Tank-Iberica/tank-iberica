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
    <section v-if="amortizationPreview.length > 0" class="table-section">
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
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group--full {
  grid-column: 1 / -1;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.input-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  color: #1e293b;
  background: white;
  min-height: 44px;
  transition: border-color 0.2s;
  font-variant-numeric: tabular-nums;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

select.input-field {
  appearance: auto;
  cursor: pointer;
}

.input-unit {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  min-width: 32px;
}

/* Results */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-section h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-card {
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.3;
}

/* Metric colors */
.metric-positive {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.metric-positive .metric-value {
  color: #16a34a;
}
.metric-positive .metric-label {
  color: #15803d;
}

.metric-negative {
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.metric-negative .metric-value {
  color: #dc2626;
}
.metric-negative .metric-label {
  color: #b91c1c;
}

.metric-neutral {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.metric-neutral .metric-value {
  color: var(--color-primary, #23424a);
}
.metric-neutral .metric-label {
  color: #64748b;
}

.metric-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
}
.metric-warning .metric-value {
  color: #d97706;
}
.metric-warning .metric-label {
  color: #92400e;
}

/* Table */
.table-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.table-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
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
  padding: 10px 8px;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  font-size: 0.8rem;
  white-space: nowrap;
}

.data-table td {
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

.data-table .separator-row td {
  text-align: center;
  color: #94a3b8;
  font-weight: 600;
  padding: 4px 8px;
  border-bottom: none;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0;
}

/* Actions */
.actions-bar {
  display: flex;
  gap: 12px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Responsive */
@media (min-width: 480px) {
  .form-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .input-group:first-child,
  .input-group--full {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .btn-primary {
    width: auto;
  }
}

@media (min-width: 1024px) {
  .metric-value {
    font-size: 1.5rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
