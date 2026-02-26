<template>
  <div class="view-toggles">
    <label class="toggle-check">
      <input
        :checked="showDesglose"
        type="checkbox"
        @change="$emit('update:showDesglose', ($event.target as HTMLInputElement).checked)"
      >
      {{ $t('admin.balance.breakdownByReason') }}
    </label>
    <label class="toggle-check">
      <input
        :checked="showCharts"
        type="checkbox"
        @change="$emit('update:showCharts', ($event.target as HTMLInputElement).checked)"
      >
      {{ $t('admin.balance.charts') }}
    </label>
    <select
      v-if="showCharts"
      :value="chartType"
      class="chart-type-select"
      :aria-label="$t('admin.balance.chartTypeLabel')"
      @change="
        $emit('update:chartType', ($event.target as HTMLSelectElement).value as 'bar' | 'pie')
      "
    >
      <option value="bar">{{ $t('admin.balance.barChart') }}</option>
      <option value="pie">{{ $t('admin.balance.pieChart') }}</option>
    </select>
    <span class="count">{{ total }} {{ $t('admin.balance.transactions') }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showDesglose: boolean
  showCharts: boolean
  chartType: 'bar' | 'pie'
  total: number
}>()

defineEmits<{
  'update:showDesglose': [value: boolean]
  'update:showCharts': [value: boolean]
  'update:chartType': [value: 'bar' | 'pie']
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
