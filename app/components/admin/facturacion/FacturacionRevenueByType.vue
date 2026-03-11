<script setup lang="ts">
import { formatAmount, getServiceTypeLabel } from '~/composables/admin/useAdminFacturacion'

const { t } = useI18n()

const props = defineProps<{
  revenueByType: [string, number][]
  totalRevenue: number
}>()

function getRevenuePercentage(amount: number): number {
  if (props.totalRevenue === 0) return 0
  return (amount / props.totalRevenue) * 100
}
</script>

<template>
  <div class="section-card">
    <h2 class="section-title">{{ t('billing.byType') }}</h2>
    <div class="type-list">
      <div v-for="[type, amount] in revenueByType" :key="type" class="type-row">
        <div class="type-info">
          <span class="type-label">{{ getServiceTypeLabel(type) }}</span>
          <span class="type-amount">{{ formatAmount(amount) }}</span>
        </div>
        <div class="type-bar-bg">
          <div class="type-bar-fill" :style="{ width: `${getRevenuePercentage(amount)}%` }" />
        </div>
        <span class="type-pct">{{ getRevenuePercentage(amount).toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-card {
  background: var(--bg-primary, var(--color-white));
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, var(--shadow-sm));
  padding: var(--spacing-4) var(--spacing-5);
}

.section-title {
  margin: 0 0 var(--spacing-4) 0;
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, var(--text-primary));
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.type-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-label {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, var(--text-primary));
}

.type-amount {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, var(--text-primary));
  font-variant-numeric: tabular-nums;
}

.type-bar-bg {
  width: 100%;
  height: 0.5rem;
  background: var(--color-gray-100, var(--color-gray-100));
  border-radius: var(--border-radius-full, 9999px);
  overflow: hidden;
}

.type-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-full, 9999px);
  transition: width var(--transition-normal, 300ms ease);
  min-width: 0.25rem;
}

.type-pct {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--text-auxiliary, var(--text-auxiliary));
  font-variant-numeric: tabular-nums;
  text-align: right;
}

@media (min-width: 48em) {
  .type-row {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-4);
  }

  .type-info {
    min-width: 15rem;
    flex-shrink: 0;
  }

  .type-bar-bg {
    flex: 1;
  }

  .type-pct {
    min-width: 3.125rem;
  }
}

@media (min-width: 64em) {
  .section-card {
    padding: var(--spacing-6) var(--spacing-8);
  }
}
</style>
