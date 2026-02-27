<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'

defineProps<{
  revenueChartData: ChartData<'bar'>
  vehiclesChartData: ChartData<'line'>
  leadsChartData: ChartData<'bar'>
  funnelChartData: ChartData<'doughnut'>
  barChartOptions: ChartOptions<'bar'>
  lineChartOptions: ChartOptions<'line'>
  doughnutChartOptions: ChartOptions<'doughnut'>
  hasRevenueData: boolean
  hasVehiclesData: boolean
  hasLeadsData: boolean
  hasFunnelData: boolean
}>()

// Lazy-load Chart.js components — admin dashboard is SSR: false
const chartReady = ref(false)

const LazyBar = defineAsyncComponent(() =>
  import('chart.js').then(
    ({
      Chart,
      CategoryScale,
      LinearScale,
      BarElement,
      PointElement,
      LineElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
      Filler,
    }) => {
      Chart.register(
        CategoryScale,
        LinearScale,
        BarElement,
        PointElement,
        LineElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
        Filler,
      )
      chartReady.value = true
      return import('vue-chartjs').then((m) => m.Bar)
    },
  ),
)

const LazyLine = defineAsyncComponent(() =>
  chartReady.value
    ? import('vue-chartjs').then((m) => m.Line)
    : import('chart.js').then(
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

const LazyDoughnut = defineAsyncComponent(() =>
  chartReady.value
    ? import('vue-chartjs').then((m) => m.Doughnut)
    : import('chart.js').then(({ Chart, ArcElement, Tooltip, Legend }) => {
        Chart.register(ArcElement, Tooltip, Legend)
        return import('vue-chartjs').then((m) => m.Doughnut)
      }),
)
</script>

<template>
  <section class="charts-grid">
    <!-- Monthly Revenue (Bar) -->
    <div class="chart-card">
      <h2 class="chart-card__title">{{ $t('admin.metrics.revenueChart') }}</h2>
      <div class="chart-card__body">
        <div v-if="!hasRevenueData" class="chart-card__empty">
          {{ $t('admin.metrics.noData') }}
        </div>
        <LazyBar v-else :data="revenueChartData" :options="barChartOptions" />
      </div>
    </div>

    <!-- Vehicles Published vs Sold (Line) -->
    <div class="chart-card">
      <h2 class="chart-card__title">{{ $t('admin.metrics.vehiclesChart') }}</h2>
      <div class="chart-card__body">
        <div v-if="!hasVehiclesData" class="chart-card__empty">
          {{ $t('admin.metrics.noData') }}
        </div>
        <LazyLine v-else :data="vehiclesChartData" :options="lineChartOptions" />
      </div>
    </div>

    <!-- Leads per Month (Bar) -->
    <div class="chart-card">
      <h2 class="chart-card__title">{{ $t('admin.metrics.leadsChart') }}</h2>
      <div class="chart-card__body">
        <div v-if="!hasLeadsData" class="chart-card__empty">
          {{ $t('admin.metrics.noData') }}
        </div>
        <LazyBar v-else :data="leadsChartData" :options="barChartOptions" />
      </div>
    </div>

    <!-- Conversion Funnel (Doughnut) -->
    <div class="chart-card">
      <h2 class="chart-card__title">{{ $t('admin.metrics.funnelChart') }}</h2>
      <div class="chart-card__body">
        <div v-if="!hasFunnelData" class="chart-card__empty">
          {{ $t('admin.metrics.noData') }}
        </div>
        <LazyDoughnut v-else :data="funnelChartData" :options="doughnutChartOptions" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.chart-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.chart-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.chart-card__body {
  position: relative;
  height: 280px;
}

.chart-card__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-card__body {
    height: 320px;
  }
}
</style>
