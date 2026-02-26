/**
 * Composable for dealer market intelligence data.
 *
 * Fetches the dealer's vehicles compared to market averages
 * and provides insights on pricing position.
 */

interface VehicleInsight {
  vehicleId: string
  brand: string
  model: string
  dealerPrice: number
  marketAvg: number
  marketMin: number
  marketMax: number
  pricePosition: 'below' | 'average' | 'above'
  priceDeviationPercent: number
  suggestion: string
}

interface IntelligenceSummary {
  belowMarket: number
  atMarket: number
  aboveMarket: number
  averageDeviation: number
}

interface IntelligenceReport {
  dealerId: string
  totalVehicles: number
  insights: VehicleInsight[]
  summary: IntelligenceSummary
}

export function useMarketIntelligence() {
  const report = ref<IntelligenceReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchIntelligence(dealerId: string) {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<IntelligenceReport>(
        `/api/dealer/market-intelligence?dealerId=${dealerId}`,
      )
      report.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading intelligence data'
    } finally {
      loading.value = false
    }
  }

  const positionColor = (position: 'below' | 'average' | 'above'): string => {
    switch (position) {
      case 'below':
        return '#16a34a' // green
      case 'average':
        return '#f59e0b' // amber
      case 'above':
        return '#dc2626' // red
    }
  }

  const positionLabel = (position: 'below' | 'average' | 'above'): string => {
    switch (position) {
      case 'below':
        return 'Por debajo del mercado'
      case 'average':
        return 'En línea con el mercado'
      case 'above':
        return 'Por encima del mercado'
    }
  }

  return {
    report,
    loading,
    error,
    fetchIntelligence,
    positionColor,
    positionLabel,
  }
}
