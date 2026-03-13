<script setup lang="ts">
/**
 * AdminLifecycleReport — Admin view of fleet lifecycle statistics.
 *
 * Shows breakdown of vehicle statuses across all dealers:
 * - Status distribution (published, expired, paused, sold, etc.)
 * - Recent transitions (last 7 days)
 * - Dealers with most expired listings (action needed)
 */
import { STATUS_META } from '~/composables/useListingLifecycle'
import type { VehicleStatus } from '~/composables/useListingLifecycle'

const { t } = useI18n()
const supabase = useSupabaseClient()

interface StatusCount {
  status: VehicleStatus
  count: number
}

interface DealerExpiry {
  company_name: string
  dealer_id: string
  expiredCount: number
}

interface RecentTransition {
  entity_id: string
  metadata: { from: VehicleStatus; to: VehicleStatus; dealer_id: string; timestamp: string; reason?: string }
  created_at: string
}

const statusCounts = ref<StatusCount[]>([])
const dealersWithExpired = ref<DealerExpiry[]>([])
const recentTransitions = ref<RecentTransition[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const total = computed(() => statusCounts.value.reduce((s, r) => s + r.count, 0))

async function load() {
  loading.value = true
  error.value = null

  try {
    // Status distribution
    const { data: vehicles, error: vErr } = await supabase
      .from('vehicles')
      .select('status')

    if (vErr) throw vErr

    const counts = new Map<VehicleStatus, number>()
    for (const v of (vehicles ?? []) as Array<{ status: VehicleStatus }>) {
      counts.set(v.status, (counts.get(v.status) ?? 0) + 1)
    }

    statusCounts.value = Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)

    // Dealers with expired listings
    const { data: expired, error: eErr } = await supabase
      .from('vehicles')
      .select('dealer_id, dealers!inner(company_name)')
      .eq('status', 'expired')

    if (!eErr && expired) {
      const dealerMap = new Map<string, DealerExpiry>()
      for (const v of expired as Array<{ dealer_id: string; dealers: { company_name: string } }>) {
        const existing = dealerMap.get(v.dealer_id) ?? { company_name: v.dealers.company_name, dealer_id: v.dealer_id, expiredCount: 0 }
        existing.expiredCount++
        dealerMap.set(v.dealer_id, existing)
      }
      dealersWithExpired.value = Array.from(dealerMap.values())
        .sort((a, b) => b.expiredCount - a.expiredCount)
        .slice(0, 10)
    }

    // Recent transitions (last 7 days)
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const { data: transitions, error: tErr } = await supabase
      .from('analytics_events')
      .select('entity_id, metadata, created_at')
      .eq('event_type', 'status_transition')
      .eq('entity_type', 'vehicle')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (!tErr && transitions) {
      recentTransitions.value = transitions as RecentTransition[]
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error loading lifecycle report'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

function pct(count: number): number {
  return total.value > 0 ? Math.round((count / total.value) * 100) : 0
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="lifecycle-report">
    <div class="report-header">
      <h2>{{ t('admin.lifecycle.title') }}</h2>
      <button class="refresh-btn" :disabled="loading" @click="load">
        {{ loading ? t('admin.lifecycle.loading') : t('admin.lifecycle.refresh') }}
      </button>
    </div>

    <div v-if="error" class="error-msg" role="alert">{{ error }}</div>

    <div v-if="loading" class="loading-grid">
      <UiSkeletonCard v-for="n in 3" :key="n" :lines="3" />
    </div>

    <template v-else>
      <!-- Status distribution -->
      <section class="report-section">
        <h3>{{ t('admin.lifecycle.statusDistribution') }}</h3>
        <div class="status-grid">
          <div
            v-for="row in statusCounts"
            :key="row.status"
            class="status-card"
          >
            <div class="status-info">
              <span class="status-dot" :style="{ background: STATUS_META[row.status]?.color ?? '#999' }" />
              <span class="status-name">
                {{ STATUS_META[row.status]?.label[$i18n.locale] ?? row.status }}
              </span>
            </div>
            <div class="status-bar-wrap">
              <div
                class="status-bar"
                :style="{ width: `${pct(row.count)}%`, background: STATUS_META[row.status]?.color ?? '#999' }"
              />
            </div>
            <div class="status-count">
              <strong>{{ row.count }}</strong>
              <span class="status-pct">{{ pct(row.count) }}%</span>
            </div>
          </div>
          <div v-if="statusCounts.length === 0" class="empty-state">
            {{ t('admin.lifecycle.empty') }}
          </div>
        </div>
      </section>

      <!-- Dealers with most expired -->
      <section v-if="dealersWithExpired.length > 0" class="report-section">
        <h3>{{ t('admin.lifecycle.dealersExpired') }}</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>{{ t('admin.lifecycle.dealer') }}</th>
              <th class="text-right">{{ t('admin.lifecycle.expiredCount') }}</th>
              <th class="text-right">{{ t('admin.lifecycle.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in dealersWithExpired" :key="d.dealer_id">
              <td>{{ d.company_name }}</td>
              <td class="text-right">
                <span class="badge-expired">{{ d.expiredCount }}</span>
              </td>
              <td class="text-right">
                <NuxtLink :to="`/admin/vehiculos?dealer=${d.dealer_id}&status=expired`" class="link-action">
                  {{ t('admin.lifecycle.viewListings') }}
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Recent transitions -->
      <section v-if="recentTransitions.length > 0" class="report-section">
        <h3>{{ t('admin.lifecycle.recentTransitions') }}</h3>
        <ul class="transitions-list">
          <li v-for="(tx, i) in recentTransitions" :key="i" class="transition-row">
            <span class="tx-status" :style="{ color: STATUS_META[tx.metadata?.from]?.color }">
              {{ STATUS_META[tx.metadata?.from]?.label[$i18n.locale] ?? tx.metadata?.from }}
            </span>
            →
            <span class="tx-status" :style="{ color: STATUS_META[tx.metadata?.to]?.color }">
              {{ STATUS_META[tx.metadata?.to]?.label[$i18n.locale] ?? tx.metadata?.to }}
            </span>
            <span v-if="tx.metadata?.reason" class="tx-reason">{{ tx.metadata.reason }}</span>
            <span class="tx-date">{{ formatDate(tx.created_at) }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.lifecycle-report {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.report-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.refresh-btn {
  padding: 0.375rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.75rem;
}

.refresh-btn:disabled {
  opacity: 0.5;
}

.error-msg {
  padding: 0.75rem;
  background: var(--color-error-bg);
  color: var(--color-error);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
}

.loading-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-section h3 {
  margin: 0 0 0.75rem;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-secondary);
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-card {
  display: grid;
  grid-template-columns: 7rem 1fr 5rem;
  align-items: center;
  gap: 0.75rem;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.status-bar-wrap {
  height: 0.5rem;
  background: var(--bg-tertiary, var(--bg-secondary));
  border-radius: 9999px;
  overflow: hidden;
}

.status-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s;
  min-width: 2px;
}

.status-count {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  justify-content: flex-end;
  font-size: var(--font-size-sm);
}

.status-pct {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.empty-state {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: 1rem;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.report-table th {
  text-align: left;
  padding: 0.5rem 0.625rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.report-table td {
  padding: 0.5rem 0.625rem;
  border-bottom: 1px solid var(--border-light);
}

.text-right { text-align: right; }

.badge-expired {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.link-action {
  color: var(--color-primary, #23424A);
  font-size: var(--font-size-xs);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.transitions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.transition-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-xs);
  flex-wrap: wrap;
}

.tx-status {
  font-weight: 600;
}

.tx-reason {
  font-style: italic;
  color: var(--text-secondary);
}

.tx-date {
  margin-left: auto;
  color: var(--text-secondary);
}

@media (min-width: 768px) {
  .status-card {
    grid-template-columns: 9rem 1fr 5.5rem;
  }
}
</style>
