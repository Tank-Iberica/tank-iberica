<script setup lang="ts">
import { useAdminFacturacion } from '~/composables/admin/useAdminFacturacion'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { t } = useI18n()

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
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('billing.title') }}...</span>
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
        v-if="revenueByType.length > 0"
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
  gap: var(--spacing-4, 16px);
  min-height: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3, 12px);
  padding: 60px 20px;
  color: var(--text-auxiliary, #7a8a8a);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200, #e5e7eb);
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
