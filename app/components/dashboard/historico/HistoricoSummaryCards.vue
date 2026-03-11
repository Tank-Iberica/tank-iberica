<script setup lang="ts">
/**
 * HistoricoSummaryCards — Four summary metric cards for the dealer sales history.
 */
import type { DealerHistoricoSummary } from '~/composables/dashboard/useDashboardHistorico'

defineProps<{
  summary: DealerHistoricoSummary
  fmt: (val: number | null | undefined) => string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="summary-cards">
    <div class="summary-card sales">
      <span class="card-label">{{ t('dashboard.historico.summary.totalSales') }}</span>
      <span class="card-value">{{ summary.totalSales }}</span>
    </div>
    <div class="summary-card revenue">
      <span class="card-label">{{ t('dashboard.historico.summary.totalRevenue') }}</span>
      <span class="card-value">{{ fmt(summary.totalRevenue) }}</span>
    </div>
    <div class="summary-card profit" :class="{ negative: summary.totalProfit < 0 }">
      <span class="card-label">{{ t('dashboard.historico.summary.totalProfit') }}</span>
      <span class="card-value">{{ fmt(summary.totalProfit) }}</span>
    </div>
    <div class="summary-card margin">
      <span class="card-label">{{ t('dashboard.historico.summary.avgMargin') }}</span>
      <span class="card-value">{{ summary.avgMarginPercent }}%</span>
    </div>
  </div>
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.summary-card {
  padding: 1rem 1.25rem;
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-card .card-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  opacity: 0.8;
}

.summary-card .card-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1.2;
}

.summary-card.sales {
  background: var(--color-indigo-100);
  color: var(--color-indigo-800);
}

.summary-card.revenue {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.summary-card.profit {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}

.summary-card.profit.negative {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.summary-card.margin {
  background: var(--color-purple-100);
  color: var(--color-purple-600);
}

@media (min-width: 30em) {
  .summary-cards {
    gap: 1rem;
  }

  .summary-card .card-value {
    font-size: 1.75rem;
  }
}

@media (min-width: 48em) {
  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
