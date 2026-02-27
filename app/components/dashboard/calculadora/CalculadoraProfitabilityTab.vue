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

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
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

/* Chart */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
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

  .input-group:first-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .chart-container {
    height: 380px;
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
