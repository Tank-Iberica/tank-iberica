<script setup lang="ts">
import { useAdminDashboardPage } from '~/composables/admin/useAdminDashboardPage'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const {
  loading,
  error,
  kpiSummary,
  topDealers,
  topVehicles,
  churnData,
  revenueChartData,
  vehiclesChartData,
  leadsChartData,
  funnelChartData,
  barChartOptions,
  lineChartOptions,
  doughnutChartOptions,
  hasRevenueData,
  hasVehiclesData,
  hasLeadsData,
  hasFunnelData,
  init,
  exportMetricsCSV,
} = useAdminDashboardPage()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="metrics-page">
    <AdminDashboardDashboardHeader :loading="loading" @export="exportMetricsCSV()" />

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <AdminDashboardMetricsKpiCards :kpi-summary="kpiSummary" />

      <AdminDashboardMetricsChartsGrid
        :revenue-chart-data="revenueChartData"
        :vehicles-chart-data="vehiclesChartData"
        :leads-chart-data="leadsChartData"
        :funnel-chart-data="funnelChartData"
        :bar-chart-options="barChartOptions"
        :line-chart-options="lineChartOptions"
        :doughnut-chart-options="doughnutChartOptions"
        :has-revenue-data="hasRevenueData"
        :has-vehicles-data="hasVehiclesData"
        :has-leads-data="hasLeadsData"
        :has-funnel-data="hasFunnelData"
      />

      <AdminDashboardMetricsRankings :top-dealers="topDealers" :top-vehicles="topVehicles" />

      <AdminDashboardMetricsChurnCard :churn-data="churnData" />
    </template>
  </div>
</template>

<style scoped>
.metrics-page {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  border: 1px solid rgba(239, 68, 68, 0.3);
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-sm);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
