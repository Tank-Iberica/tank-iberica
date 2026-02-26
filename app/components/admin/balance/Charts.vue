<template>
  <div v-if="showCharts" class="charts-section">
    <div class="charts-grid">
      <!-- Chart 1: Ingresos vs Gastos por Razon -->
      <div class="chart-box">
        <h3>{{ t('admin.balance.incomeVsExpensesByReason') }}</h3>
        <div v-if="chartType === 'bar'" class="chart-bars">
          <div v-for="(label, idx) in chartRazonData.labels" :key="label" class="bar-group">
            <div class="bar-label">{{ label }}</div>
            <div class="bars">
              <div
                class="bar ingreso"
                :style="{
                  width: `${Math.min(100, ((props.chartRazonData.ingresos[idx] ?? 0) / Math.max(...props.chartRazonData.ingresos, 1)) * 100)}%`,
                }"
              >
                {{ fmt(props.chartRazonData.ingresos[idx] ?? 0) }}
              </div>
              <div
                class="bar gasto"
                :style="{
                  width: `${Math.min(100, ((props.chartRazonData.gastos[idx] ?? 0) / Math.max(...props.chartRazonData.gastos, 1)) * 100)}%`,
                }"
              >
                {{ fmt(props.chartRazonData.gastos[idx] ?? 0) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="chart-pie">
          <div v-for="(label, idx) in chartRazonData.labels" :key="label" class="pie-item">
            <span class="pie-color" :style="{ background: `hsl(${idx * 25}, 70%, 50%)` }" />
            <span class="pie-label">{{ label }}</span>
            <span class="pie-value">{{
              fmt((chartRazonData.ingresos[idx] || 0) - (chartRazonData.gastos[idx] || 0))
            }}</span>
          </div>
        </div>
      </div>

      <!-- Chart 2: Beneficio % por Tipo -->
      <div class="chart-box">
        <h3>{{ t('admin.balance.profitByType') }}</h3>
        <div v-if="chartSubcatData.labels.length === 0" class="chart-empty">
          {{ t('admin.balance.noProfitData') }}
        </div>
        <div v-else-if="chartType === 'bar'" class="chart-bars">
          <div v-for="(label, idx) in chartSubcatData.labels" :key="label" class="bar-group">
            <div class="bar-label">{{ label }}</div>
            <div class="bars">
              <div
                class="bar"
                :class="(props.chartSubcatData.beneficios[idx] ?? 0) >= 0 ? 'ingreso' : 'gasto'"
                :style="{
                  width: `${Math.min(100, Math.abs(props.chartSubcatData.beneficios[idx] ?? 0))}%`,
                }"
              >
                {{ props.chartSubcatData.beneficios[idx] ?? 0 }}%
              </div>
            </div>
          </div>
        </div>
        <div v-else class="chart-pie">
          <div v-for="(label, idx) in chartSubcatData.labels" :key="label" class="pie-item">
            <span
              class="pie-color"
              :style="{
                background:
                  (props.chartSubcatData.beneficios[idx] ?? 0) >= 0 ? '#22c55e' : '#ef4444',
              }"
            />
            <span class="pie-label">{{ label }}</span>
            <span
              class="pie-value"
              :class="(props.chartSubcatData.beneficios[idx] ?? 0) >= 0 ? 'positive' : 'negative'"
              >{{ props.chartSubcatData.beneficios[idx] ?? 0 }}%</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fmt } from '~/composables/admin/useAdminBalanceUI'

const { t } = useI18n()

const props = defineProps<{
  showCharts: boolean
  chartType: 'bar' | 'pie'
  chartRazonData: { labels: string[]; ingresos: number[]; gastos: number[] }
  chartSubcatData: { labels: string[]; beneficios: number[] }
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
