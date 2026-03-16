import type {
  DatosCategoryStat,
  ProvinceStat,
  BrandBreakdownItem,
  ProvinceSortKey,
  DatosChartData,
} from '~/composables/shared/datosTypes'

import {
  groupBy,
  computeSubcategoryStat,
  computeProvinceStatsFromRows,
  getLatestMonth,
} from '~/composables/shared/datosHelpers'

import { formatPrice, formatDate } from '~/utils/formatters'
import { getVerticalSlug } from '~/composables/useVerticalConfig'

// Re-export types for backwards compatibility
export type {
  MarketRow,
  DatosPriceHistoryRow,
  DatosCategoryStat,
  ProvinceStat,
  BrandBreakdownItem,
  ProvinceSortKey,
  DatosChartDataset,
  DatosChartData,
} from '~/composables/shared/datosTypes'

// formatPrice is available via auto-import from ~/utils/formatters

/* ------------------------------------------------
   Composable
   ------------------------------------------------ */
export function useDatos() {
  const supabase = useSupabaseClient()
  const { t, locale } = useI18n()

  /* ---- Reactive state ---- */
  const loading = ref(true)
  const marketRows = ref<MarketRow[]>([])
  const historyRows = ref<DatosPriceHistoryRow[]>([])
  const selectedCategory = ref<string | null>(null)
  const provinceSortKey = ref<ProvinceSortKey>('listingCount')
  const provinceSortAsc = ref(false)

  /* ---- Data fetching ---- */
  async function fetchData() {
    loading.value = true

    const [marketResult, historyResult] = await Promise.all([
      supabase
        .from('market_data')
        .select(
          'vertical, action, subcategory, brand, location_province, location_country, month, listings, avg_price, median_price, min_price, max_price, avg_days_to_sell, sold_count',
        )
        .eq('vertical', getVerticalSlug())
        .order('month', { ascending: false }),
      supabase
        .from('price_history')
        .select('vertical, subcategory, brand, week, avg_price, median_price, sample_size')
        .eq('vertical', getVerticalSlug())
        .order('week', { ascending: true }),
    ])

    if (marketResult.data) {
      marketRows.value = marketResult.data as unknown as MarketRow[]
    }
    if (historyResult.data) {
      historyRows.value = historyResult.data as unknown as DatosPriceHistoryRow[]
    }

    loading.value = false
  }

  /* ---- Category stats computation ---- */
  const categoryStats = computed<DatosCategoryStat[]>(() => {
    if (!marketRows.value.length) return []

    const grouped = groupBy(marketRows.value, (r) => r.subcategory)
    const stats: DatosCategoryStat[] = []
    for (const [subcategory, rows] of grouped) {
      const stat = computeSubcategoryStat(subcategory, rows)
      if (stat) stats.push(stat)
    }
    return stats.sort((a, b) => b.listingCount - a.listingCount)
  })

  /* ---- Selected category stat ---- */
  const selectedCategoryStat = computed<DatosCategoryStat | undefined>(() => {
    if (!selectedCategory.value) return undefined
    return categoryStats.value.find((c) => c.subcategory === selectedCategory.value)
  })

  /* ---- Brand breakdown for selected category ---- */
  const brandBreakdown = computed<BrandBreakdownItem[]>(() => {
    if (!selectedCategory.value || !marketRows.value.length) return []

    const rows = marketRows.value.filter((r) => r.subcategory === selectedCategory.value && r.brand)
    const byBrand = groupBy(rows, (r) => r.brand ?? '')

    const result: BrandBreakdownItem[] = []
    for (const [brand, brandRows] of byBrand) {
      const sorted = brandRows.toSorted((a, b) => b.month.localeCompare(a.month))
      const latest = sorted[0]!
      result.push({
        brand,
        avgPrice: Math.round(latest.avg_price),
        listingCount: latest.listing_count,
      })
    }
    return result.sort((a, b) => b.listingCount - a.listingCount)
  })

  /* ---- Province stats ---- */
  const provinceStats = computed<ProvinceStat[]>(() => {
    if (!marketRows.value.length) return []
    const latestMonth = getLatestMonth(marketRows.value)
    if (!latestMonth) return []
    const latestRows = marketRows.value.filter((r) => r.month === latestMonth && r.province)
    return computeProvinceStatsFromRows(latestRows)
  })

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

  function toggleProvinceSort(key: ProvinceSortKey) {
    if (provinceSortKey.value === key) {
      provinceSortAsc.value = !provinceSortAsc.value
    } else {
      provinceSortKey.value = key
      provinceSortAsc.value = false
    }
  }

  function sortArrow(key: ProvinceSortKey): string {
    if (provinceSortKey.value !== key) return ''
    return provinceSortAsc.value ? ' \u2191' : ' \u2193'
  }

  /* ---- Chart data ---- */
  const chartSubcategory = computed(
    () => selectedCategory.value ?? categoryStats.value[0]?.subcategory ?? null,
  )

  const chartData = computed<DatosChartData>(() => {
    if (!chartSubcategory.value || !historyRows.value.length) {
      return {
        labels: [],
        datasets: [],
      }
    }

    const filtered = historyRows.value.filter((r) => r.subcategory === chartSubcategory.value)
    const recent = filtered.slice(-52)

    const labels = recent.map((r) => {
      const date = new Date(r.week)
      return formatDate(date, locale.value, { month: 'short', year: '2-digit' })
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

  /* ---- Interactions ---- */
  function selectCategory(subcategory: string) {
    selectedCategory.value = selectedCategory.value === subcategory ? null : subcategory
  }

  /* ---- Updated date ---- */
  const lastUpdated = computed(() => {
    if (!marketRows.value.length) return ''
    const latestMonth = marketRows.value
      .map((r) => r.month)
      .sort((a, b) => a.localeCompare(b))
      .reverse()[0]
    if (!latestMonth) return ''
    const date = new Date(latestMonth + '-01')
    return formatDate(date, locale.value, { month: 'long', year: 'numeric' })
  })

  /* ---- JSON-LD Dataset Schema ---- */
  const datasetSchema = computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: t('data.seoTitle'),
    description: t('data.seoDescription'),
    url: `${useSiteUrl()}/datos`,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: {
      '@type': 'Organization',
      name: t('site.title'),
      url: useSiteUrl(),
    },
    temporalCoverage: lastUpdated.value ? `../${lastUpdated.value}` : undefined,
    spatialCoverage: {
      '@type': 'Place',
      name: 'Spain',
    },
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/pdf',
      contentUrl: `${useSiteUrl()}/informes/indice-precios-trimestral.pdf`,
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

  const hasData = computed(() => !!categoryStats.value.length)

  return {
    // State
    loading: readonly(loading),
    selectedCategory: readonly(selectedCategory),
    provinceSortKey: readonly(provinceSortKey),
    provinceSortAsc: readonly(provinceSortAsc),

    // Computed
    categoryStats,
    selectedCategoryStat,
    brandBreakdown,
    sortedProvinces,
    chartData,
    chartOptions,
    lastUpdated,
    datasetSchema,
    hasData,

    // Actions
    fetchData,
    selectCategory,
    toggleProvinceSort,
    sortArrow,
  }
}
