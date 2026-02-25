<template>
  <div class="view-toggles">
    <label class="toggle-check">
      <input
        :checked="showDesglose"
        type="checkbox"
        @change="$emit('update:showDesglose', ($event.target as HTMLInputElement).checked)"
      >
      Desglose por raz&oacute;n
    </label>
    <label class="toggle-check">
      <input
        :checked="showCharts"
        type="checkbox"
        @change="$emit('update:showCharts', ($event.target as HTMLInputElement).checked)"
      >
      Gr&aacute;ficos
    </label>
    <select
      v-if="showCharts"
      :value="chartType"
      class="chart-type-select"
      @change="$emit('update:chartType', ($event.target as HTMLSelectElement).value)"
    >
      <option value="bar">Barras</option>
      <option value="pie">Circular</option>
    </select>
    <span class="count">{{ total }} transacciones</span>
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
