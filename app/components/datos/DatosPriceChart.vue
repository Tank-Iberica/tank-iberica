<script setup lang="ts">
import type { DatosChartData } from '~/composables/useDatos'

// Lazy-load Chart.js — only imported when chart section is visible
const LazyLine = defineAsyncComponent(() =>
  import('chart.js').then(
    ({
      Chart,
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler,
    }) => {
      Chart.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler,
      )
      return import('vue-chartjs').then((m) => m.Line)
    },
  ),
)

defineProps<{
  chartData: DatosChartData
  chartOptions: Record<string, unknown>
}>()
</script>

<template>
  <section v-if="chartData.labels.length" class="datos-section">
    <h2 class="datos-section__title">
      {{ $t('data.priceTrends') }} &mdash; {{ $t('data.last12Months') }}
    </h2>
    <div class="chart-container">
      <LazyLine :data="chartData" :options="chartOptions as any" />
    </div>
  </section>
</template>

<style scoped>
.datos-section {
  margin-bottom: var(--spacing-10);
}

.datos-section__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-5);
}

.chart-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  height: 300px;
  position: relative;
}

@media (min-width: 768px) {
  .chart-container {
    height: 380px;
    padding: var(--spacing-6);
  }

  .datos-section__title {
    font-size: var(--font-size-2xl);
  }
}

@media (min-width: 1024px) {
  .chart-container {
    height: 420px;
  }
}
</style>
