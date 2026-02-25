<template>
  <div v-if="showDesglose" class="desglose-grid">
    <div v-for="[key, label] in reasonOptions" :key="key" class="desglose-item">
      <span class="desglose-label">{{ label }}</span>
      <div class="desglose-values">
        <span class="ing">&uarr; {{ fmt(summary.byReason[key]?.ingresos || 0) }}</span>
        <span class="gas">&darr; {{ fmt(summary.byReason[key]?.gastos || 0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BalanceSummary, BalanceReason } from '~/composables/admin/useAdminBalance'
import { fmt } from '~/composables/admin/useAdminBalanceUI'

defineProps<{
  showDesglose: boolean
  reasonOptions: [BalanceReason, string][]
  summary: BalanceSummary
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
