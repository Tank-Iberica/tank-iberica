<template>
  <div class="summary-cards">
    <div class="summary-card ingresos">
      <span class="label">Total Ingresos</span>
      <span class="value">{{ fmt(summary.totalIngresos) }}</span>
    </div>
    <div class="summary-card gastos">
      <span class="label">Total Gastos</span>
      <span class="value">{{ fmt(summary.totalGastos) }}</span>
    </div>
    <div class="summary-card neto" :class="summary.balanceNeto >= 0 ? 'positive' : 'negative'">
      <span class="label">Balance Neto</span>
      <span class="value">{{ fmt(summary.balanceNeto) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BalanceSummary } from '~/composables/admin/useAdminBalance'
import { fmt } from '~/composables/admin/useAdminBalanceUI'

defineProps<{
  summary: BalanceSummary
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
