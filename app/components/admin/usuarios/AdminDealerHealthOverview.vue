<script setup lang="ts">
/**
 * AdminDealerHealthOverview — Admin view of all dealers' health scores.
 *
 * Shows a table of dealers sorted by health score with badge indicators.
 * Uses GET /api/admin/dealers/health-scores.
 */
interface DealerHealthRow {
  id: string
  company_name: string | null
  healthTotal: number
  badge: 'top' | 'verified' | 'none'
  activeVehicles: number
  avg_response_time_hours: number | null
}

const { t } = useI18n()

const rows = ref<DealerHealthRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const filterBadge = ref<'all' | 'top' | 'verified' | 'none'>('all')

const filtered = computed(() => {
  if (filterBadge.value === 'all') return rows.value
  return rows.value.filter((r: DealerHealthRow) => r.badge === filterBadge.value)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{ ok: boolean; dealers: DealerHealthRow[] }>(
      '/api/admin/dealers/health-scores',
      { query: { limit: 100 } },
    )
    rows.value = (res.dealers ?? []).sort((a, b) => b.healthTotal - a.healthTotal)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error loading dealer scores'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

function scoreClass(total: number): string {
  if (total >= 80) return 'score-top'
  if (total >= 60) return 'score-verified'
  return 'score-low'
}

function badgeLabel(badge: DealerHealthRow['badge']): string {
  if (badge === 'top') return t('dealer.badge.topDealer')
  if (badge === 'verified') return t('dealer.badge.verified')
  return t('admin.dealerHealth.noBadge')
}
</script>

<template>
  <div class="dealer-health-overview">
    <div class="overview-header">
      <h2>{{ t('admin.dealerHealth.title') }}</h2>
      <div class="filter-tabs" role="tablist">
        <button
          v-for="f in ['all', 'top', 'verified', 'none'] as const"
          :key="f"
          class="filter-tab"
          :class="{ active: filterBadge === f }"
          role="tab"
          :aria-selected="filterBadge === f"
          @click="filterBadge = f"
        >
          {{ t(`admin.dealerHealth.filter.${f}`) }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert-error" role="alert">{{ error }}</div>

    <div v-if="loading" aria-busy="true" class="loading-grid">
      <UiSkeletonCard v-for="n in 5" :key="n" :lines="2" />
    </div>

    <template v-else>
      <div v-if="filtered.length === 0" class="empty-state">
        {{ t('admin.dealerHealth.empty') }}
      </div>

      <table v-else class="health-table" role="table">
        <thead>
          <tr>
            <th>{{ t('admin.dealerHealth.colDealer') }}</th>
            <th class="text-center">{{ t('admin.dealerHealth.colScore') }}</th>
            <th class="text-center">{{ t('admin.dealerHealth.colBadge') }}</th>
            <th class="text-right">{{ t('admin.dealerHealth.colVehicles') }}</th>
            <th class="text-right">{{ t('admin.dealerHealth.colResponse') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <td>
              <span class="dealer-name">{{
                row.company_name || t('admin.dealerHealth.unknown')
              }}</span>
            </td>
            <td class="text-center">
              <span class="score-value" :class="scoreClass(row.healthTotal)">
                {{ row.healthTotal }}
              </span>
            </td>
            <td class="text-center">
              <span class="badge-pill" :class="`badge-${row.badge}`">
                {{ badgeLabel(row.badge) }}
              </span>
            </td>
            <td class="text-right">{{ row.activeVehicles }}</td>
            <td class="text-right">
              <span v-if="row.avg_response_time_hours !== null">
                {{ row.avg_response_time_hours }}h
              </span>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.dealer-health-overview {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.overview-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 0.375rem;
}

.filter-tab {
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.filter-tab.active {
  background: var(--color-primary, #23424a);
  border-color: var(--color-primary, #23424a);
  color: white;
}

.alert-error {
  padding: 0.75rem 1rem;
  background: var(--color-error-bg);
  border-radius: var(--border-radius);
  color: var(--color-error);
  margin-bottom: 1rem;
}

.loading-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.health-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  overflow-x: auto;
  display: block;
}

.health-table th,
.health-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  text-align: left;
  white-space: nowrap;
}

.health-table th {
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.text-muted {
  color: var(--text-secondary);
}

.dealer-name {
  font-weight: 500;
  color: var(--text-primary);
}

.score-value {
  font-weight: 700;
  font-size: var(--font-size-base);
}

.score-top {
  color: var(--color-success);
}
.score-verified {
  color: #1d4ed8;
}
.score-low {
  color: var(--text-secondary);
}

.badge-pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.badge-top {
  background: #dbeafe;
  color: #1d4ed8;
}
.badge-verified {
  background: #d1fae5;
  color: #065f46;
}
.badge-none {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
</style>
