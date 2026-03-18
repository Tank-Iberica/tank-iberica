import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockGte = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockIn = vi.fn()
const mockEq = vi.fn()

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
}))

describe('useTopDealers', () => {
  let useTopDealers: typeof import('../../app/composables/useTopDealers').useTopDealers

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Default chain for dealers query
    mockFrom.mockImplementation((table: string) => {
      if (table === 'dealers') {
        return { select: mockSelect }
      }
      // vehicles query
      return { select: mockSelect }
    })
    mockSelect.mockReturnValue({ gte: mockGte, in: mockIn })
    mockGte.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockIn.mockReturnValue({ eq: mockEq })

    const mod = await import('../../app/composables/useTopDealers')
    useTopDealers = mod.useTopDealers
  })

  it('returns empty dealers list initially', () => {
    const { dealers, loading } = useTopDealers()
    expect(dealers.value).toEqual([])
    expect(loading.value).toBe(false)
  })

  it('loads top dealers with badge assignments', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'd1',
          company_name: 'Top Dealer',
          trust_score: 90,
          location_province: 'Madrid',
          verified_at: '2024-01-01',
        },
        {
          id: 'd2',
          company_name: 'Verified Dealer',
          trust_score: 65,
          location_province: 'Barcelona',
          verified_at: null,
        },
      ],
      error: null,
    })
    mockEq.mockResolvedValue({
      data: [{ dealer_id: 'd1' }, { dealer_id: 'd1' }, { dealer_id: 'd1' }, { dealer_id: 'd2' }],
    })

    const { dealers, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(dealers.value).toHaveLength(2)
    expect(dealers.value[0].badge).toBe('top')
    expect(dealers.value[0].vehicle_count).toBe(3)
    expect(dealers.value[1].badge).toBe('verified')
    expect(dealers.value[1].vehicle_count).toBe(1)
  })

  it('handles empty results', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { dealers, loadTopDealers, error } = useTopDealers()
    await loadTopDealers()

    expect(dealers.value).toEqual([])
    expect(error.value).toBeNull()
  })

  it('handles fetch error gracefully', async () => {
    mockLimit.mockResolvedValue({
      data: null,
      error: { message: 'Connection error' },
    })

    const { error, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(error.value).toBe('Connection error')
  })

  it('passes limit to query', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { loadTopDealers } = useTopDealers()
    await loadTopDealers(50)

    expect(mockLimit).toHaveBeenCalledWith(50)
  })

  it('defaults limit to 100', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(mockLimit).toHaveBeenCalledWith(100)
  })

  it('handles dealers with null company_name', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'd3',
          company_name: null,
          trust_score: 75,
          location_province: null,
          verified_at: null,
        },
      ],
      error: null,
    })
    mockEq.mockResolvedValue({ data: [] })

    const { dealers, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(dealers.value[0].company_name).toBeNull()
    expect(dealers.value[0].vehicle_count).toBe(0)
  })

  it('sets loading state correctly during fetch', async () => {
    let resolvePromise: (value: unknown) => void
    const pending = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockLimit.mockReturnValue(pending)

    const { loading, loadTopDealers } = useTopDealers()
    expect(loading.value).toBe(false)

    const promise = loadTopDealers()
    expect(loading.value).toBe(true)

    resolvePromise!({ data: [], error: null })
    await promise

    expect(loading.value).toBe(false)
  })

  // ─── #55 Scoreboard expanded tests ───────────────────────────────────────

  it('assigns "top" badge to dealers with trust_score >= 80', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'd1', company_name: 'Elite Dealer', trust_score: 80, location_province: 'Madrid', verified_at: '2024-01-01' },
        { id: 'd2', company_name: 'Super Dealer', trust_score: 95, location_province: 'Barcelona', verified_at: '2024-01-01' },
      ],
      error: null,
    })
    mockEq.mockResolvedValue({ data: [] })

    const { dealers, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(dealers.value[0].badge).toBe('top')
    expect(dealers.value[1].badge).toBe('top')
  })

  it('assigns "verified" badge to dealers with trust_score 60-79', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'd1', company_name: 'Good Dealer', trust_score: 60, location_province: 'Sevilla', verified_at: null },
        { id: 'd2', company_name: 'Better Dealer', trust_score: 79, location_province: 'Valencia', verified_at: null },
      ],
      error: null,
    })
    mockEq.mockResolvedValue({ data: [] })

    const { dealers, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(dealers.value[0].badge).toBe('verified')
    expect(dealers.value[1].badge).toBe('verified')
  })

  it('queries dealers with trust_score >= 60', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(mockGte).toHaveBeenCalledWith('trust_score', 60)
  })

  it('orders by trust_score descending', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(mockOrder).toHaveBeenCalledWith('trust_score', { ascending: false })
  })

  it('resets error before each fetch', async () => {
    // First call fails
    mockLimit.mockResolvedValue({ data: null, error: { message: 'First error' } })
    const { error, loadTopDealers } = useTopDealers()
    await loadTopDealers()
    expect(error.value).toBe('First error')

    // Second call succeeds
    mockLimit.mockResolvedValue({ data: [], error: null })
    await loadTopDealers()
    expect(error.value).toBeNull()
  })

  it('handles exception in loadTopDealers gracefully', async () => {
    mockLimit.mockRejectedValue(new Error('Network failure'))

    const { error, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(error.value).toBe('Network failure')
  })

  it('handles non-Error exception in loadTopDealers', async () => {
    mockLimit.mockRejectedValue('string error')

    const { error, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(error.value).toBe('Unknown error')
  })

  it('sets loading to false even when fetch throws', async () => {
    mockLimit.mockRejectedValue(new Error('Crash'))

    const { loading, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(loading.value).toBe(false)
  })

  it('fetches vehicle counts for returned dealers', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'd1', company_name: 'Dealer A', trust_score: 85, location_province: 'Madrid', verified_at: '2024-01-01' },
      ],
      error: null,
    })
    mockEq.mockResolvedValue({
      data: [{ dealer_id: 'd1' }, { dealer_id: 'd1' }, { dealer_id: 'd1' }, { dealer_id: 'd1' }, { dealer_id: 'd1' }],
    })

    const { dealers, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    expect(dealers.value[0].vehicle_count).toBe(5)
  })

  it('skips vehicle count query when no dealers returned', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { loadTopDealers } = useTopDealers()
    await loadTopDealers()

    // mockIn is only called for vehicle count query — should not be called with no dealers
    expect(mockIn).not.toHaveBeenCalled()
  })

  it('preserves all dealer fields in output', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'd1', company_name: 'Full Dealer', trust_score: 92, location_province: 'Bilbao', verified_at: '2024-06-15' },
      ],
      error: null,
    })
    mockEq.mockResolvedValue({ data: [{ dealer_id: 'd1' }] })

    const { dealers, loadTopDealers } = useTopDealers()
    await loadTopDealers()

    const dealer = dealers.value[0]
    expect(dealer.id).toBe('d1')
    expect(dealer.company_name).toBe('Full Dealer')
    expect(dealer.trust_score).toBe(92)
    expect(dealer.location_province).toBe('Bilbao')
    expect(dealer.verified_at).toBe('2024-06-15')
    expect(dealer.badge).toBe('top')
    expect(dealer.vehicle_count).toBe(1)
  })
})
