import { describe, it, expect, vi } from 'vitest'

import { useQueryCostEstimation } from '../../../app/composables/useQueryCostEstimation'

describe('useQueryCostEstimation', () => {
  describe('Return shape', () => {
    it('returns expected API', () => {
      const result = useQueryCostEstimation()
      expect(result).toHaveProperty('estimateCost')
      expect(result).toHaveProperty('warnExpensiveQuery')
      expect(result).toHaveProperty('LARGE_TABLES')
      expect(result).toHaveProperty('LARGE_TABLE_THRESHOLD')
      expect(result).toHaveProperty('EXPENSIVE_LIMIT_THRESHOLD')
    })

    it('LARGE_TABLE_THRESHOLD is 10000', () => {
      const { LARGE_TABLE_THRESHOLD } = useQueryCostEstimation()
      expect(LARGE_TABLE_THRESHOLD).toBe(10_000)
    })

    it('EXPENSIVE_LIMIT_THRESHOLD is 500', () => {
      const { EXPENSIVE_LIMIT_THRESHOLD } = useQueryCostEstimation()
      expect(EXPENSIVE_LIMIT_THRESHOLD).toBe(500)
    })

    it('LARGE_TABLES includes expected tables', () => {
      const { LARGE_TABLES } = useQueryCostEstimation()
      expect(LARGE_TABLES).toContain('vehicles')
      expect(LARGE_TABLES).toContain('analytics_events')
      expect(LARGE_TABLES).toContain('leads')
    })
  })

  describe('estimateCost', () => {
    it('returns low cost for small table with filter', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('small_table', { hasFilter: true, limit: 10 })
      expect(result.estimatedCost).toBe('low')
      expect(result.warnings).toHaveLength(0)
    })

    it('returns high cost for large table without filter', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('vehicles', { hasFilter: false })
      expect(result.estimatedCost).toBe('high')
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Seq Scan')
    })

    it('returns medium cost for large limit', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('small_table', { limit: 1000 })
      expect(result.estimatedCost).toBe('medium')
      expect(result.warnings.some((w) => w.includes('Large LIMIT'))).toBe(true)
    })

    it('returns high cost for large table without index', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('analytics_events', { hasIndex: false })
      expect(result.estimatedCost).toBe('high')
      expect(result.warnings.some((w) => w.includes('No index hint'))).toBe(true)
    })

    it('detects large tables correctly', () => {
      const { estimateCost } = useQueryCostEstimation()
      expect(estimateCost('vehicles').isLargeTable).toBe(true)
      expect(estimateCost('analytics_events').isLargeTable).toBe(true)
      expect(estimateCost('vertical_config').isLargeTable).toBe(false)
    })

    it('returns correct shape', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('vehicles', { hasFilter: true, limit: 50 })
      expect(result).toHaveProperty('table', 'vehicles')
      expect(result).toHaveProperty('isLargeTable', true)
      expect(result).toHaveProperty('hasFilter', true)
      expect(result).toHaveProperty('limit', 50)
      expect(result).toHaveProperty('estimatedCost')
      expect(result).toHaveProperty('warnings')
    })

    it('defaults hasFilter to true, limit to 100, hasIndex to true', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('vehicles')
      expect(result.hasFilter).toBe(true)
      expect(result.limit).toBe(100)
      expect(result.estimatedCost).toBe('low')
    })

    it('large limit + no filter on large table = high', () => {
      const { estimateCost } = useQueryCostEstimation()
      const result = estimateCost('vehicles', { hasFilter: false, limit: 1000 })
      expect(result.estimatedCost).toBe('high')
      expect(result.warnings.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('warnExpensiveQuery', () => {
    it('returns same estimate as estimateCost', () => {
      const { estimateCost, warnExpensiveQuery } = useQueryCostEstimation()
      const estimate = estimateCost('vehicles', { hasFilter: false })
      const warned = warnExpensiveQuery('vehicles', { hasFilter: false })
      expect(warned.estimatedCost).toBe(estimate.estimatedCost)
    })

    it('logs warning for expensive queries in dev mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { warnExpensiveQuery } = useQueryCostEstimation()
      warnExpensiveQuery('vehicles', { hasFilter: false })
      // import.meta.dev = true in tests
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('QueryCost'), expect.any(String))
      warnSpy.mockRestore()
    })

    it('does not log for low-cost queries', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { warnExpensiveQuery } = useQueryCostEstimation()
      warnExpensiveQuery('small_table', { hasFilter: true, limit: 10 })
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })
})
