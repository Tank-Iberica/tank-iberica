<script setup lang="ts">
import { formatCurrency, type RevenueStats } from '~/composables/admin/useAdminPagos'

defineProps<{
  revenueStats: RevenueStats
}>()

const { t } = useI18n()
</script>

<template>
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-value">{{ formatCurrency(revenueStats.total) }}</span>
      <span class="stat-label">{{ t('admin.pagos.totalRevenue') }}</span>
    </div>
    <div class="stat-card stat-subscription">
      <span class="stat-value">{{ formatCurrency(revenueStats.subscription) }}</span>
      <span class="stat-label">{{ t('admin.pagos.subscriptionRevenue') }}</span>
    </div>
    <div class="stat-card stat-services">
      <span class="stat-value">{{ formatCurrency(revenueStats.services) }}</span>
      <span class="stat-label">{{ t('admin.pagos.servicesRevenue') }}</span>
    </div>
    <div class="stat-card stat-auction">
      <span class="stat-value">{{ formatCurrency(revenueStats.auction) }}</span>
      <span class="stat-label">{{ t('admin.pagos.auctionRevenue') }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-card {
  flex: 1;
  min-width: 140px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.stat-card.stat-subscription .stat-value {
  color: #7c3aed;
}

.stat-card.stat-services .stat-value {
  color: #0891b2;
}

.stat-card.stat-auction .stat-value {
  color: #4f46e5;
}

@media (min-width: 1024px) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
