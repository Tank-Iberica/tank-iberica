<script setup lang="ts">
import { useAdminFacturacion } from '~/composables/admin/useAdminFacturacion'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const {
  invoices,
  loading,
  selectedPeriod,
  periods,
  totalRevenue,
  totalTax,
  revenueByType,
  paidCount,
  pendingCount,
  failedCount,
  channelRevenue,
  mrr,
  arr,
  leadMetrics,
  exportCsv,
  init,
} = useAdminFacturacion()

init()

function onSelectPeriod(value: string): void {
  selectedPeriod.value = value
}
</script>

<template>
  <div class="billing-page">
    <FacturacionHeader @export="exportCsv" />

    <FacturacionPeriodTabs
      :periods="periods"
      :selected-period="selectedPeriod"
      @select="onSelectPeriod"
    />

    <!-- Loading -->
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="5" :cols="5" />
    </div>

    <template v-else>
      <FacturacionStatsGrid
        :total-revenue="totalRevenue"
        :total-tax="totalTax"
        :paid-count="paidCount"
        :pending-count="pendingCount"
        :failed-count="failedCount"
        :mrr="mrr"
        :arr="arr"
        :lead-metrics="leadMetrics"
      />

      <FacturacionRevenueByChannel
        v-if="channelRevenue.some((c) => c.amount > 0)"
        :channel-revenue="channelRevenue"
      />

      <FacturacionRevenueByType
        v-if="revenueByType.length"
        :revenue-by-type="revenueByType"
        :total-revenue="totalRevenue"
      />

      <FacturacionInvoiceList :invoices="invoices" />
    </template>
  </div>
</template>

<style scoped>
.billing-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  min-height: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary, var(--text-auxiliary));
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200, var(--color-gray-200));
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
