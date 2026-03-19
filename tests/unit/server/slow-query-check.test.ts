import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

const mockRpc = vi.fn()
const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({ rpc: mockRpc, from: mockFrom }),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

import handler from '../../../server/api/cron/slow-query-check.post'
import { logger } from '../../../server/utils/logger'
import { verifyCronSecret } from '../../../server/utils/verifyCronSecret'

const mockEvent = { context: {} } as any

const sampleQueries = [
  {
    query_hash: 'h1',
    query_text: 'SELECT * FROM vehicles',
    calls: 100,
    mean_exec_ms: 600,
    max_exec_ms: 1200,
    total_exec_ms: 60000,
    rows_per_call: 50,
  },
  {
    query_hash: 'h2',
    query_text: 'SELECT * FROM dealers WHERE id IN (...)',
    calls: 50,
    mean_exec_ms: 2500,
    max_exec_ms: 5000,
    total_exec_ms: 125000,
    rows_per_call: 10,
  },
]

describe('EXPLAIN ANALYZE / slow query optimization (#137)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: sampleQueries, error: null })
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('verifies cron secret', async () => {
    await handler(mockEvent)
    expect(verifyCronSecret).toHaveBeenCalledWith(mockEvent)
  })

  it('calls get_slow_queries RPC with threshold', async () => {
    await handler(mockEvent)
    expect(mockRpc).toHaveBeenCalledWith('get_slow_queries', { p_threshold_ms: 500 })
  })

  it('returns ok + captured count on success', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(true)
    expect(result.captured).toBe(2)
  })

  it('returns alerted count for queries > 2000ms', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.alerted).toBe(1) // only h2 has mean_exec_ms=2500
  })

  it('upserts slow queries into slow_query_logs', async () => {
    await handler(mockEvent)
    expect(mockFrom).toHaveBeenCalledWith('slow_query_logs')
    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(upsertArg).toHaveLength(2)
    expect(upsertArg[0]).toMatchObject({
      query_hash: 'h1',
      query_text: 'SELECT * FROM vehicles',
      mean_exec_ms: 600,
    })
  })

  it('includes vertical field in upsert rows', async () => {
    await handler(mockEvent)
    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(upsertArg[0].vertical).toBeDefined()
  })

  it('uses upsert with ignoreDuplicates', async () => {
    await handler(mockEvent)
    const upsertOpts = mockUpsert.mock.calls[0][1]
    expect(upsertOpts).toMatchObject({ ignoreDuplicates: true })
  })

  it('warns on queries exceeding alert threshold', async () => {
    await handler(mockEvent)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('SLOW QUERY ALERT'),
      expect.objectContaining({ hash: 'h2', mean_exec_ms: 2500 }),
    )
  })

  it('truncates query_text to 200 chars in alert', async () => {
    const longQuery = {
      query_hash: 'h3',
      query_text: 'X'.repeat(500),
      calls: 1,
      mean_exec_ms: 3000,
      max_exec_ms: 3000,
      total_exec_ms: 3000,
      rows_per_call: 1,
    }
    mockRpc.mockResolvedValueOnce({ data: [longQuery], error: null })
    await handler(mockEvent)
    const warnCall = vi.mocked(logger.warn).mock.calls[0]
    expect((warnCall[1] as any).query.length).toBeLessThanOrEqual(200)
  })

  it('returns ok=false on RPC failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'connection error' } })
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(false)
    expect(result.captured).toBe(0)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('RPC failed'),
      expect.any(Object),
    )
  })

  it('handles insert failure gracefully (still returns ok)', async () => {
    mockUpsert.mockResolvedValueOnce({ error: { message: 'insert failed' } })
    const result = (await handler(mockEvent)) as any
    // Still returns ok because queries were captured, just not persisted
    expect(result.ok).toBe(true)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Insert failed'),
      expect.any(Object),
    )
  })

  it('returns 0 captured when no slow queries found', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(true)
    expect(result.captured).toBe(0)
    expect(result.alerted).toBe(0)
  })

  it('does not warn when no queries exceed alert threshold', async () => {
    const mildQuery = {
      query_hash: 'h1',
      query_text: 'SELECT 1',
      calls: 1,
      mean_exec_ms: 600,
      max_exec_ms: 800,
      total_exec_ms: 600,
      rows_per_call: 1,
    }
    mockRpc.mockResolvedValueOnce({ data: [mildQuery], error: null })
    await handler(mockEvent)
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('logs capture summary on success', async () => {
    await handler(mockEvent)
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Capture complete'),
      expect.objectContaining({ captured: 2, alerted: 1 }),
    )
  })
})
