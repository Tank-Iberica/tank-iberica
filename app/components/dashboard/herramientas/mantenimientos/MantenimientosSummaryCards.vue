<script setup lang="ts">
/**
 * Summary KPI cards for the maintenance page.
 * Shows cost this year, total records, and average cost.
 */

defineProps<{
  summaryTotalCostThisYear: number
  summaryTotalRecords: number
  summaryAvgCost: number
  fmt: (val: number) => string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="summary-cards">
    <div class="summary-card cost-year">
      <span class="card-label">{{ t('dashboard.tools.maintenance.summary.costThisYear') }}</span>
      <span class="card-value">{{ fmt(summaryTotalCostThisYear) }}</span>
    </div>
    <div class="summary-card total-records">
      <span class="card-label">{{ t('dashboard.tools.maintenance.summary.totalRecords') }}</span>
      <span class="card-value">{{ summaryTotalRecords }}</span>
    </div>
    <div class="summary-card avg-cost">
      <span class="card-label">{{ t('dashboard.tools.maintenance.summary.avgCost') }}</span>
      <span class="card-value">{{ fmt(summaryAvgCost) }}</span>
    </div>
  </div>
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.summary-card.cost-year {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.summary-card.total-records {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.summary-card.avg-cost {
  background: var(--color-purple-100);
  color: var(--color-purple-600);
}

@media (max-width: 47.9375em) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
