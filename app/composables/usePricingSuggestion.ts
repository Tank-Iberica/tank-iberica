/**
 * usePricingSuggestion — AI-powered price recommendation composable.
 *
 * Calls GET /api/market/price-recommendation with vehicle data and returns
 * an AI-generated price suggestion with market context.
 */

interface PriceSuggestion {
  suggested_price: number | null
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  price_range: { min: number; max: number } | null
  marketSamples: number
  aiUnavailable?: boolean
}

interface UsePricingSuggestionParams {
  brand: Ref<string>
  model: Ref<string>
  year?: Ref<number | undefined>
  km?: Ref<number | undefined>
  category?: Ref<string | undefined>
  currentPrice?: Ref<number | undefined>
}

export function usePricingSuggestion(params: UsePricingSuggestionParams) {
  const suggestion = ref<PriceSuggestion | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSuggestion() {
    if (!params.brand.value || !params.model.value) return
    loading.value = true
    error.value = null

    try {
      const query: Record<string, string | number> = {
        brand: params.brand.value,
        model: params.model.value,
      }
      if (params.year?.value) query.year = params.year.value
      if (params.km?.value != null) query.km = params.km.value
      if (params.category?.value) query.category = params.category.value
      if (params.currentPrice?.value != null) query.currentPrice = params.currentPrice.value

      suggestion.value = await $fetch<PriceSuggestion>('/api/market/price-recommendation', {
        query,
      })
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al obtener recomendación de precio'
    } finally {
      loading.value = false
    }
  }

  /** Confidence label in Spanish */
  const confidenceLabel = computed(() => {
    const map: Record<string, string> = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    }
    return suggestion.value ? (map[suggestion.value.confidence] ?? '—') : '—'
  })

  /** CSS color class for confidence badge */
  const confidenceColor = computed(() => {
    const map: Record<string, string> = {
      high: 'text-green-700 bg-green-100',
      medium: 'text-yellow-700 bg-yellow-100',
      low: 'text-gray-600 bg-gray-100',
    }
    return suggestion.value ? (map[suggestion.value.confidence] ?? 'text-gray-600 bg-gray-100') : ''
  })

  return {
    suggestion,
    loading,
    error,
    fetchSuggestion,
    confidenceLabel,
    confidenceColor,
  }
}
