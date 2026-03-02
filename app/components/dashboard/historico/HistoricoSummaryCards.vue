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
  gap: 12px;
}

.summary-card {
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card .card-label {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
}

.summary-card .card-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-card.sales {
  background: #e0e7ff;
  color: #3730a3;
}

.summary-card.revenue {
  background: var(--color-info-bg, #dbeafe);
  color: #1e40af;
}

.summary-card.profit {
  background: var(--color-success-bg, #dcfce7);
  color: #166534;
}

.summary-card.profit.negative {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.summary-card.margin {
  background: #f3e8ff;
  color: #7c3aed;
}

@media (min-width: 480px) {
  .summary-cards {
    gap: 16px;
  }

  .summary-card .card-value {
    font-size: 1.75rem;
  }
}

@media (min-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
