<script setup lang="ts">
import type { ChurnRate } from '~/composables/admin/useAdminMetrics'
import { formatNumber } from '~/composables/admin/useAdminDashboardPage'

defineProps<{
  churnData: ChurnRate
}>()
</script>

<template>
  <section class="churn-card">
    <h2 class="churn-card__title">{{ $t('admin.metrics.churnTitle') }}</h2>
    <div v-if="!churnData" class="churn-card__empty">
      {{ $t('admin.metrics.noData') }}
    </div>
    <div v-else class="churn-card__body">
      <div class="churn-stats">
        <div class="churn-stat">
          <span class="churn-stat__label">{{ $t('admin.metrics.totalDealers') }}</span>
          <span class="churn-stat__value">{{ formatNumber(churnData.totalDealers) }}</span>
        </div>
        <div class="churn-stat">
          <span class="churn-stat__label">{{ $t('admin.metrics.cancelledDealers') }}</span>
          <span class="churn-stat__value churn-stat__value--cancelled">{{
            formatNumber(churnData.cancelledDealers)
          }}</span>
        </div>
        <div class="churn-stat">
          <span class="churn-stat__label">{{ $t('admin.metrics.churnRate') }}</span>
          <span class="churn-stat__value churn-stat__value--rate"
            >{{ churnData.churnRate.toFixed(1) }}%</span
          >
        </div>
      </div>
      <div class="churn-progress">
        <div class="churn-progress__track">
          <div
            class="churn-progress__bar"
            :style="{ width: `${Math.min(churnData.churnRate, 100)}%` }"
            :class="{
              'churn-progress__bar--low': churnData.churnRate < 5,
              'churn-progress__bar--medium': churnData.churnRate >= 5 && churnData.churnRate < 15,
              'churn-progress__bar--high': churnData.churnRate >= 15,
            }"
          />
        </div>
        <span class="churn-progress__label">{{ churnData.churnRate.toFixed(1) }}%</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.churn-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.churn-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.churn-card__empty {
  padding: var(--spacing-8) 0;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.churn-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.churn-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3);
}

.churn-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-1);
}

.churn-stat__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
}

.churn-stat__value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.churn-stat__value--cancelled {
  color: var(--color-error);
}

.churn-stat__value--rate {
  color: var(--color-warning);
}

.churn-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.churn-progress__track {
  flex: 1;
  height: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.churn-progress__bar {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width var(--transition-normal);
  min-width: 4px;
}

.churn-progress__bar--low {
  background: var(--color-success);
}

.churn-progress__bar--medium {
  background: var(--color-warning);
}

.churn-progress__bar--high {
  background: var(--color-error);
}

.churn-progress__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  min-width: 48px;
  text-align: right;
}

@media (min-width: 768px) {
  .churn-stat__value {
    font-size: var(--font-size-2xl);
  }
}
</style>
