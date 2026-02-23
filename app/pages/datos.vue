<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler,
)

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient()

/* ------------------------------------------------
   Types
   ------------------------------------------------ */
interface MarketRow {
  id: string
  vertical: string
  subcategory: string
  subcategory_label: string
  brand: string | null
  province: string | null
  month: string
  avg_price: number
  median_price: number
  listing_count: number
  sold_count: number
  avg_days_to_sell: number | null
}

interface PriceHistoryRow {
  id: string
  vertical: string
  subcategory: string
  week: string
  avg_price: number
  listing_count: number
}

interface CategoryStat {
  subcategory: string
  label: string
  avgPrice: number
  medianPrice: number
  listingCount: number
  soldCount: number
  avgDaysToSell: number | null
  trendPct: number
  trendDirection: 'rising' | 'falling' | 'stable'
}

interface ProvinceStat {
  province: string
  avgPrice: number
  listingCount: number
}

/* ------------------------------------------------
   Data fetching
   ------------------------------------------------ */
const loading = ref(true)
const marketRows = ref<MarketRow[]>([])
const historyRows = ref<PriceHistoryRow[]>([])

const selectedCategory = ref<string | null>(null)

const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

async function fetchData() {
  loading.value = true

  const [marketResult, historyResult] = await Promise.all([
    supabase
      .from('market_data')
      .select('*')
      .eq('vertical', 'tracciona')
      .order('month', { ascending: false }),
    supabase
      .from('price_history')
      .select('*')
      .eq('vertical', 'tracciona')
      .order('week', { ascending: true }),
  ])

  if (marketResult.data) {
    marketRows.value = marketResult.data as MarketRow[]
  }
  if (historyResult.data) {
    historyRows.value = historyResult.data as PriceHistoryRow[]
  }

  loading.value = false
}

await fetchData()

/* ------------------------------------------------
   Category stats computation
   ------------------------------------------------ */
const categoryStats = computed<CategoryStat[]>(() => {
  if (!marketRows.value.length) return []

  // Group by subcategory
  const grouped = new Map<string, MarketRow[]>()
  for (const row of marketRows.value) {
    const existing = grouped.get(row.subcategory)
    if (existing) {
      existing.push(row)
    } else {
      grouped.set(row.subcategory, [row])
    }
  }

  const stats: CategoryStat[] = []

  for (const [subcategory, rows] of grouped) {
    // Rows are already sorted desc by month; aggregate by month
    const byMonth = new Map<string, MarketRow[]>()
    for (const r of rows) {
      const existing = byMonth.get(r.month)
      if (existing) {
        existing.push(r)
      } else {
        byMonth.set(r.month, [r])
      }
    }

    const months = Array.from(byMonth.keys()).sort().reverse()
    if (!months.length) continue

    const latestMonth = months[0]
    const latestRows = byMonth.get(latestMonth) ?? []

    // Aggregate latest month
    const totalListings = latestRows.reduce((sum, r) => sum + r.listing_count, 0)
    const totalSold = latestRows.reduce((sum, r) => sum + r.sold_count, 0)
    const weightedAvg =
      totalListings > 0
        ? latestRows.reduce((sum, r) => sum + r.avg_price * r.listing_count, 0) / totalListings
        : 0
    const weightedMedian =
      totalListings > 0
        ? latestRows.reduce((sum, r) => sum + r.median_price * r.listing_count, 0) / totalListings
        : 0
    const daysToSell = latestRows.some((r) => r.avg_days_to_sell !== null)
      ? latestRows
          .filter((r) => r.avg_days_to_sell !== null)
          .reduce((sum, r) => sum + (r.avg_days_to_sell ?? 0), 0) /
        latestRows.filter((r) => r.avg_days_to_sell !== null).length
      : null

    // Compute trend against previous month
    let trendPct = 0
    let trendDirection: 'rising' | 'falling' | 'stable' = 'stable'

    if (months.length > 1) {
      const prevMonth = months[1]
      const prevRows = byMonth.get(prevMonth) ?? []
      const prevTotalListings = prevRows.reduce((sum, r) => sum + r.listing_count, 0)
      const prevWeightedAvg =
        prevTotalListings > 0
          ? prevRows.reduce((sum, r) => sum + r.avg_price * r.listing_count, 0) / prevTotalListings
          : 0

      if (prevWeightedAvg > 0) {
        trendPct = ((weightedAvg - prevWeightedAvg) / prevWeightedAvg) * 100
        if (trendPct > 1) trendDirection = 'rising'
        else if (trendPct < -1) trendDirection = 'falling'
        else trendDirection = 'stable'
      }
    }

    stats.push({
      subcategory,
      label: latestRows[0]?.subcategory_label ?? subcategory,
      avgPrice: Math.round(weightedAvg),
      medianPrice: Math.round(weightedMedian),
      listingCount: totalListings,
      soldCount: totalSold,
      avgDaysToSell: daysToSell !== null ? Math.round(daysToSell) : null,
      trendPct: Math.round(trendPct * 10) / 10,
      trendDirection,
    })
  }

  // Sort by listing count descending
  return stats.sort((a, b) => b.listingCount - a.listingCount)
})

/* ------------------------------------------------
   Brand breakdown for selected category
   ------------------------------------------------ */
const brandBreakdown = computed(() => {
  if (!selectedCategory.value || !marketRows.value.length) return []

  const rows = marketRows.value.filter((r) => r.subcategory === selectedCategory.value && r.brand)

  // Group by brand, take latest month per brand
  const byBrand = new Map<string, MarketRow[]>()
  for (const r of rows) {
    const brand = r.brand ?? ''
    const existing = byBrand.get(brand)
    if (existing) {
      existing.push(r)
    } else {
      byBrand.set(brand, [r])
    }
  }

  const result: { brand: string; avgPrice: number; listingCount: number }[] = []

  for (const [brand, brandRows] of byBrand) {
    // Sort desc by month and take latest
    const sorted = brandRows.sort((a, b) => b.month.localeCompare(a.month))
    const latest = sorted[0]
    result.push({
      brand,
      avgPrice: Math.round(latest.avg_price),
      listingCount: latest.listing_count,
    })
  }

  return result.sort((a, b) => b.listingCount - a.listingCount)
})

/* ------------------------------------------------
   Province stats
   ------------------------------------------------ */
const provinceStats = computed<ProvinceStat[]>(() => {
  if (!marketRows.value.length) return []

  // Get latest month across all rows
  const allMonths = [...new Set(marketRows.value.map((r) => r.month))].sort().reverse()
  if (!allMonths.length) return []

  const latestMonth = allMonths[0]
  const latestRows = marketRows.value.filter((r) => r.month === latestMonth && r.province)

  const byProvince = new Map<string, { totalPrice: number; totalListings: number }>()
  for (const r of latestRows) {
    const province = r.province ?? ''
    const existing = byProvince.get(province)
    if (existing) {
      existing.totalPrice += r.avg_price * r.listing_count
      existing.totalListings += r.listing_count
    } else {
      byProvince.set(province, {
        totalPrice: r.avg_price * r.listing_count,
        totalListings: r.listing_count,
      })
    }
  }

  const result: ProvinceStat[] = []
  for (const [province, data] of byProvince) {
    result.push({
      province,
      avgPrice: data.totalListings > 0 ? Math.round(data.totalPrice / data.totalListings) : 0,
      listingCount: data.totalListings,
    })
  }

  return result.sort((a, b) => b.listingCount - a.listingCount)
})

const provinceSortKey = ref<'province' | 'avgPrice' | 'listingCount'>('listingCount')
const provinceSortAsc = ref(false)

const sortedProvinces = computed(() => {
  const sorted = [...provinceStats.value]
  sorted.sort((a, b) => {
    const key = provinceSortKey.value
    if (key === 'province') {
      return provinceSortAsc.value
        ? a.province.localeCompare(b.province)
        : b.province.localeCompare(a.province)
    }
    return provinceSortAsc.value ? a[key] - b[key] : b[key] - a[key]
  })
  return sorted
})

function toggleProvinceSort(key: 'province' | 'avgPrice' | 'listingCount') {
  if (provinceSortKey.value === key) {
    provinceSortAsc.value = !provinceSortAsc.value
  } else {
    provinceSortKey.value = key
    provinceSortAsc.value = false
  }
}

function sortArrow(key: 'province' | 'avgPrice' | 'listingCount'): string {
  if (provinceSortKey.value !== key) return ''
  return provinceSortAsc.value ? ' \u2191' : ' \u2193'
}

/* ------------------------------------------------
   Chart data
   ------------------------------------------------ */
const chartSubcategory = computed(
  () => selectedCategory.value ?? categoryStats.value[0]?.subcategory ?? null,
)

const chartData = computed(() => {
  if (!chartSubcategory.value || !historyRows.value.length) {
    return {
      labels: [] as string[],
      datasets: [] as {
        label: string
        data: number[]
        fill: boolean
        borderColor: string
        backgroundColor: string
        tension: number
        pointRadius: number
        pointHoverRadius: number
      }[],
    }
  }

  const filtered = historyRows.value.filter((r) => r.subcategory === chartSubcategory.value)

  // Take last 52 weeks (approx 12 months)
  const recent = filtered.slice(-52)

  const labels = recent.map((r) => {
    const date = new Date(r.week)
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  })

  const prices = recent.map((r) => r.avg_price)

  return {
    labels,
    datasets: [
      {
        label: t('data.avgPrice'),
        data: prices,
        fill: true,
        borderColor: '#23424A',
        backgroundColor: 'rgba(35, 66, 74, 0.1)',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#23424A',
      titleFont: { size: 13, weight: 'bold' as const },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: { parsed: { y: number } }) => {
          return formatPrice(ctx.parsed.y)
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 11 },
        color: '#7A8A8A',
        maxRotation: 45,
        autoSkip: true,
        maxTicksLimit: 12,
      },
    },
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: {
        font: { size: 11 },
        color: '#7A8A8A',
        callback: (value: number | string) => {
          if (typeof value === 'number') {
            return formatPrice(value)
          }
          return value
        },
      },
    },
  },
}))

/* ------------------------------------------------
   Interactions
   ------------------------------------------------ */
function selectCategory(subcategory: string) {
  selectedCategory.value = selectedCategory.value === subcategory ? null : subcategory
}

/* ------------------------------------------------
   Updated date
   ------------------------------------------------ */
const lastUpdated = computed(() => {
  if (!marketRows.value.length) return ''
  const latestMonth = marketRows.value
    .map((r) => r.month)
    .sort()
    .reverse()[0]
  if (!latestMonth) return ''
  const date = new Date(latestMonth + '-01')
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

/* ------------------------------------------------
   JSON-LD Dataset Schema
   ------------------------------------------------ */
const datasetSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: t('data.seoTitle'),
  description: t('data.seoDescription'),
  url: 'https://tracciona.com/datos',
  license: 'https://creativecommons.org/licenses/by-nc/4.0/',
  creator: {
    '@type': 'Organization',
    name: 'Tracciona',
    url: 'https://tracciona.com',
  },
  temporalCoverage: lastUpdated.value ? `../${lastUpdated.value}` : undefined,
  spatialCoverage: {
    '@type': 'Place',
    name: 'Spain',
  },
  distribution: {
    '@type': 'DataDownload',
    encodingFormat: 'application/pdf',
    contentUrl: 'https://tracciona.com/informes/indice-precios-trimestral.pdf',
  },
  keywords: [
    'precios vehículos industriales',
    'índice precios camiones',
    'precio semirremolques España',
    'mercado vehículos industriales',
    'industrial vehicle prices Spain',
  ],
  measurementTechnique: 'Aggregated listing data from Tracciona marketplace',
  variableMeasured: [
    {
      '@type': 'PropertyValue',
      name: 'Average Price',
      unitText: 'EUR',
    },
    {
      '@type': 'PropertyValue',
      name: 'Listing Volume',
      unitText: 'count',
    },
  ],
}))

const hasData = computed(() => categoryStats.value.length > 0)

/* ------------------------------------------------
   SEO
   ------------------------------------------------ */
usePageSeo({
  title: t('data.seoTitle'),
  description: t('data.seoDescription'),
  path: '/datos',
  type: 'website',
  jsonLd: datasetSchema.value,
})
</script>

<template>
  <div class="datos-page">
    <!-- Hero Section -->
    <section class="datos-hero">
      <div class="datos-hero__container">
        <h1 class="datos-hero__title">{{ $t('data.heroTitle') }}</h1>
        <p class="datos-hero__subtitle">{{ $t('data.heroSubtitle') }}</p>
        <p v-if="lastUpdated" class="datos-hero__updated">
          {{ $t('data.updated') }}: {{ lastUpdated }}
        </p>
      </div>
    </section>

    <div class="datos-content">
      <!-- Loading state -->
      <div v-if="loading" class="datos-loading">
        <div class="datos-loading__spinner" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!hasData" class="datos-empty">
        <div class="datos-empty__icon" aria-hidden="true">&#128202;</div>
        <p class="datos-empty__text">{{ $t('data.noData') }}</p>
      </div>

      <template v-else>
        <!-- Category Grid -->
        <section class="datos-section">
          <h2 class="datos-section__title">{{ $t('data.selectCategory') }}</h2>
          <div class="category-grid">
            <button
              v-for="cat in categoryStats"
              :key="cat.subcategory"
              class="category-card"
              :class="{ 'category-card--active': selectedCategory === cat.subcategory }"
              @click="selectCategory(cat.subcategory)"
            >
              <span class="category-card__name">{{ cat.label }}</span>
              <span class="category-card__price">{{ formatPrice(cat.avgPrice) }}</span>
              <span
                class="category-card__trend"
                :class="{
                  'category-card__trend--rising': cat.trendDirection === 'rising',
                  'category-card__trend--falling': cat.trendDirection === 'falling',
                  'category-card__trend--stable': cat.trendDirection === 'stable',
                }"
              >
                <template v-if="cat.trendDirection === 'rising'">&uarr;</template>
                <template v-else-if="cat.trendDirection === 'falling'">&darr;</template>
                <template v-else>&rarr;</template>
                {{ Math.abs(cat.trendPct) }}%
              </span>
              <span class="category-card__volume">
                {{ cat.listingCount }} {{ $t('data.listings') }}
              </span>
            </button>
          </div>
        </section>

        <!-- Selected category detail -->
        <section v-if="selectedCategory && brandBreakdown.length" class="datos-section">
          <h2 class="datos-section__title">
            {{ categoryStats.find((c) => c.subcategory === selectedCategory)?.label }}
          </h2>
          <div class="detail-grid">
            <div class="detail-stat">
              <span class="detail-stat__label">{{ $t('data.avgPrice') }}</span>
              <span class="detail-stat__value">
                {{
                  formatPrice(
                    categoryStats.find((c) => c.subcategory === selectedCategory)?.avgPrice ?? 0,
                  )
                }}
              </span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">{{ $t('data.median') }}</span>
              <span class="detail-stat__value">
                {{
                  formatPrice(
                    categoryStats.find((c) => c.subcategory === selectedCategory)?.medianPrice ?? 0,
                  )
                }}
              </span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">{{ $t('data.listings') }}</span>
              <span class="detail-stat__value">
                {{
                  categoryStats.find((c) => c.subcategory === selectedCategory)?.listingCount ?? 0
                }}
              </span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">{{ $t('data.soldCount') }}</span>
              <span class="detail-stat__value">
                {{ categoryStats.find((c) => c.subcategory === selectedCategory)?.soldCount ?? 0 }}
              </span>
            </div>
            <div
              v-if="
                categoryStats.find((c) => c.subcategory === selectedCategory)?.avgDaysToSell !==
                null
              "
              class="detail-stat"
            >
              <span class="detail-stat__label">{{ $t('data.avgDaysToSell') }}</span>
              <span class="detail-stat__value">
                {{ categoryStats.find((c) => c.subcategory === selectedCategory)?.avgDaysToSell }}
              </span>
            </div>
          </div>

          <!-- Brand breakdown table -->
          <div class="brand-table-wrapper">
            <table class="brand-table">
              <thead>
                <tr>
                  <th class="brand-table__th--left">Brand</th>
                  <th>{{ $t('data.avgPrice') }}</th>
                  <th>{{ $t('data.volume') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="brand in brandBreakdown" :key="brand.brand">
                  <td class="brand-table__td--left">{{ brand.brand }}</td>
                  <td>{{ formatPrice(brand.avgPrice) }}</td>
                  <td>{{ brand.listingCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Price trends chart -->
        <section v-if="chartData.labels.length" class="datos-section">
          <h2 class="datos-section__title">
            {{ $t('data.priceTrends') }} &mdash; {{ $t('data.last12Months') }}
          </h2>
          <div class="chart-container">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </section>

        <!-- Province table -->
        <section v-if="sortedProvinces.length" class="datos-section">
          <h2 class="datos-section__title">{{ $t('data.byProvince') }}</h2>
          <div class="province-table-wrapper">
            <table class="province-table">
              <thead>
                <tr>
                  <th
                    class="province-table__th--sortable province-table__th--left"
                    @click="toggleProvinceSort('province')"
                  >
                    {{ $t('data.province') }}{{ sortArrow('province') }}
                  </th>
                  <th class="province-table__th--sortable" @click="toggleProvinceSort('avgPrice')">
                    {{ $t('data.avgPrice') }}{{ sortArrow('avgPrice') }}
                  </th>
                  <th
                    class="province-table__th--sortable"
                    @click="toggleProvinceSort('listingCount')"
                  >
                    {{ $t('data.volume') }}{{ sortArrow('listingCount') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(prov, idx) in sortedProvinces"
                  :key="prov.province"
                  :class="{ 'province-table__row--striped': idx % 2 === 1 }"
                >
                  <td class="province-table__td--left">{{ prov.province }}</td>
                  <td>{{ formatPrice(prov.avgPrice) }}</td>
                  <td>{{ prov.listingCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- CTA: Download report -->
        <section class="datos-section datos-cta">
          <h2 class="datos-cta__title">{{ $t('data.downloadReport') }}</h2>
          <NuxtLink
            :to="localePath('/datos')"
            class="datos-cta__button"
            href="https://tracciona.com/informes/indice-precios-trimestral.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('data.downloadReport') }}
          </NuxtLink>
        </section>

        <!-- Disclaimer -->
        <p class="datos-disclaimer">{{ $t('data.disclaimer') }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   Datos Page — Mobile-first (360px base)
   ================================================ */

.datos-page {
  min-height: 60vh;
  background: var(--bg-secondary);
}

/* ---- Hero ---- */
.datos-hero {
  background: var(--color-primary);
  color: var(--color-white);
  padding: var(--spacing-10) 0;
}

.datos-hero__container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  text-align: center;
}

.datos-hero__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-3);
  color: var(--text-on-dark-primary);
}

.datos-hero__subtitle {
  font-size: var(--font-size-base);
  color: var(--text-on-dark-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 640px;
  margin: 0 auto var(--spacing-4);
}

.datos-hero__updated {
  font-size: var(--font-size-sm);
  color: var(--text-on-dark-auxiliary);
}

/* ---- Content wrapper ---- */
.datos-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-16);
}

/* ---- Section ---- */
.datos-section {
  margin-bottom: var(--spacing-10);
}

.datos-section__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-5);
}

/* ---- Loading ---- */
.datos-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-16) 0;
}

.datos-loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- Empty state ---- */
.datos-empty {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-4);
}

.datos-empty__icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  opacity: 0.5;
}

.datos-empty__text {
  font-size: var(--font-size-lg);
  color: var(--text-auxiliary);
  max-width: 400px;
  margin: 0 auto;
  line-height: var(--line-height-relaxed);
}

/* ---- Category grid ---- */
.category-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.category-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-5);
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.category-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}

.category-card--active {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.04);
  box-shadow: var(--shadow-md);
}

.category-card__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.category-card__price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.category-card__trend {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-full);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  align-self: flex-start;
}

.category-card__trend--rising {
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.category-card__trend--falling {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
}

.category-card__trend--stable {
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.category-card__volume {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* ---- Detail grid ---- */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.detail-stat {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.detail-stat__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-stat__value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

/* ---- Brand table ---- */
.brand-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
}

.brand-table {
  width: 100%;
  min-width: 320px;
  border-collapse: collapse;
}

.brand-table thead {
  background: var(--color-primary);
}

.brand-table th {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  text-align: center;
  white-space: nowrap;
}

.brand-table__th--left {
  text-align: left;
}

.brand-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color-light);
  text-align: center;
}

.brand-table__td--left {
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.brand-table tbody tr:last-child td {
  border-bottom: none;
}

.brand-table tbody tr:hover {
  background: var(--color-gray-50);
}

/* ---- Chart ---- */
.chart-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  height: 300px;
  position: relative;
}

/* ---- Province table ---- */
.province-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
}

.province-table {
  width: 100%;
  min-width: 360px;
  border-collapse: collapse;
}

.province-table thead {
  background: var(--color-primary);
}

.province-table th {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  text-align: center;
  white-space: nowrap;
}

.province-table__th--left {
  text-align: left;
}

.province-table__th--sortable {
  cursor: pointer;
  user-select: none;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.province-table__th--sortable:hover {
  background: var(--color-primary-dark);
}

.province-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color-light);
  text-align: center;
}

.province-table__td--left {
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.province-table__row--striped {
  background: var(--color-gray-50);
}

.province-table tbody tr:last-child td {
  border-bottom: none;
}

.province-table tbody tr:hover {
  background: var(--bg-tertiary);
}

/* ---- CTA ---- */
.datos-cta {
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-8) var(--spacing-4);
}

.datos-cta__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.datos-cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  text-decoration: none;
  min-height: 44px;
  min-width: 44px;
  transition: background var(--transition-fast);
}

.datos-cta__button:hover {
  background: var(--color-primary-dark);
}

/* ---- Disclaimer ---- */
.datos-disclaimer {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
  line-height: var(--line-height-relaxed);
  max-width: 640px;
  margin: 0 auto;
  padding-top: var(--spacing-4);
}

/* ================================================
   Responsive — 480px (large mobile)
   ================================================ */
@media (min-width: 480px) {
  .datos-content {
    padding-left: var(--spacing-6);
    padding-right: var(--spacing-6);
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ================================================
   Responsive — 768px (tablet)
   ================================================ */
@media (min-width: 768px) {
  .datos-hero {
    padding: var(--spacing-16) 0;
  }

  .datos-hero__title {
    font-size: var(--font-size-3xl);
  }

  .datos-hero__subtitle {
    font-size: var(--font-size-lg);
  }

  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-4);
  }

  .detail-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .datos-section__title {
    font-size: var(--font-size-2xl);
  }

  .chart-container {
    height: 380px;
    padding: var(--spacing-6);
  }
}

/* ================================================
   Responsive — 1024px (desktop)
   ================================================ */
@media (min-width: 1024px) {
  .datos-hero__title {
    font-size: var(--font-size-4xl);
  }

  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .chart-container {
    height: 420px;
  }
}
</style>
