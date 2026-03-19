import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

const mockRpc = vi.fn()
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({ rpc: mockRpc }),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

import handler from '../../../server/api/cron/refresh-matviews.post'
import { logger } from '../../../server/utils/logger'
import { verifyCronSecret } from '../../../server/utils/verifyCronSecret'

const mockEvent = { context: {} } as any

describe('Materialized views refresh schedule (#144)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
  })

  it('verifies cron secret', async () => {
    await handler(mockEvent)
    expect(verifyCronSecret).toHaveBeenCalledWith(mockEvent)
  })

  it('refreshes mv_dashboard_kpis', async () => {
    await handler(mockEvent)
    expect(mockRpc).toHaveBeenCalledWith('refresh_matview', { view_name: 'mv_dashboard_kpis' })
  })

  it('refreshes mv_search_facets', async () => {
    await handler(mockEvent)
    expect(mockRpc).toHaveBeenCalledWith('refresh_matview', { view_name: 'mv_search_facets' })
  })

  it('returns ok=true when all views refresh successfully', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(true)
    expect(result.failed).toBe(0)
  })

  it('returns results map for each view', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.results.mv_dashboard_kpis).toBe('ok')
    expect(result.results.mv_search_facets).toBe('ok')
  })

  it('returns durationMs', async () => {
    const result = (await handler(mockEvent)) as any
    expect(typeof result.durationMs).toBe('number')
  })

  it('handles partial failure (one view errors)', async () => {
    mockRpc
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'view not found' } })
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(false)
    expect(result.failed).toBe(1)
    expect(result.results.mv_dashboard_kpis).toBe('ok')
    expect(result.results.mv_search_facets).toBe('error')
  })

  it('logs error on view refresh failure', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'timeout' } })
    await handler(mockEvent)
    expect(logger.error).toHaveBeenCalled()
  })

  it('logs success info for each refreshed view', async () => {
    await handler(mockEvent)
    expect(logger.info).toHaveBeenCalled()
  })
})
