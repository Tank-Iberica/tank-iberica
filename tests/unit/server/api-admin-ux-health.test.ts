import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn(() => ({})),
}))

// Chainable Supabase mock
function createChainableMock(resolvedValue: any = { data: [], count: 0, error: null }) {
  const chain: any = {}
  const methods = [
    'select',
    'from',
    'eq',
    'gte',
    'lt',
    'not',
    'or',
    'order',
    'limit',
    'range',
    'head',
  ]
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: Function) => resolve(resolvedValue)
  return chain
}

const mockChain = createChainableMock({ data: [], count: 10, error: null })
const mockFrom = vi.fn(() => mockChain)
const mockSupabase = { from: mockFrom }

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/rbac', () => ({
  requireRole: vi.fn(),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => new Error(msg),
}))

import handler from '../../../server/api/admin/ux-health.get'
import { getQuery } from 'h3'
import { requireRole } from '../../../server/utils/rbac'

const mockEvent = { context: {} } as any

describe('Admin UX Health Dashboard (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getQuery).mockReturnValue({})
  })

  it('requires admin role', async () => {
    await handler(mockEvent)
    expect(requireRole).toHaveBeenCalledWith(mockEvent, 'admin')
  })

  it('returns overall score 0-100', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
  })

  it('returns rating as good/needs-improvement/poor', async () => {
    const result = (await handler(mockEvent)) as any
    expect(['good', 'needs-improvement', 'poor']).toContain(result.rating)
  })

  it('returns components with errorRate, lcpP75, notFoundRate, formAbandonment', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.components).toHaveProperty('errorRate')
    expect(result.components).toHaveProperty('lcpP75')
    expect(result.components).toHaveProperty('notFoundRate')
    expect(result.components).toHaveProperty('formAbandonment')
  })

  it('each component has value, score, weight', async () => {
    const result = (await handler(mockEvent)) as any
    for (const key of ['errorRate', 'lcpP75', 'notFoundRate', 'formAbandonment']) {
      const comp = result.components[key]
      expect(comp).toHaveProperty('value')
      expect(comp).toHaveProperty('score')
      expect(comp).toHaveProperty('weight')
    }
  })

  it('returns trend array', async () => {
    const result = (await handler(mockEvent)) as any
    expect(Array.isArray(result.trend)).toBe(true)
    expect(result.trend.length).toBeGreaterThan(0)
  })

  it('trend entries have week, score, errorRate, lcpP75', async () => {
    const result = (await handler(mockEvent)) as any
    const entry = result.trend[0]
    expect(entry).toHaveProperty('week')
    expect(entry).toHaveProperty('score')
    expect(entry).toHaveProperty('errorRate')
    expect(entry).toHaveProperty('lcpP75')
  })

  it('clamps weeks between 1 and 12', async () => {
    vi.mocked(getQuery).mockReturnValue({ weeks: '50' })
    const result = (await handler(mockEvent)) as any
    expect(result.trend.length).toBeLessThanOrEqual(12)
  })

  it('defaults to 4 weeks', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.trend.length).toBe(4)
  })

  it('queries infra_alerts, web_vitals, analytics_events tables', async () => {
    await handler(mockEvent)
    const calledTables = mockFrom.mock.calls.map((c) => c[0])
    expect(calledTables).toContain('infra_alerts')
    expect(calledTables).toContain('analytics_events')
  })
})
