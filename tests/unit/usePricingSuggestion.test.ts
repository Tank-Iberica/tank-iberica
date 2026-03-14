/**
 * Tests for usePricingSuggestion composable (#25)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Must import after stubbing globals
const { usePricingSuggestion } = await import('../../app/composables/usePricingSuggestion.ts')

describe('usePricingSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when brand or model is empty', async () => {
    const { fetchSuggestion } = usePricingSuggestion({
      brand: ref(''),
      model: ref('Actros'),
    })
    await fetchSuggestion()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('builds correct query with all optional params', async () => {
    mockFetch.mockResolvedValue({
      suggested_price: 45000,
      confidence: 'high' as const,
      reasoning: 'Precio competitivo.',
      price_range: { min: 40000, max: 50000 },
      marketSamples: 12,
    })

    const { fetchSuggestion, suggestion } = usePricingSuggestion({
      brand: ref('Mercedes'),
      model: ref('Actros'),
      year: ref(2019),
      km: ref(200000),
      category: ref('tractora'),
      currentPrice: ref(48000),
    })

    await fetchSuggestion()

    expect(mockFetch).toHaveBeenCalledWith('/api/market/price-recommendation', {
      query: {
        brand: 'Mercedes',
        model: 'Actros',
        year: 2019,
        km: 200000,
        category: 'tractora',
        currentPrice: 48000,
      },
    })
    expect(suggestion.value?.suggested_price).toBe(45000)
    expect(suggestion.value?.confidence).toBe('high')
  })

  it('sets error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { fetchSuggestion, error, loading } = usePricingSuggestion({
      brand: ref('Volvo'),
      model: ref('FH'),
    })

    await fetchSuggestion()

    expect(error.value).toBe('Network error')
    expect(loading.value).toBe(false)
  })

  it('sets loading to false after fetch', async () => {
    mockFetch.mockResolvedValue({
      suggested_price: 30000,
      confidence: 'medium' as const,
      reasoning: 'Precio aceptable.',
      price_range: { min: 28000, max: 32000 },
      marketSamples: 5,
    })

    const { fetchSuggestion, loading } = usePricingSuggestion({
      brand: ref('DAF'),
      model: ref('XF'),
    })

    const promise = fetchSuggestion()
    await promise
    expect(loading.value).toBe(false)
  })

  it('suggestion has confidence low after fetch', async () => {
    mockFetch.mockResolvedValue({
      suggested_price: 50000,
      confidence: 'low' as const,
      reasoning: 'Datos insuficientes.',
      price_range: null,
      marketSamples: 1,
    })

    const { fetchSuggestion, suggestion } = usePricingSuggestion({
      brand: ref('Scania'),
      model: ref('R500'),
    })

    await fetchSuggestion()
    expect(suggestion.value?.confidence).toBe('low')
    expect(suggestion.value?.suggested_price).toBe(50000)
  })

  it('suggestion has confidence high and full price_range after fetch', async () => {
    mockFetch.mockResolvedValue({
      suggested_price: 60000,
      confidence: 'high' as const,
      reasoning: 'Precio bien posicionado.',
      price_range: { min: 55000, max: 65000 },
      marketSamples: 25,
    })

    const { fetchSuggestion, suggestion } = usePricingSuggestion({
      brand: ref('Scania'),
      model: ref('S500'),
    })

    await fetchSuggestion()
    expect(suggestion.value?.confidence).toBe('high')
    expect(suggestion.value?.price_range?.min).toBe(55000)
    expect(suggestion.value?.price_range?.max).toBe(65000)
    expect(suggestion.value?.marketSamples).toBe(25)
  })
})
