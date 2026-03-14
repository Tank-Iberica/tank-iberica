<script setup lang="ts">
/**
 * Analytics Page
 * Plan-gated stats display.
 * - Free/basic:  totals only
 * - Standard:    per-vehicle breakdowns + conversion rate
 * - Full:        + market comparison (price positioning, demand, # competitors)
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
  price: number | null
}

interface MarketComparison {
  dealerAvgPrice: number | null
  marketAvgPrice: number | null
  pricePositionPercent: number | null // positive = dealer is above market
  competitorCount: number
  conversionRate: number | null // leads/views * 100
}

const vehicleStats = ref<VehicleStat[]>([])
const marketComparison = ref<MarketComparison | null>(null)

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
        .select('id, brand, model, year, price')
        .eq('dealer_id', dealer.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20)

      type VehicleRow = {
        id: string
        brand: string
        model: string
        year: number | null
        price: number | null
      }
      const rawVehicles = (vehiclesData || []) as VehicleRow[]
      vehicleStats.value = rawVehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        views: 0,
        leads: 0,
        price: v.price,
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

    // Market comparison - only for full plan
    if (statsLevel.value === 'full' && vehicleStats.value.length > 0) {
      await loadMarketComparison(dealer.id)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading stats'
  } finally {
    loading.value = false
  }
}

async function loadMarketComparison(dealerId: string): Promise<void> {
  try {
    // Fetch dealer's category IDs from their published vehicles
    const { data: dealerVehicles } = await supabase
      .from('vehicles')
      .select('price, category_id')
      .eq('dealer_id', dealerId)
      .eq('status', 'published')
      .limit(50)

    if (!dealerVehicles || dealerVehicles.length === 0) return

    type VehiclePrice = { price: number | null; category_id: string | null }
    const typed = dealerVehicles as VehiclePrice[]
    const dealerPrices = typed.map((v) => v.price).filter((p): p is number => p != null)
    const categoryIds = [...new Set(typed.map((v) => v.category_id).filter(Boolean))] as string[]

    const dealerAvgPrice =
      dealerPrices.length > 0
        ? Math.round(dealerPrices.reduce((a, b) => a + b, 0) / dealerPrices.length)
        : null

    // Fetch market-wide avg for same categories (excluding this dealer)
    const { data: marketVehicles } = await supabase
      .from('vehicles')
      .select('price')
      .neq('dealer_id', dealerId)
      .eq('status', 'published')
      .in('category_id', categoryIds.length > 0 ? categoryIds : ['__no_match__'])
      .limit(200)

    type MarketVehicle = { price: number | null }
    const marketPrices = ((marketVehicles || []) as MarketVehicle[])
      .map((v) => v.price)
      .filter((p): p is number => p != null)

    const marketAvgPrice =
      marketPrices.length > 0
        ? Math.round(marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length)
        : null

    const pricePositionPercent =
      dealerAvgPrice != null && marketAvgPrice != null && marketAvgPrice > 0
        ? Math.round(((dealerAvgPrice - marketAvgPrice) / marketAvgPrice) * 100)
        : null

    const conversionRate =
      totals.value.totalViews > 0
        ? Math.round((totals.value.totalLeads / totals.value.totalViews) * 1000) / 10
        : null

    marketComparison.value = {
      dealerAvgPrice,
      marketAvgPrice,
      pricePositionPercent,
      competitorCount: marketVehicles?.length ?? 0,
      conversionRate,
    }
  } catch {
    // Market comparison is non-critical — fail silently
  }
}

const pricePositionLabel = computed(() => {
  const pct = marketComparison.value?.pricePositionPercent
  if (pct == null) return '—'
  if (pct > 5) return `+${pct}% ${t('dashboard.stats.aboveMarket')}`
  if (pct < -5) return `${pct}% ${t('dashboard.stats.belowMarket')}`
  return t('dashboard.stats.atMarket')
})

const pricePositionClass = computed(() => {
  const pct = marketComparison.value?.pricePositionPercent
  if (pct == null) return 'neutral'
  if (pct > 5) return 'above'
  if (pct < -5) return 'below'
  return 'neutral'
})

onMounted(loadStats)
</script>

<template>
  <div class="stats-page">
    <header class="page-header">
      <h1>{{ t('dashboard.stats.title') }}</h1>
      <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
    </header>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-skeleton" aria-busy="true">
      <div class="stats-grid">
        <UiSkeletonCard v-for="n in 3" :key="n" :lines="1" />
      </div>
      <UiSkeletonTable :rows="5" :cols="3" />
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

      <!-- Market Comparison (full plan only) -->
      <section v-if="statsLevel === 'full' && marketComparison" class="card market-card">
        <h2>{{ t('dashboard.stats.marketPosition') }}</h2>
        <div class="market-grid">
          <!-- Price position vs market -->
          <div class="market-metric">
            <span class="market-metric__value" :class="`pos-${pricePositionClass}`">
              {{ pricePositionLabel }}
            </span>
            <span class="market-metric__label">{{ t('dashboard.stats.priceVsMarket') }}</span>
          </div>

          <!-- Dealer avg price -->
          <div class="market-metric">
            <span class="market-metric__value">
              {{
                marketComparison.dealerAvgPrice != null
                  ? marketComparison.dealerAvgPrice.toLocaleString('es-ES') + ' €'
                  : '—'
              }}
            </span>
            <span class="market-metric__label">{{ t('dashboard.stats.yourAvgPrice') }}</span>
          </div>

          <!-- Market avg price -->
          <div class="market-metric">
            <span class="market-metric__value muted">
              {{
                marketComparison.marketAvgPrice != null
                  ? marketComparison.marketAvgPrice.toLocaleString('es-ES') + ' €'
                  : '—'
              }}
            </span>
            <span class="market-metric__label">{{ t('dashboard.stats.marketAvgPrice') }}</span>
          </div>

          <!-- Conversion rate -->
          <div class="market-metric">
            <span class="market-metric__value">
              {{
                marketComparison.conversionRate != null
                  ? marketComparison.conversionRate + '%'
                  : '—'
              }}
            </span>
            <span class="market-metric__label">{{ t('dashboard.stats.conversionRate') }}</span>
          </div>

          <!-- Competitor count -->
          <div class="market-metric">
            <span class="market-metric__value muted">
              {{ marketComparison.competitorCount }}
            </span>
            <span class="market-metric__label">{{ t('dashboard.stats.competitors') }}</span>
          </div>
        </div>
      </section>

      <!-- Upgrade CTA — show for basic to get standard stats -->
      <div v-if="statsLevel === 'basic'" class="upgrade-card">
        <h3>{{ t('dashboard.stats.upgradeTitle') }}</h3>
        <p>{{ t('dashboard.stats.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
          {{ t('dashboard.stats.upgradeCta') }}
        </NuxtLink>
      </div>

      <!-- Upgrade CTA — show for standard to get market comparison -->
      <div v-else-if="statsLevel === 'standard'" class="upgrade-card upgrade-card--market">
        <h3>{{ t('dashboard.stats.upgradeMarketTitle') }}</h3>
        <p>{{ t('dashboard.stats.upgradeMarketDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
          {{ t('dashboard.stats.upgradeCta') }}
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 56.25rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.plan-badge {
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 600;
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6) var(--spacing-4);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.card h2 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-5);
  color: var(--text-auxiliary);
}

.vehicle-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  padding: 0.625rem 0;
  border-bottom: 2px solid var(--color-gray-200);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.table-row {
  display: flex;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.9rem;
  color: var(--text-secondary);
  min-height: 2.75rem;
  align-items: center;
}

.col-vehicle {
  flex: 1;
  font-weight: 500;
}

.col-vehicle .year {
  color: var(--text-disabled);
  font-weight: 400;
}

.col-num {
  width: 5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Market comparison section */
.market-card {
  border-top: 3px solid var(--color-primary);
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.market-metric {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.market-metric__value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.market-metric__value.muted {
  color: var(--text-secondary);
}

.market-metric__value.pos-above {
  color: var(--color-warning, #b45309);
}

.market-metric__value.pos-below {
  color: var(--color-success, #15803d);
}

.market-metric__value.pos-neutral {
  color: var(--color-primary);
}

.market-metric__label {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.upgrade-card {
  background: linear-gradient(135deg, var(--color-info-bg), var(--color-info-bg));
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  text-align: center;
}

.upgrade-card--market {
  background: linear-gradient(135deg, var(--color-primary-bg, #f0f4f5), var(--color-info-bg));
  border-color: var(--color-primary);
}

.upgrade-card h3 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 1.1rem;
  color: var(--color-info-text);
}

.upgrade-card p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-info);
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-6);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

@media (min-width: 48em) {
  .stats-page {
    padding: var(--spacing-6);
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .market-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
