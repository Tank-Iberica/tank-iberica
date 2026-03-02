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

.summary-card.cost-year {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.summary-card.total-records {
  background: var(--color-info-bg, #dbeafe);
  color: #1e40af;
}

.summary-card.avg-cost {
  background: #f3e8ff;
  color: #7c3aed;
}

@media (max-width: 767px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
