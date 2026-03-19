import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

vi.mock('../../../server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

const mockRpc = vi.fn()
const mockSelectChain = {
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  select: vi.fn().mockReturnThis(),
}
const mockFrom = vi.fn(() => mockSelectChain)
const mockClient = { rpc: mockRpc, from: mockFrom }
vi.stubGlobal(
  'useSupabaseServiceClient',
  vi.fn(() => mockClient),
)

import {
  assignExperiment,
  trackExperimentEvent,
  getExperimentResults,
} from '../../../server/utils/experiments'

const mockEvent = {} as H3Event

describe('A/B Testing Infrastructure (#268)', () => {
  describe('assignExperiment', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns null when no userId and no anonymousId', async () => {
      const result = await assignExperiment(mockEvent, 'test-exp', null, null)
      expect(result).toBeNull()
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns null when both are undefined', async () => {
      const result = await assignExperiment(mockEvent, 'test-exp')
      expect(result).toBeNull()
    })

    it('calls RPC assign_experiment with correct params (userId)', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'variant_a', error: null })

      const result = await assignExperiment(mockEvent, 'homepage-cta', 'user-123', null)
      expect(result).toBe('variant_a')
      expect(mockRpc).toHaveBeenCalledWith('assign_experiment', {
        p_experiment_key: 'homepage-cta',
        p_user_id: 'user-123',
        p_anonymous_id: null,
      })
    })

    it('calls RPC assign_experiment with anonymousId', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'control', error: null })

      const result = await assignExperiment(mockEvent, 'pricing-test', null, 'anon-456')
      expect(result).toBe('control')
      expect(mockRpc).toHaveBeenCalledWith('assign_experiment', {
        p_experiment_key: 'pricing-test',
        p_user_id: null,
        p_anonymous_id: 'anon-456',
      })
    })

    it('falls back to deterministic assignment on RPC error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'DB down' } })

      const result = await assignExperiment(mockEvent, 'test-exp', 'user-1', null)
      expect(result).toBeDefined()
      expect(['control', 'variant_a']).toContain(result)
    })

    it('falls back to deterministic assignment on exception', async () => {
      mockRpc.mockRejectedValueOnce(new Error('Network error'))

      const result = await assignExperiment(mockEvent, 'test-exp', 'user-1', null)
      expect(['control', 'variant_a']).toContain(result)
    })

    it('deterministic fallback is consistent (same input → same output)', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'down' } })

      const result1 = await assignExperiment(mockEvent, 'exp-a', 'user-42', null)
      const result2 = await assignExperiment(mockEvent, 'exp-a', 'user-42', null)
      expect(result1).toBe(result2)
    })

    it('deterministic fallback varies by experiment key', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'down' } })

      const results = new Set<string>()
      for (let i = 0; i < 20; i++) {
        const r = await assignExperiment(mockEvent, `exp-${i}`, 'user-42', null)
        results.add(r!)
      }
      expect(results.size).toBe(2)
    })
  })

  describe('trackExperimentEvent', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'exp-uuid-1' }, error: null })
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockTrackSelect = vi.fn(() => ({ eq: mockEq }))
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'experiments') return { select: mockTrackSelect }
        if (table === 'experiment_events') return { insert: mockInsert }
        return mockSelectChain
      })
    })

    it('inserts event and returns true on success', async () => {
      const result = await trackExperimentEvent(
        mockEvent,
        'homepage-cta',
        'variant_a',
        'conversion',
        'user-1',
        null,
        { page: '/pricing' },
      )
      expect(result).toBe(true)
    })

    it('returns false when experiment not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockTrackSelect = vi.fn(() => ({ eq: mockEq }))
      mockFrom.mockImplementation((table: string) => {
        if (table === 'experiments') return { select: mockTrackSelect }
        return mockSelectChain
      })

      const result = await trackExperimentEvent(mockEvent, 'nonexistent', 'control', 'click')
      expect(result).toBe(false)
    })

    it('returns false on exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB crash')
      })

      const result = await trackExperimentEvent(mockEvent, 'test', 'control', 'click')
      expect(result).toBe(false)
    })
  })

  describe('getExperimentResults', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns null when experiment not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await getExperimentResults(mockEvent, 'nonexistent')
      expect(result).toBeNull()
    })

    it('computes conversion rates correctly', async () => {
      const experimentData = {
        id: 'exp-1',
        key: 'pricing-test',
        name: 'Pricing Test',
        description: null,
        status: 'active',
        variants: [
          { id: 'control', weight: 50 },
          { id: 'variant_a', weight: 50 },
        ],
        target_sample_size: 1000,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        ended_at: null,
      }

      const assignments = [
        ...Array(60).fill({ variant_id: 'control' }),
        ...Array(40).fill({ variant_id: 'variant_a' }),
      ]

      const conversions = [
        ...Array(12).fill({ variant_id: 'control' }),
        ...Array(10).fill({ variant_id: 'variant_a' }),
      ]

      mockFrom.mockImplementation((table: string) => {
        if (table === 'experiments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: experimentData, error: null }),
              })),
            })),
          }
        }
        if (table === 'experiment_assignments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: assignments, error: null }),
            })),
          }
        }
        if (table === 'experiment_events') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ data: conversions, error: null }),
              })),
            })),
          }
        }
        return mockSelectChain
      })

      const result = await getExperimentResults(mockEvent, 'pricing-test')

      expect(result).not.toBeNull()
      expect(result!.total_participants).toBe(100)
      expect(result!.total_conversions).toBe(22)
      expect(result!.overall_conversion_rate).toBeCloseTo(0.22)

      const controlVariant = result!.variants.find((v) => v.variant_id === 'control')!
      expect(controlVariant.participants).toBe(60)
      expect(controlVariant.conversions).toBe(12)
      expect(controlVariant.conversion_rate).toBeCloseTo(0.2)

      const variantA = result!.variants.find((v) => v.variant_id === 'variant_a')!
      expect(variantA.participants).toBe(40)
      expect(variantA.conversions).toBe(10)
      expect(variantA.conversion_rate).toBeCloseTo(0.25)
    })
  })
})
