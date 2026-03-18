<script setup lang="ts">
import { useAdminSearchAnalytics } from '~/composables/admin/useAdminSearchAnalytics'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const {
  loading,
  error,
  summary,
  paginatedZeroResults,
  dailyTrend,
  totalPages,
  page,
  days,
  periodLabel,
  fetchAnalytics,
  setDays,
  goToPage,
} = useAdminSearchAnalytics()

const DAY_OPTIONS = [7, 14, 30, 60, 90]

onMounted(() => {
  fetchAnalytics()
})
</script>

<template>
  <div class="search-analytics-page">
    <header class="sa-header">
      <h1 class="sa-title">{{ t('admin.searchAnalytics.title', 'Analítica de búsquedas') }}</h1>
      <div class="sa-filters">
        <label class="sa-period-label">
          {{ t('admin.searchAnalytics.period', 'Período') }}:
          <select
            :value="days"
            class="sa-period-select"
            @change="setDays(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="d in DAY_OPTIONS" :key="d" :value="d">
              {{ d }} {{ t('common.days', 'días') }}
            </option>
          </select>
        </label>
        <span v-if="periodLabel" class="sa-period-range">{{ periodLabel }}</span>
      </div>
    </header>

    <div v-if="error" class="sa-error" role="alert">{{ error }}</div>

    <div v-if="loading" class="sa-loading" aria-busy="true">
      <UiSkeletonCard v-for="n in 3" :key="n" :lines="2" />
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="sa-kpis">
        <div class="sa-kpi-card">
          <span class="sa-kpi-value">{{ summary.totalSearches.toLocaleString() }}</span>
          <span class="sa-kpi-label">{{
            t('admin.searchAnalytics.totalSearches', 'Búsquedas totales')
          }}</span>
        </div>
        <div class="sa-kpi-card">
          <span class="sa-kpi-value">{{ summary.zeroResultSearches.toLocaleString() }}</span>
          <span class="sa-kpi-label">{{
            t('admin.searchAnalytics.zeroResults', 'Sin resultados')
          }}</span>
        </div>
        <div class="sa-kpi-card" :class="{ 'sa-kpi-card--alert': summary.zeroResultRate > 30 }">
          <span class="sa-kpi-value">{{ summary.zeroResultRate }}%</span>
          <span class="sa-kpi-label">{{
            t('admin.searchAnalytics.zeroRate', 'Tasa sin resultados')
          }}</span>
        </div>
      </div>

      <!-- Zero Results Table -->
      <section class="sa-section">
        <h2 class="sa-section-title">
          {{ t('admin.searchAnalytics.topZeroResults', 'Top búsquedas sin resultados') }}
        </h2>
        <div v-if="paginatedZeroResults.length" class="sa-table-wrap">
          <table class="sa-table">
            <thead>
              <tr>
                <th>{{ t('admin.searchAnalytics.queryCol', 'Búsqueda') }}</th>
                <th>{{ t('admin.searchAnalytics.countCol', 'Veces') }}</th>
                <th>{{ t('admin.searchAnalytics.lastSeenCol', 'Última vez') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in paginatedZeroResults" :key="entry.query">
                <td class="sa-query-cell">{{ entry.query }}</td>
                <td class="sa-count-cell">{{ entry.count }}</td>
                <td class="sa-date-cell">
                  {{ entry.lastSeen ? new Date(entry.lastSeen).toLocaleDateString() : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
          <!-- Pagination -->
          <nav
            v-if="totalPages > 1"
            class="sa-pagination"
            :aria-label="t('common.pagination', 'Paginación')"
          >
            <button class="sa-pagination-btn" :disabled="page <= 1" @click="goToPage(page - 1)">
              &laquo;
            </button>
            <span class="sa-pagination-info">{{ page }} / {{ totalPages }}</span>
            <button
              class="sa-pagination-btn"
              :disabled="page >= totalPages"
              @click="goToPage(page + 1)"
            >
              &raquo;
            </button>
          </nav>
        </div>
        <p v-else class="sa-empty">
          {{
            t(
              'admin.searchAnalytics.noZeroResults',
              'No hay búsquedas sin resultados en este período.',
            )
          }}
        </p>
      </section>

      <!-- Daily Trend -->
      <section v-if="dailyTrend.length" class="sa-section">
        <h2 class="sa-section-title">
          {{ t('admin.searchAnalytics.dailyTrend', 'Tendencia diaria') }}
        </h2>
        <div class="sa-trend-grid">
          <div v-for="day in dailyTrend" :key="day.date" class="sa-trend-day">
            <span class="sa-trend-date">{{ day.date.slice(5) }}</span>
            <span class="sa-trend-zero">{{ day.zeroResults }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.search-analytics-page {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-4);
}

.sa-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.sa-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.sa-filters {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.sa-period-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.sa-period-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.sa-period-range {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.sa-error {
  padding: var(--spacing-3);
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error, #dc2626);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.sa-loading {
  display: grid;
  gap: var(--spacing-4);
}

.sa-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.sa-kpi-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.sa-kpi-card--alert {
  border-color: var(--color-warning, #f59e0b);
}

.sa-kpi-value {
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: 700;
  color: var(--text-primary);
}

.sa-kpi-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sa-section {
  margin-bottom: var(--spacing-6);
}

.sa-section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3);
}

.sa-table-wrap {
  overflow-x: auto;
}

.sa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.sa-table th {
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

.sa-table td {
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--border-color-light);
}

.sa-query-cell {
  max-width: 20rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sa-count-cell {
  font-weight: 600;
  text-align: center;
  min-width: 4rem;
}

.sa-date-cell {
  color: var(--text-auxiliary);
  white-space: nowrap;
}

.sa-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  margin-top: var(--spacing-3);
}

.sa-pagination-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  min-width: 2.75rem;
  min-height: 2.75rem;
}

.sa-pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sa-pagination-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.sa-empty {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.sa-trend-grid {
  display: flex;
  gap: var(--spacing-1);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
}

.sa-trend-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  min-width: 2.5rem;
}

.sa-trend-date {
  font-size: 0.625rem;
  color: var(--text-auxiliary);
}

.sa-trend-zero {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-warning, #f59e0b);
}
</style>
