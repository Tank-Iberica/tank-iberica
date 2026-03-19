import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal(
  'useState',
  vi.fn((_key: string, init?: () => unknown) => ref(init ? init() : [])),
)

import { useQueryBudget } from '../../../app/composables/useQueryBudget'

describe('useQueryBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useState).mockImplementation(
      (_key: string, init?: () => unknown) => ref(init ? init() : []) as any,
    )
  })

  describe('Return shape', () => {
    it('returns expected API', () => {
      const result = useQueryBudget()
      expect(result).toHaveProperty('trackQuery')
      expect(result).toHaveProperty('getQueryCount')
      expect(result).toHaveProperty('getQueries')
      expect(result).toHaveProperty('checkBudget')
      expect(result).toHaveProperty('resetBudget')
      expect(result).toHaveProperty('MAX_QUERIES_PER_PAGE')
    })

    it('MAX_QUERIES_PER_PAGE is 5', () => {
      const { MAX_QUERIES_PER_PAGE } = useQueryBudget()
      expect(MAX_QUERIES_PER_PAGE).toBe(5)
    })
  })

  describe('trackQuery', () => {
    it('starts with 0 queries', () => {
      const { getQueryCount } = useQueryBudget()
      expect(getQueryCount()).toBe(0)
    })

    it('increments query count', () => {
      const { trackQuery, getQueryCount } = useQueryBudget()
      trackQuery('vehicles.select')
      trackQuery('categories.select')
      // import.meta.dev = true in tests (vitest config transforms it)
      expect(getQueryCount()).toBe(2)
    })

    it('stores labels', () => {
      const { trackQuery, getQueries } = useQueryBudget()
      trackQuery('vehicles.select')
      trackQuery('dealers.select')
      const queries = getQueries()
      expect(queries[0].label).toBe('vehicles.select')
      expect(queries[1].label).toBe('dealers.select')
    })

    it('stores timestamps', () => {
      const { trackQuery, getQueries } = useQueryBudget()
      trackQuery('test')
      expect(getQueries()[0].timestamp).toBeTypeOf('number')
    })

    it('uses "unknown" as default label', () => {
      const { trackQuery, getQueries } = useQueryBudget()
      trackQuery()
      expect(getQueries()[0].label).toBe('unknown')
    })
  })

  describe('checkBudget', () => {
    it('returns true when within budget', () => {
      const { trackQuery, checkBudget } = useQueryBudget()
      for (let i = 0; i < 5; i++) trackQuery(`q${i}`)
      expect(checkBudget()).toBe(true)
    })

    it('returns false when exceeding budget', () => {
      const { trackQuery, checkBudget } = useQueryBudget()
      for (let i = 0; i < 6; i++) trackQuery(`q${i}`)
      expect(checkBudget()).toBe(false)
    })

    it('warns on console when budget exceeded', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { trackQuery, checkBudget } = useQueryBudget()
      for (let i = 0; i < 6; i++) trackQuery(`q${i}`)
      checkBudget()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('QueryBudget'),
        expect.any(Array),
      )
      warnSpy.mockRestore()
    })
  })

  describe('resetBudget', () => {
    it('clears all tracked queries', () => {
      const { trackQuery, getQueryCount, resetBudget } = useQueryBudget()
      for (let i = 0; i < 10; i++) trackQuery(`q${i}`)
      expect(getQueryCount()).toBe(10)
      resetBudget()
      expect(getQueryCount()).toBe(0)
    })

    it('budget passes after reset', () => {
      const { trackQuery, checkBudget, resetBudget } = useQueryBudget()
      for (let i = 0; i < 10; i++) trackQuery(`q${i}`)
      expect(checkBudget()).toBe(false)
      resetBudget()
      expect(checkBudget()).toBe(true)
    })
  })
})
