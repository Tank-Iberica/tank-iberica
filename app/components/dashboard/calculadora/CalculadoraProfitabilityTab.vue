<script setup lang="ts">
import type { Component } from 'vue'
import {
  formatCurrency,
  formatPercent,
  metricColorClass,
  roiColorClass,
} from '~/composables/dashboard/useDashboardCalculadora'

defineProps<{
  purchasePrice: number
  monthlyRent: number
  annualInsurance: number
  annualMaintenance: number
  annualTaxes: number
  hasValidInputs: boolean
  grossAnnualIncome: number
  annualCosts: number
  netAnnualProfit: number
  monthsToRecover: number
  annualRoi: number
  breakEvenMonth: number
  residualValue3y: number
  totalProfitability3y: number
  chartData: Record<string, unknown>
  chartOptions: Record<string, unknown>
  lazyLineComponent: Component
  formatMonths: (value: number) => string
  monthLabel: string
  annualTaxesLabel: string
}>()

const emit = defineEmits<{
  (
    e:
      | 'update:purchasePrice'
      | 'update:monthlyRent'
      | 'update:annualInsurance'
      | 'update:annualMaintenance'
      | 'update:annualTaxes',
    value: number,
  ): void
  (e: 'print'): void
}>()

const { t } = useI18n()

function onNumberInput(
  field:
    | 'update:purchasePrice'
    | 'update:monthlyRent'
    | 'update:annualInsurance'
    | 'update:annualMaintenance'
    | 'update:annualTaxes',
  event: Event,
): void {
  const target = event.target as HTMLInputElement
  emit(field, Number(target.value) || 0)
}
</script>

<template>
  <!-- Input form -->
  <section class="form-section">
    <div class="input-group">
      <label class="input-label" for="calc-purchase">
        {{ t('dashboard.calculator.purchasePrice') }}
      </label>
      <div class="input-with-unit">
        <input
          id="calc-purchase"
          type="number"
          min="0"
          step="1000"
          class="input-field"
          placeholder="0"
          :value="purchasePrice"
          @input="onNumberInput('update:purchasePrice', $event)"
        >
        <span class="input-unit">&euro;</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="calc-rent">
        {{ t('dashboard.calculator.monthlyRent') }}
      </label>
      <div class="input-with-unit">
        <input
          id="calc-rent"
          type="number"
          min="0"
          step="100"
          class="input-field"
          placeholder="0"
          :value="monthlyRent"
          @input="onNumberInput('update:monthlyRent', $event)"
        >
        <span class="input-unit">&euro;/{{ monthLabel }}</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="calc-insurance">
        {{ t('dashboard.calculator.annualInsurance') }}
      </label>
      <div class="input-with-unit">
        <input
          id="calc-insurance"
          type="number"
          min="0"
          step="100"
          class="input-field"
          placeholder="0"
          :value="annualInsurance"
          @input="onNumberInput('update:annualInsurance', $event)"
        >
        <span class="input-unit">&euro;/{{ annualTaxesLabel.split(' ')[0] }}</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="calc-maintenance">
        {{ t('dashboard.calculator.annualMaintenance') }}
      </label>
      <div class="input-with-unit">
        <input
          id="calc-maintenance"
          type="number"
          min="0"
          step="100"
          class="input-field"
          placeholder="0"
          :value="annualMaintenance"
          @input="onNumberInput('update:annualMaintenance', $event)"
        >
        <span class="input-unit">&euro;</span>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="calc-taxes">
        {{ t('dashboard.calculator.annualTaxes') }}
      </label>
      <div class="input-with-unit">
        <input
          id="calc-taxes"
          type="number"
          min="0"
          step="50"
          class="input-field"
          placeholder="0"
          :value="annualTaxes"
          @input="onNumberInput('update:annualTaxes', $event)"
        >
        <span class="input-unit">&euro;</span>
      </div>
    </div>
  </section>

  <!-- Results -->
  <template v-if="hasValidInputs">
    <section class="results-section">
      <h2>{{ t('dashboard.calculator.results') }}</h2>

      <div class="metrics-grid">
        <div class="metric-card metric-positive">
          <span class="metric-value">{{ formatCurrency(grossAnnualIncome) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.grossAnnualIncome') }}</span>
        </div>

        <div class="metric-card metric-negative">
          <span class="metric-value">{{ formatCurrency(annualCosts) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.annualCosts') }}</span>
        </div>

        <div class="metric-card" :class="metricColorClass(netAnnualProfit)">
          <span class="metric-value">{{ formatCurrency(netAnnualProfit) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.netAnnualProfit') }}</span>
        </div>

        <div
          class="metric-card"
          :class="Number.isFinite(monthsToRecover) ? 'metric-neutral' : 'metric-negative'"
        >
          <span class="metric-value">{{ formatMonths(monthsToRecover) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.monthsToRecover') }}</span>
        </div>

        <div class="metric-card" :class="roiColorClass(annualRoi)">
          <span class="metric-value">{{ formatPercent(annualRoi) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.annualRoi') }}</span>
        </div>

        <div
          class="metric-card"
          :class="Number.isFinite(breakEvenMonth) ? 'metric-neutral' : 'metric-negative'"
        >
          <span class="metric-value">{{ formatMonths(breakEvenMonth) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.breakEvenMonth') }}</span>
        </div>

        <div class="metric-card metric-neutral">
          <span class="metric-value">{{ formatCurrency(residualValue3y) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.residualValue3y') }}</span>
        </div>

        <div class="metric-card" :class="metricColorClass(totalProfitability3y)">
          <span class="metric-value">{{ formatCurrency(totalProfitability3y) }}</span>
          <span class="metric-label">{{ t('dashboard.calculator.totalProfitability3y') }}</span>
        </div>
      </div>
    </section>

    <!-- Chart -->
    <section class="chart-section">
      <h2>{{ t('dashboard.calculator.chartTitle') }}</h2>
      <div class="chart-container">
        <component :is="lazyLineComponent" :data="chartData" :options="chartOptions" />
      </div>
    </section>

    <!-- Print button -->
    <div class="actions-bar">
      <button type="button" class="btn-primary" @click="emit('print')">
        {{ t('dashboard.calculator.printResults') }}
      </button>
    </div>
  </template>

  <!-- Empty state -->
  <div v-else class="empty-state">
    <p>{{ t('dashboard.calculator.enterValues') }}</p>
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

/* Chart */
.chart-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.chart-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container {
  position: relative;
  height: 18.75rem;
  width: 100%;
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

  .input-group:first-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 48em) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .chart-container {
    height: 23.75rem;
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
