/**
 * Composable for the dealer market intelligence page (/dashboard/mercado).
 *
 * Fetches the dealer's stock-vs-market report via the existing
 * /api/dealer/market-intelligence endpoint.
 */

export interface VehicleInsight {
  vehicleId: string
  brand: string
  model: string
  dealerPrice: number
  marketAvg: number
  marketMin: number
  marketMax: number
  pricePosition: 'below' | 'average' | 'above'
  priceDeviationPercent: number
  avgDaysOnMarket: number
  suggestion: string
}

export interface MarketReport {
  dealerId: string
  totalVehicles: number
  insights: VehicleInsight[]
  summary: {
    belowMarket: number
    atMarket: number
    aboveMarket: number
    averageDeviation: number
  }
}

export function positionClass(position: VehicleInsight['pricePosition']): string {
  if (position === 'below') return 'pos-below'
  if (position === 'above') return 'pos-above'
  return 'pos-average'
}

export function positionIcon(position: VehicleInsight['pricePosition']): string {
  if (position === 'below') return '↓'
  if (position === 'above') return '↑'
  return '='
}

export function formatDeviation(dev: number): string {
  if (dev === 0) return '0%'
  const sign = dev > 0 ? '+' : ''
  return `${sign}${dev.toFixed(1)}%`
}

export function useDashboardMercado() {
  const { t } = useI18n()
  const { dealerProfile } = useDealerDashboard()

  const report = ref<MarketReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasSufficientData = computed(() => (report.value?.insights?.length ?? 0) > 0)

  const summaryCards = computed(() => {
    const s = report.value?.summary
    if (!s) return []
    return [
      {
        key: 'below',
        label: t('dealer.mercado.belowMarket'),
        count: s.belowMarket,
        colorClass: 'card-below',
      },
      {
        key: 'at',
        label: t('dealer.mercado.atMarket'),
        count: s.atMarket,
        colorClass: 'card-at',
      },
      {
        key: 'above',
        label: t('dealer.mercado.aboveMarket'),
        count: s.aboveMarket,
        colorClass: 'card-above',
      },
    ]
  })

  const avgDeviationLabel = computed(() => {
    const dev = report.value?.summary?.averageDeviation ?? 0
    return formatDeviation(dev)
  })

  async function fetchReport(): Promise<void> {
    const dealerId = dealerProfile.value?.id
    if (!dealerId) return

    loading.value = true
    error.value = null
    try {
      report.value = await $fetch<MarketReport>('/api/dealer/market-intelligence', {
        query: { dealerId },
      })
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : t('dealer.mercado.loadError')
    } finally {
      loading.value = false
    }
  }

  return {
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
  }
}
