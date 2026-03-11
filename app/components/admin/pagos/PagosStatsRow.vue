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
  gap: var(--spacing-3);
}

.stat-card {
  flex: 1;
  min-width: 8.75rem;
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  font-weight: 500;
}

.stat-card.stat-subscription .stat-value {
  color: var(--color-purple-600);
}

.stat-card.stat-services .stat-value {
  color: var(--color-cyan-600);
}

.stat-card.stat-auction .stat-value {
  color: var(--color-indigo-600);
}

@media (min-width: 64em) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
