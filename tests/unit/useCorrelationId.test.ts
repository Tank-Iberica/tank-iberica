import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useFetch
const mockUseFetch = vi.fn().mockReturnValue({ data: ref(null), error: ref(null) })
vi.stubGlobal('useFetch', mockUseFetch)

// Mock sessionStorage
const mockStorage: Record<string, string> = {}
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
})

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'test-uuid-1234') })

import { useCorrelationId } from '../../app/composables/useCorrelationId'

describe('useCorrelationId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete mockStorage.correlation_session_id
  })

  it('returns a correlationId', () => {
    const { correlationId } = useCorrelationId()
    expect(typeof correlationId).toBe('string')
    expect(correlationId.length).toBeGreaterThan(0)
  })

  it('fetchWithCorrelation adds correlation header', () => {
    const { fetchWithCorrelation, correlationId } = useCorrelationId()
    fetchWithCorrelation('/api/test', { method: 'POST' })
    expect(mockUseFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-correlation-id': correlationId,
        }),
        method: 'POST',
      }),
    )
  })

  it('fetchWithCorrelation preserves existing headers', () => {
    const { fetchWithCorrelation } = useCorrelationId()
    fetchWithCorrelation('/api/test', { headers: { 'Authorization': 'Bearer x' } })
    expect(mockUseFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer x',
          'x-correlation-id': expect.any(String),
        }),
      }),
    )
  })

  it('fetchWithCorrelation works without options', () => {
    const { fetchWithCorrelation } = useCorrelationId()
    fetchWithCorrelation('/api/test')
    expect(mockUseFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-correlation-id': expect.any(String),
        }),
      }),
    )
  })
})
