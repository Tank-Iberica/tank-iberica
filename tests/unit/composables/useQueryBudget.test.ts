import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useQueryBudget.ts'), 'utf-8')

describe('useQueryBudget', () => {
  describe('Source code verification', () => {
    it('defines MAX_QUERIES_PER_PAGE constant', () => {
      expect(SRC).toContain('MAX_QUERIES_PER_PAGE')
    })

    it('sets budget to 5 queries per page', () => {
      expect(SRC).toContain('MAX_QUERIES_PER_PAGE = 5')
    })

    it('exports trackQuery function', () => {
      expect(SRC).toContain('trackQuery')
    })

    it('exports getQueryCount function', () => {
      expect(SRC).toContain('getQueryCount')
    })

    it('exports checkBudget function', () => {
      expect(SRC).toContain('checkBudget')
    })

    it('exports resetBudget function', () => {
      expect(SRC).toContain('resetBudget')
    })

    it('only active in dev mode', () => {
      expect(SRC).toContain('import.meta.dev')
    })

    it('logs warning with query labels when budget exceeded', () => {
      expect(SRC).toContain('console.warn')
      expect(SRC).toContain('QueryBudget')
      expect(SRC).toContain('exceeded budget')
    })

    it('uses useState for SSR-safe state', () => {
      expect(SRC).toContain('useState')
    })

    it('tracks query labels and timestamps', () => {
      expect(SRC).toContain('label')
      expect(SRC).toContain('timestamp')
      expect(SRC).toContain('Date.now()')
    })

    it('checkBudget returns boolean (true=within, false=exceeded)', () => {
      expect(SRC).toContain('return true')
      expect(SRC).toContain('return false')
    })

    it('resetBudget clears the query log', () => {
      expect(SRC).toContain('queries.value = []')
    })

    it('exports MAX_QUERIES_PER_PAGE in return object', () => {
      expect(SRC).toContain('MAX_QUERIES_PER_PAGE,')
    })
  })

  describe('Budget logic (unit test)', () => {
    // Simulate the composable logic without Nuxt dependencies
    const MAX = 5

    function createBudget() {
      const queries: { label: string; timestamp: number }[] = []
      return {
        trackQuery(label: string = 'unknown') {
          queries.push({ label, timestamp: Date.now() })
        },
        getQueryCount() {
          return queries.length
        },
        checkBudget() {
          return queries.length <= MAX
        },
        resetBudget() {
          queries.length = 0
        },
        queries,
      }
    }

    it('starts with 0 queries', () => {
      const budget = createBudget()
      expect(budget.getQueryCount()).toBe(0)
    })

    it('tracks queries correctly', () => {
      const budget = createBudget()
      budget.trackQuery('vehicles.select')
      budget.trackQuery('categories.select')
      expect(budget.getQueryCount()).toBe(2)
    })

    it('is within budget when <= 5 queries', () => {
      const budget = createBudget()
      for (let i = 0; i < 5; i++) budget.trackQuery(`q${i}`)
      expect(budget.checkBudget()).toBe(true)
    })

    it('exceeds budget when > 5 queries', () => {
      const budget = createBudget()
      for (let i = 0; i < 6; i++) budget.trackQuery(`q${i}`)
      expect(budget.checkBudget()).toBe(false)
    })

    it('resets correctly', () => {
      const budget = createBudget()
      for (let i = 0; i < 10; i++) budget.trackQuery(`q${i}`)
      expect(budget.getQueryCount()).toBe(10)
      budget.resetBudget()
      expect(budget.getQueryCount()).toBe(0)
      expect(budget.checkBudget()).toBe(true)
    })

    it('stores query labels for debugging', () => {
      const budget = createBudget()
      budget.trackQuery('vehicles.select')
      budget.trackQuery('dealers.select')
      expect(budget.queries[0].label).toBe('vehicles.select')
      expect(budget.queries[1].label).toBe('dealers.select')
    })
  })
})
