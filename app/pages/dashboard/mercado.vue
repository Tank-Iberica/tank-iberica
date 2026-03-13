<script setup lang="ts">
import { useDashboardMercado } from '~/composables/dashboard/useDashboardMercado'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  report,
  loading,
  error,
  hasSufficientData,
  summaryCards,
  avgDeviationLabel,
  fetchReport,
  positionClass,
  positionIcon,
  formatDeviation,
} = useDashboardMercado()

onMounted(() => fetchReport())
</script>

<template>
  <div class="mercado-page">
    <header class="mercado-header">
      <h1>{{ t('dealer.mercado.title') }}</h1>
      <p class="mercado-subtitle">{{ t('dealer.mercado.subtitle') }}</p>
    </header>

    <!-- Error -->
    <div v-if="error" class="alert-error" role="alert">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="mercado-skeleton" aria-busy="true">
      <div class="skeleton-row">
        <UiSkeletonCard v-for="n in 3" :key="n" :lines="2" />
      </div>
      <UiSkeletonCard :lines="8" />
    </div>

    <template v-else-if="report">
      <!-- Summary cards -->
      <div class="summary-grid">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="summary-card"
          :class="card.colorClass"
        >
          <span class="summary-card__count">{{ card.count }}</span>
          <span class="summary-card__label">{{ card.label }}</span>
        </div>

        <div class="summary-card card-avg">
          <span class="summary-card__count">{{ avgDeviationLabel }}</span>
          <span class="summary-card__label">{{ t('dealer.mercado.avgDeviation') }}</span>
        </div>
      </div>

      <!-- No data -->
      <div v-if="!hasSufficientData" class="no-data">
        <p>{{ t('dealer.mercado.noData') }}</p>
      </div>

      <!-- Vehicle insights table -->
      <div v-else class="insights-table-wrap">
        <h2 class="insights-title">{{ t('dealer.mercado.vehiclesTitle') }}</h2>
        <table class="insights-table" role="table">
          <thead>
            <tr>
              <th>{{ t('dealer.mercado.colVehicle') }}</th>
              <th class="text-right">{{ t('dealer.mercado.colDealerPrice') }}</th>
              <th class="text-right">{{ t('dealer.mercado.colMarketAvg') }}</th>
              <th class="text-center">{{ t('dealer.mercado.colPosition') }}</th>
              <th class="text-right">{{ t('dealer.mercado.colDeviation') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in report.insights" :key="row.vehicleId">
              <td>{{ row.brand }} {{ row.model }}</td>
              <td class="text-right">{{ row.dealerPrice.toLocaleString() }}€</td>
              <td class="text-right">{{ row.marketAvg.toLocaleString() }}€</td>
              <td class="text-center">
                <span class="position-badge" :class="positionClass(row.pricePosition)">
                  {{ positionIcon(row.pricePosition) }}
                  {{ t(`dealer.mercado.position.${row.pricePosition}`) }}
                </span>
              </td>
              <td class="text-right deviation-cell" :class="positionClass(row.pricePosition)">
                {{ formatDeviation(row.priceDeviationPercent) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Suggestions -->
        <div class="suggestions">
          <h2 class="suggestions-title">{{ t('dealer.mercado.suggestionsTitle') }}</h2>
          <ul class="suggestion-list">
            <li
              v-for="row in report.insights.filter((r) => r.suggestion)"
              :key="row.vehicleId"
              class="suggestion-item"
              :class="positionClass(row.pricePosition)"
            >
              {{ row.suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mercado-page {
  max-width: 60rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.mercado-header h1 {
  margin: 0 0 0.25rem;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.mercado-subtitle {
  color: var(--text-secondary);
  margin: 0;
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.skeleton-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* Summary grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 30em) {
  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.summary-card__count {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.summary-card__label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.card-below .summary-card__count {
  color: var(--color-success);
}
.card-above .summary-card__count {
  color: var(--color-error);
}
.card-at .summary-card__count {
  color: var(--color-primary, #23424a);
}
.card-avg .summary-card__count {
  color: var(--text-primary);
}

.no-data {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

/* Table */
.insights-title,
.suggestions-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.insights-table-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  overflow-x: auto;
}

.insights-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.insights-table th,
.insights-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  text-align: left;
}

.insights-table th {
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}

.position-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.pos-below {
  color: #065f46;
  background: #d1fae5;
}
.pos-above {
  color: #991b1b;
  background: #fee2e2;
}
.pos-average {
  color: #1e40af;
  background: #dbeafe;
}

.deviation-cell.pos-below {
  color: var(--color-success);
  font-weight: 600;
}
.deviation-cell.pos-above {
  color: var(--color-error);
  font-weight: 600;
}

/* Suggestions */
.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-item {
  padding: 0.625rem 0.875rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  border-left: 3px solid transparent;
}

.suggestion-item.pos-below {
  background: #f0fdf4;
  border-color: var(--color-success);
  color: #14532d;
}
.suggestion-item.pos-above {
  background: #fef2f2;
  border-color: var(--color-error);
  color: #7f1d1d;
}
.suggestion-item.pos-average {
  background: var(--bg-secondary);
  border-color: var(--color-primary, #23424a);
  color: var(--text-primary);
}

@media (min-width: 48em) {
  .mercado-page {
    padding: var(--spacing-6);
  }
}
</style>
