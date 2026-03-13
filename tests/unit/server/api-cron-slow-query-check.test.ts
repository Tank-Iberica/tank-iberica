/**
 * Tests for POST /api/cron/slow-query-check
 * #143 Bloque 18
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

let mockSupabase: Record<string, unknown>

const SLOW_ROWS = [
  {
    query_hash: 'abc123',
    query_text: 'SELECT * FROM vehicles WHERE brand = $1',
    calls: 100,
    mean_exec_ms: 750,
    max_exec_ms: 1200,
    total_exec_ms: 75000,
    rows_per_call: 5.2,
  },
  {
    query_hash: 'def456',
    query_text: 'SELECT * FROM analytics_events',
    calls: 50,
    mean_exec_ms: 2500,
    max_exec_ms: 3100,
    total_exec_ms: 125000,
    rows_per_call: 120,
  },
]

function makeSupabase(opts: {
  rows?: typeof SLOW_ROWS | []
  rpcError?: boolean
  insertError?: boolean
} = {}) {
  const { rows = SLOW_ROWS, rpcError = false, insertError = false } = opts
  const upsertMock = vi.fn().mockResolvedValue({ error: insertError ? { message: 'insert error' } : null })

  return {
    rpc: vi.fn().mockResolvedValue(
      rpcError
        ? { data: null, error: { message: 'pg_stat_statements not available' } }
        : { data: rows, error: null },
    ),
    from: vi.fn().mockReturnValue({ upsert: upsertMock }),
  }
}

import handler from '../../../server/api/cron/slow-query-check.post'

describe('POST /api/cron/slow-query-check', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NUXT_PUBLIC_VERTICAL = 'tracciona'
    mockSupabase = makeSupabase()
  })

  it('returns ok=true with captured count', async () => {
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true, captured: 2 })
  })

  it('returns alerted=1 for query with mean_exec_ms >=2000', async () => {
    const result = await handler({} as any)
    expect(result.alerted).toBe(1)
  })

  it('calls get_slow_queries RPC with threshold 500', async () => {
    await handler({} as any)
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'get_slow_queries',
      { p_threshold_ms: 500 },
    )
  })

  it('upserts rows to slow_query_logs', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ upsert: upsertSpy })

    await handler({} as any)
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ query_hash: 'abc123', mean_exec_ms: 750 }),
        expect.objectContaining({ query_hash: 'def456', mean_exec_ms: 2500 }),
      ]),
      expect.objectContaining({ ignoreDuplicates: true }),
    )
  })

  it('includes vertical in upserted rows', async () => {
    process.env.NUXT_PUBLIC_VERTICAL = 'camiones'
    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ upsert: upsertSpy })

    await handler({} as any)
    const rows = upsertSpy.mock.calls[0][0] as Array<{ vertical: string }>
    expect(rows.every((r) => r.vertical === 'camiones')).toBe(true)
  })

  it('returns captured=0 with no slow queries', async () => {
    mockSupabase = makeSupabase({ rows: [] })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true, captured: 0, alerted: 0 })
  })

  it('returns ok=false when RPC fails', async () => {
    mockSupabase = makeSupabase({ rpcError: true })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: false, captured: 0 })
  })

  it('continues and returns ok=true even if insert fails', async () => {
    mockSupabase = makeSupabase({ insertError: true })
    const result = await handler({} as any)
    // captured still = 2 (RPC succeeded), ok=true (insert error is logged but not fatal)
    expect(result.captured).toBe(2)
    expect(result.ok).toBe(true)
  })

  it('alerts=0 when all queries are below 2000ms', async () => {
    const safeRows = [{ ...SLOW_ROWS[0], mean_exec_ms: 600 }]
    mockSupabase = makeSupabase({ rows: safeRows })
    const result = await handler({} as any)
    expect(result.alerted).toBe(0)
  })
})
