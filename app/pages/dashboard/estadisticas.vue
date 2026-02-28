<script setup lang="ts">
/**
 * Analytics Page
 * Plan-gated stats display. Free: totals only. Basic+: per-vehicle breakdowns.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { statsLevel, currentPlan, fetchSubscription } = useSubscriptionPlan(
  userId.value || undefined,
)

const loading = ref(true)
const error = ref<string | null>(null)

const totals = ref({
  totalViews: 0,
  totalLeads: 0,
  totalFavorites: 0,
})

interface VehicleStat {
  id: string
  brand: string
  model: string
  year: number | null
  views: number
  leads: number
}

const vehicleStats = ref<VehicleStat[]>([])

async function loadStats(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) return

    await fetchSubscription()

    // Totals - available for all plans
    const [viewsRes, leadsRes, favsRes] = await Promise.all([
      supabase.from('dealer_stats').select('total_views').eq('dealer_id', dealer.id).maybeSingle(),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', dealer.id),
      supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', dealer.id),
    ])

    totals.value = {
      totalViews: (viewsRes.data as { total_views: number } | null)?.total_views || 0,
      totalLeads: leadsRes.count || 0,
      totalFavorites: favsRes.count || 0,
    }

    // Per-vehicle stats - only for standard and full
    if (statsLevel.value !== 'basic') {
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, brand, model, year')
        .eq('dealer_id', dealer.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20)

      type VehicleStat = {
        id: string
        brand: string
        model: string
        year: number | null
        views: number
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawVehicles = (vehiclesData || []) as any as VehicleStat[]
      vehicleStats.value = rawVehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        views: v.views || 0,
        leads: 0,
      }))

      // Fetch lead counts per vehicle
      if (vehicleStats.value.length > 0) {
        for (const vs of vehicleStats.value) {
          const { count } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('vehicle_id', vs.id)
          vs.leads = count || 0
        }
      }
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading stats'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <div class="stats-page">
    <header class="page-header">
      <h1>{{ t('dashboard.stats.title') }}</h1>
      <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
    </header>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <!-- Total Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ totals.totalViews }}</span>
          <span class="stat-label">{{ t('dashboard.stats.totalViews') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totals.totalLeads }}</span>
          <span class="stat-label">{{ t('dashboard.stats.totalLeads') }}</span>
        </div>
        <div v-if="statsLevel !== 'basic'" class="stat-card">
          <span class="stat-value">{{ totals.totalFavorites }}</span>
          <span class="stat-label">{{ t('dashboard.stats.totalFavorites') }}</span>
        </div>
      </div>

      <!-- Per Vehicle Stats (standard+) -->
      <section v-if="statsLevel !== 'basic'" class="card">
        <h2>{{ t('dashboard.stats.perVehicle') }}</h2>
        <div v-if="vehicleStats.length === 0" class="empty-state">
          <p>{{ t('dashboard.stats.noVehicles') }}</p>
        </div>
        <div v-else class="vehicle-table">
          <div class="table-header">
            <span class="col-vehicle">{{ t('dashboard.stats.vehicle') }}</span>
            <span class="col-num">{{ t('dashboard.stats.views') }}</span>
            <span class="col-num">{{ t('dashboard.stats.leads') }}</span>
          </div>
          <div v-for="vs in vehicleStats" :key="vs.id" class="table-row">
            <span class="col-vehicle">
              {{ vs.brand }} {{ vs.model }}
              <span v-if="vs.year" class="year">({{ vs.year }})</span>
            </span>
            <span class="col-num">{{ vs.views }}</span>
            <span class="col-num">{{ vs.leads }}</span>
          </div>
        </div>
      </section>

      <!-- Upgrade CTA for free plan -->
      <div v-if="statsLevel === 'basic'" class="upgrade-card">
        <h3>{{ t('dashboard.stats.upgradeTitle') }}</h3>
        <p>{{ t('dashboard.stats.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
          {{ t('dashboard.stats.upgradeCta') }}
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.plan-badge {
  padding: 4px 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.empty-state {
  text-align: center;
  padding: 32px 20px;
  color: #64748b;
}

.vehicle-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  padding: 10px 0;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
}

.table-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  color: #334155;
  min-height: 44px;
  align-items: center;
}

.col-vehicle {
  flex: 1;
  font-weight: 500;
}

.col-vehicle .year {
  color: #94a3b8;
  font-weight: 400;
}

.col-num {
  width: 80px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.upgrade-card {
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.upgrade-card h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #1e40af;
}

.upgrade-card p {
  margin: 0 0 16px 0;
  color: #3b82f6;
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

@media (min-width: 768px) {
  .stats-page {
    padding: 24px;
  }
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
