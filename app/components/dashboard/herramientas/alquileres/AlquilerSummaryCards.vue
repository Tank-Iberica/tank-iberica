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

.summary-card.active-rentals {
  background: var(--color-success-bg, #dcfce7);
  color: #166534;
}

.summary-card.monthly-income {
  background: var(--color-info-bg, #dbeafe);
  color: #1e40af;
}

.summary-card.available-soon {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

@media (max-width: 767px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
