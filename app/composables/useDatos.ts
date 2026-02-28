/* ------------------------------------------------
   Types
   ------------------------------------------------ */
export interface MarketRow {
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

export interface PriceHistoryRow {
  id: string
  vertical: string
  subcategory: string
  week: string
  avg_price: number
  listing_count: number
}

export interface CategoryStat {
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

export interface ProvinceStat {
  province: string
  avgPrice: number
  listingCount: number
}

export interface BrandBreakdownItem {
  brand: string
  avgPrice: number
  listingCount: number
}

export type ProvinceSortKey = 'province' | 'avgPrice' | 'listingCount'

export interface DatosChartDataset {
  label: string
  data: number[]
  fill: boolean
  borderColor: string
  backgroundColor: string
  tension: number
  pointRadius: number
  pointHoverRadius: number
}

export interface DatosChartData {
  labels: string[]
  datasets: DatosChartDataset[]
}

/* ------------------------------------------------
   Utility
   ------------------------------------------------ */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

/* ------------------------------------------------
   Composable
   ------------------------------------------------ */
export function useDatos() {
  const supabase = useSupabaseClient()
  const { t } = useI18n()

  /* ---- Reactive state ---- */
  const loading = ref(true)
  const marketRows = ref<MarketRow[]>([])
  const historyRows = ref<PriceHistoryRow[]>([])
  const selectedCategory = ref<string | null>(null)
  const provinceSortKey = ref<ProvinceSortKey>('listingCount')
  const provinceSortAsc = ref(false)

  /* ---- Data fetching ---- */
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
      marketRows.value = marketResult.data as unknown as MarketRow[]
    }
    if (historyResult.data) {
      historyRows.value = historyResult.data as unknown as PriceHistoryRow[]
    }

    loading.value = false
  }

  /* ---- Category stats computation ---- */
  const categoryStats = computed<CategoryStat[]>(() => {
    if (!marketRows.value.length) return []

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

      const latestMonth = months[0]!
      const latestRows = byMonth.get(latestMonth) ?? []

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

      let trendPct = 0
      let trendDirection: 'rising' | 'falling' | 'stable' = 'stable'

      if (months.length > 1) {
        const prevMonth = months[1]!
        const prevRows = byMonth.get(prevMonth) ?? []
        const prevTotalListings = prevRows.reduce((sum, r) => sum + r.listing_count, 0)
        const prevWeightedAvg =
          prevTotalListings > 0
            ? prevRows.reduce((sum, r) => sum + r.avg_price * r.listing_count, 0) /
              prevTotalListings
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

    return stats.sort((a, b) => b.listingCount - a.listingCount)
  })

  /* ---- Selected category stat ---- */
  const selectedCategoryStat = computed<CategoryStat | undefined>(() => {
    if (!selectedCategory.value) return undefined
    return categoryStats.value.find((c) => c.subcategory === selectedCategory.value)
  })

  /* ---- Brand breakdown for selected category ---- */
  const brandBreakdown = computed<BrandBreakdownItem[]>(() => {
    if (!selectedCategory.value || !marketRows.value.length) return []

    const rows = marketRows.value.filter((r) => r.subcategory === selectedCategory.value && r.brand)

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

    const result: BrandBreakdownItem[] = []

    for (const [brand, brandRows] of byBrand) {
      const sorted = brandRows.sort((a, b) => b.month.localeCompare(a.month))
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

  /* ---- Interactions ---- */
  function selectCategory(subcategory: string) {
    selectedCategory.value = selectedCategory.value === subcategory ? null : subcategory
  }

  /* ---- Updated date ---- */
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

  /* ---- JSON-LD Dataset Schema ---- */
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
