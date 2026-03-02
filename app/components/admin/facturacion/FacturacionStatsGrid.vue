<script setup lang="ts">
import { formatAmount, type LeadMetricsData } from '~/composables/admin/useAdminFacturacion'

const { t } = useI18n()

defineProps<{
  totalRevenue: number
  totalTax: number
  paidCount: number
  pendingCount: number
  failedCount: number
  mrr: number
  arr: number
  leadMetrics: LeadMetricsData
}>()
</script>

<template>
  <!-- Primary stats -->
  <div class="stats-row">
    <div class="stat-card stat-revenue">
      <span class="stat-label">{{ t('billing.totalRevenue') }}</span>
      <span class="stat-value">{{ formatAmount(totalRevenue) }}</span>
    </div>
    <div class="stat-card stat-tax">
      <span class="stat-label">{{ t('billing.totalTax') }}</span>
      <span class="stat-value">{{ formatAmount(totalTax) }}</span>
    </div>
    <div class="stat-card stat-paid">
      <span class="stat-label">{{ t('billing.paidInvoices') }}</span>
      <span class="stat-value">{{ paidCount }}</span>
    </div>
    <div class="stat-card stat-pending">
      <span class="stat-label">{{ t('billing.pendingInvoices') }}</span>
      <span class="stat-value">{{ pendingCount }}</span>
    </div>
    <div class="stat-card stat-failed">
      <span class="stat-label">{{ t('billing.failedInvoices') }}</span>
      <span class="stat-value">{{ failedCount }}</span>
    </div>
  </div>

  <!-- Secondary stats: MRR / ARR / Leads -->
  <div class="stats-row stats-row--secondary">
    <div class="stat-card stat-mrr">
      <span class="stat-label">MRR</span>
      <span class="stat-value">{{ formatAmount(mrr) }}</span>
    </div>
    <div class="stat-card stat-arr">
      <span class="stat-label">ARR</span>
      <span class="stat-value">{{ formatAmount(arr) }}</span>
    </div>
    <div class="stat-card stat-leads">
      <span class="stat-label">{{ t('billing.leadsThisMonth') }}</span>
      <span class="stat-value">{{ leadMetrics.totalLeads }}</span>
    </div>
    <div class="stat-card stat-lead-value">
      <span class="stat-label">{{ t('billing.leadValueGenerated') }}</span>
      <span class="stat-value">{{ formatAmount(leadMetrics.totalValue * 100) }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3, 12px);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1, 4px);
  padding: var(--spacing-4, 16px) var(--spacing-5, 20px);
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  border-left: 4px solid transparent;
}

.stat-card.stat-revenue {
  border-left-color: var(--color-primary);
}

.stat-card.stat-tax {
  border-left-color: var(--color-info);
}

.stat-card.stat-paid {
  border-left-color: var(--color-success);
}

.stat-card.stat-pending {
  border-left-color: var(--color-warning);
}

.stat-card.stat-failed {
  border-left-color: var(--color-error);
}

.stat-card.stat-mrr {
  border-left-color: var(--color-primary);
}

.stat-card.stat-arr {
  border-left-color: var(--color-info);
}

.stat-card.stat-leads {
  border-left-color: var(--color-success);
}

.stat-card.stat-lead-value {
  border-left-color: var(--color-warning);
}

.stats-row--secondary {
  margin-top: var(--spacing-2, 8px);
}

.stat-label {
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-auxiliary, #7a8a8a);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary, #1f2a2a);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 480px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-value {
    font-size: var(--font-size-2xl, 1.5rem);
  }
}

@media (min-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
