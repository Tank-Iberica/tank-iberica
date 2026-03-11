<script setup lang="ts">
/**
 * Summary KPI cards for the rentals page.
 * Shows active count, monthly income, and vehicles available soon.
 */

defineProps<{
  totalActiveRentals: number
  totalMonthlyIncome: number
  vehiclesAvailableSoon: number
  fmt: (val: number) => string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="summary-cards">
    <div class="summary-card active-rentals">
      <span class="card-label">{{ t('dashboard.tools.rentals.summary.activeRentals') }}</span>
      <span class="card-value">{{ totalActiveRentals }}</span>
    </div>
    <div class="summary-card monthly-income">
      <span class="card-label">{{ t('dashboard.tools.rentals.summary.monthlyIncome') }}</span>
      <span class="card-value">{{ fmt(totalMonthlyIncome) }}</span>
    </div>
    <div class="summary-card available-soon">
      <span class="card-label">{{ t('dashboard.tools.rentals.summary.availableSoon') }}</span>
      <span class="card-value">{{ vehiclesAvailableSoon }}</span>
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

.summary-card.active-rentals {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}

.summary-card.monthly-income {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.summary-card.available-soon {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

(@media ()max-width: 47.9375em())) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
