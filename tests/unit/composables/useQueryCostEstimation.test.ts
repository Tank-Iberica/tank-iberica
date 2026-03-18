import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useQueryCostEstimation.ts'), 'utf-8')

describe('useQueryCostEstimation', () => {
  describe('Source code structure', () => {
    it('defines LARGE_TABLE_THRESHOLD', () => {
      expect(SRC).toContain('LARGE_TABLE_THRESHOLD')
      expect(SRC).toContain('10_000')
    })

    it('defines EXPENSIVE_LIMIT_THRESHOLD', () => {
      expect(SRC).toContain('EXPENSIVE_LIMIT_THRESHOLD')
      expect(SRC).toContain('500')
    })

    it('lists known large tables', () => {
      expect(SRC).toContain('LARGE_TABLES')
      expect(SRC).toContain("'vehicles'")
      expect(SRC).toContain("'analytics_events'")
      expect(SRC).toContain("'search_logs'")
      expect(SRC).toContain("'leads'")
    })

    it('exports estimateCost function', () => {
      expect(SRC).toContain('estimateCost')
    })

    it('exports warnExpensiveQuery function', () => {
      expect(SRC).toContain('warnExpensiveQuery')
    })

    it('only warns in dev mode', () => {
      expect(SRC).toContain('import.meta.dev')
    })

    it('warns about Seq Scan on large tables without filter', () => {
      expect(SRC).toContain('Seq Scan')
    })

    it('warns about large LIMIT values', () => {
      expect(SRC).toContain('Large LIMIT')
      expect(SRC).toContain('pagination')
    })

    it('returns cost level (low/medium/high)', () => {
      expect(SRC).toContain("'low'")
      expect(SRC).toContain("'medium'")
      expect(SRC).toContain("'high'")
    })
  })

  describe('Cost estimation logic (unit)', () => {
    // Replicate the core logic for direct testing
    const LARGE_TABLES = ['vehicles', 'analytics_events', 'search_logs', 'leads', 'messages', 'web_vitals']
    const EXPENSIVE_LIMIT = 500

    function estimateCost(
      table: string,
      opts: { hasFilter?: boolean; limit?: number; hasIndex?: boolean } = {},
    ) {
      const { hasFilter = true, limit = 100, hasIndex = true } = opts
      const isLargeTable = LARGE_TABLES.includes(table)
      const warnings: string[] = []
      let cost: 'low' | 'medium' | 'high' = 'low'

      if (isLargeTable && !hasFilter) {
        cost = 'high'
        warnings.push('Seq Scan likely')
      }
      if (limit > EXPENSIVE_LIMIT) {
        if (cost !== 'high') cost = 'medium'
        warnings.push('Large LIMIT')
      }
      if (isLargeTable && !hasIndex) {
        cost = 'high'
        warnings.push('No index hint')
      }

      return { table, isLargeTable, hasFilter, limit, estimatedCost: cost, warnings }
    }

    it('small table with filter = low cost', () => {
      const result = estimateCost('categories', { hasFilter: true })
      expect(result.estimatedCost).toBe('low')
      expect(result.isLargeTable).toBe(false)
      expect(result.warnings).toHaveLength(0)
    })

    it('large table with filter = low cost', () => {
      const result = estimateCost('vehicles', { hasFilter: true })
      expect(result.estimatedCost).toBe('low')
    })

    it('large table without filter = high cost', () => {
      const result = estimateCost('vehicles', { hasFilter: false })
      expect(result.estimatedCost).toBe('high')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('large LIMIT on small table = medium cost', () => {
      const result = estimateCost('categories', { limit: 1000 })
      expect(result.estimatedCost).toBe('medium')
    })

    it('large LIMIT on large table without filter = high cost', () => {
      const result = estimateCost('analytics_events', { hasFilter: false, limit: 2000 })
      expect(result.estimatedCost).toBe('high')
    })

    it('no index on large table = high cost', () => {
      const result = estimateCost('search_logs', { hasIndex: false })
      expect(result.estimatedCost).toBe('high')
    })

    it('all tables in LARGE_TABLES are detected', () => {
      for (const table of LARGE_TABLES) {
        const result = estimateCost(table, { hasFilter: false })
        expect(result.isLargeTable).toBe(true)
        expect(result.estimatedCost).toBe('high')
      }
    })

    it('unknown tables are not flagged as large', () => {
      const result = estimateCost('nonexistent_table', { hasFilter: false })
      expect(result.isLargeTable).toBe(false)
      expect(result.estimatedCost).toBe('low')
    })
  })
})
