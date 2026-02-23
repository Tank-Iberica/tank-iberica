<template>
  <div class="infra-history">
    <div class="history-toolbar">
      <div class="period-selector">
        <button
          v-for="p in periods"
          :key="p.value"
          class="period-btn"
          :class="{ active: localPeriod === p.value }"
          @click="changePeriod(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="historyChartDataSets.length === 0" class="empty-state">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="empty-icon"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span>{{
        $t('admin.infra.noHistory', 'Sin datos historicos para el periodo seleccionado')
      }}</span>
    </div>

    <div v-else class="charts-grid">
      <div v-for="chart in historyChartDataSets" :key="chart.component" class="chart-card">
        <h3 class="chart-title">{{ chart.label }}</h3>
        <div class="chart-container">
          <Line :data="chart.chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

type PeriodValue = '24h' | '7d' | '30d'

interface HistoryChartData {
  component: string
  label: string
  chartData: ChartData<'line'>
}

interface Props {
  historyChartDataSets: HistoryChartData[]
  chartOptions: ChartOptions<'line'>
}

defineProps<Props>()

const emit = defineEmits<{
  'change-period': [period: PeriodValue]
}>()

const { t: $t } = useI18n()

const localPeriod = ref<PeriodValue>('7d')

const periods = [
  { value: '24h' as PeriodValue, label: '24h' },
  { value: '7d' as PeriodValue, label: '7d' },
  { value: '30d' as PeriodValue, label: '30d' },
]

function changePeriod(period: PeriodValue) {
  localPeriod.value = period
  emit('change-period', period)
}
</script>

<style scoped>
.infra-history {
  display: flex;
  flex-direction: column;
}

.history-toolbar {
  margin-bottom: var(--spacing-6);
}

.period-selector {
  display: flex;
  gap: var(--spacing-1);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-1);
  width: fit-content;
}

.period-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.period-btn:hover {
  background: var(--bg-tertiary);
}

.period-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-12);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.empty-icon {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.chart-container {
  height: 250px;
  position: relative;
}

@media (min-width: 1024px) {
  .chart-container {
    height: 300px;
  }
}
</style>
