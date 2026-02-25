<template>
  <div v-if="showCharts" class="charts-section">
    <div class="charts-grid">
      <!-- Chart 1: Ingresos vs Gastos por Razon -->
      <div class="chart-box">
        <h3>Ingresos vs Gastos por Razon</h3>
        <div v-if="chartType === 'bar'" class="chart-bars">
          <div v-for="(label, idx) in chartRazonData.labels" :key="label" class="bar-group">
            <div class="bar-label">{{ label }}</div>
            <div class="bars">
              <div
                class="bar ingreso"
                :style="{
                  width: `${Math.min(100, (chartRazonData.ingresos[idx] / Math.max(...chartRazonData.ingresos, 1)) * 100)}%`,
                }"
              >
                {{ fmt(chartRazonData.ingresos[idx]) }}
              </div>
              <div
                class="bar gasto"
                :style="{
                  width: `${Math.min(100, (chartRazonData.gastos[idx] / Math.max(...chartRazonData.gastos, 1)) * 100)}%`,
                }"
              >
                {{ fmt(chartRazonData.gastos[idx]) }}
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
        <h3>Beneficio % por Tipo</h3>
        <div v-if="chartSubcatData.labels.length === 0" class="chart-empty">
          Sin datos de beneficio
        </div>
        <div v-else-if="chartType === 'bar'" class="chart-bars">
          <div v-for="(label, idx) in chartSubcatData.labels" :key="label" class="bar-group">
            <div class="bar-label">{{ label }}</div>
            <div class="bars">
              <div
                class="bar"
                :class="chartSubcatData.beneficios[idx] >= 0 ? 'ingreso' : 'gasto'"
                :style="{ width: `${Math.min(100, Math.abs(chartSubcatData.beneficios[idx]))}%` }"
              >
                {{ chartSubcatData.beneficios[idx] }}%
              </div>
            </div>
          </div>
        </div>
        <div v-else class="chart-pie">
          <div v-for="(label, idx) in chartSubcatData.labels" :key="label" class="pie-item">
            <span
              class="pie-color"
              :style="{
                background: chartSubcatData.beneficios[idx] >= 0 ? '#22c55e' : '#ef4444',
              }"
            />
            <span class="pie-label">{{ label }}</span>
            <span
              class="pie-value"
              :class="chartSubcatData.beneficios[idx] >= 0 ? 'positive' : 'negative'"
              >{{ chartSubcatData.beneficios[idx] }}%</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fmt } from '~/composables/admin/useAdminBalanceUI'

defineProps<{
  showCharts: boolean
  chartType: 'bar' | 'pie'
  chartRazonData: { labels: string[]; ingresos: number[]; gastos: number[] }
  chartSubcatData: { labels: string[]; beneficios: number[] }
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
