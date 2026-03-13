/**
 * Tests for POST /api/cron/refresh-matviews
 * #144 Bloque 18
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyCron } = vi.hoisted(() => ({
  mockVerifyCron: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/verifyCronSecret', () => ({
  verifyCronSecret: (...a: unknown[]) => mockVerifyCron(...a),
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockRpc: ReturnType<typeof vi.fn>
let mockSupabase: Record<string, unknown>

function makeSupabase(opts: {
  failViews?: string[]
} = {}) {
  const { failViews = [] } = opts
  mockRpc = vi.fn().mockImplementation((_fn: string, { view_name }: { view_name: string }) => {
    if (failViews.includes(view_name)) {
      return Promise.resolve({ error: { message: `Refresh failed for ${view_name}` } })
    }
    return Promise.resolve({ error: null })
  })
  return { rpc: mockRpc }
}

import handler from '../../../server/api/cron/refresh-matviews.post'

describe('POST /api/cron/refresh-matviews', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase = makeSupabase()
  })

  it('returns ok=true when all views refresh successfully', async () => {
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true, failed: 0 })
    expect(result.results['mv_dashboard_kpis']).toBe('ok')
    expect(result.results['mv_search_facets']).toBe('ok')
  })

  it('refreshes exactly 2 views', async () => {
    await handler({} as any)
    expect(mockRpc).toHaveBeenCalledTimes(2)
  })

  it('calls refresh_matview for mv_dashboard_kpis', async () => {
    await handler({} as any)
    expect(mockRpc).toHaveBeenCalledWith('refresh_matview', { view_name: 'mv_dashboard_kpis' })
  })

  it('calls refresh_matview for mv_search_facets', async () => {
    await handler({} as any)
    expect(mockRpc).toHaveBeenCalledWith('refresh_matview', { view_name: 'mv_search_facets' })
  })

  it('returns ok=false when a view fails', async () => {
    mockSupabase = makeSupabase({ failViews: ['mv_dashboard_kpis'] })
    const result = await handler({} as any)
    expect(result.ok).toBe(false)
    expect(result.failed).toBe(1)
    expect(result.results['mv_dashboard_kpis']).toBe('error')
    expect(result.results['mv_search_facets']).toBe('ok')
  })

  it('returns ok=false when both views fail', async () => {
    mockSupabase = makeSupabase({ failViews: ['mv_dashboard_kpis', 'mv_search_facets'] })
    const result = await handler({} as any)
    expect(result.ok).toBe(false)
    expect(result.failed).toBe(2)
  })

  it('includes durationMs in response', async () => {
    const result = await handler({} as any)
    expect(typeof result.durationMs).toBe('number')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('continues refreshing remaining views after one fails', async () => {
    mockSupabase = makeSupabase({ failViews: ['mv_dashboard_kpis'] })
    const result = await handler({} as any)
    // Both views attempted
    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(result.results['mv_search_facets']).toBe('ok')
  })
})
