/**
 * Tests for POST /api/cron/capacity-check
 * #142 Bloque 18
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyCron } = vi.hoisted(() => ({
  mockVerifyCron: vi.fn(),
}))

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getHeader: vi.fn(),
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

const DB_SIZE = { size_bytes: 4_294_967_296 } // 4 GB
const CONN_OK = { count: 20 }     // 20/60 = 33%
const CONN_WARN = { count: 45 }   // 45/60 = 75%
const CONN_CRIT = { count: 55 }   // 55/60 = 91.7%

function makeSupabase(opts: {
  sizeBytes?: number | null
  sizeError?: boolean
  connCount?: number | null
  connError?: boolean
  insertError?: boolean
} = {}) {
  const { sizeBytes = 4_294_967_296, sizeError = false, connCount = 20, connError = false, insertError = false } = opts

  return {
    rpc: vi.fn().mockImplementation((fn: string) => {
      if (fn === 'get_db_size_bytes') {
        return sizeError
          ? Promise.resolve({ data: null, error: { message: 'pg error' } })
          : Promise.resolve({ data: { size_bytes: sizeBytes }, error: null })
      }
      if (fn === 'get_active_connections') {
        return connError
          ? Promise.resolve({ data: null, error: { message: 'pg error' } })
          : Promise.resolve({ data: { count: connCount }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: insertError ? { message: 'db error' } : null }),
    }),
  }
}

import handler from '../../../server/api/cron/capacity-check.post'

describe('POST /api/cron/capacity-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_STORAGE_LIMIT_GB = '8'
    process.env.SUPABASE_MAX_CONNECTIONS = '60'
    process.env.NUXT_PUBLIC_VERTICAL = 'tracciona'
    mockSupabase = makeSupabase()
  })

  it('returns ok=true with no alerts when usage <70%', async () => {
    mockSupabase = makeSupabase({ sizeBytes: 1_073_741_824, connCount: 20 }) // 12.5% storage, 33% conn
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true, alertsInserted: 0 })
    expect(result.skipped).toHaveLength(2)
  })

  it('inserts warning alert when storage >70%', async () => {
    // 8GB limit, 6GB used = 75%
    mockSupabase = makeSupabase({ sizeBytes: 6_442_450_944, connCount: 20 })
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertSpy })

    const result = await handler({} as any)
    expect(result.alertsInserted).toBe(1)
    expect(result.alerts[0]).toContain('storage')
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'storage', is_critical: false }),
    )
  })

  it('inserts critical alert when connections >90%', async () => {
    // 55/60 = 91.7%
    mockSupabase = makeSupabase({ sizeBytes: 1_073_741_824, connCount: 55 })
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertSpy })

    const result = await handler({} as any)
    expect(result.alertsInserted).toBe(1)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'connections', is_critical: true }),
    )
  })

  it('uses env vars for limits', async () => {
    process.env.SUPABASE_STORAGE_LIMIT_GB = '16'
    process.env.SUPABASE_MAX_CONNECTIONS = '100'
    // 6GB / 16GB = 37.5% — under threshold
    mockSupabase = makeSupabase({ sizeBytes: 6_442_450_944, connCount: 30 })
    const result = await handler({} as any)
    expect(result.alertsInserted).toBe(0)
  })

  it('skips metric gracefully when RPC fails', async () => {
    mockSupabase = makeSupabase({ sizeError: true, connCount: 20 })
    const result = await handler({} as any)
    // storage skipped due to error, connections OK (<70%)
    expect(result.checked).toBe(1) // only connections checked successfully
    expect(result.alertsInserted).toBe(0)
  })

  it('continues if both RPCs fail', async () => {
    mockSupabase = makeSupabase({ sizeError: true, connError: true })
    const result = await handler({} as any)
    expect(result.ok).toBe(true)
    expect(result.checked).toBe(0)
    expect(result.alertsInserted).toBe(0)
  })

  it('logs error if insert fails but still returns ok', async () => {
    mockSupabase = makeSupabase({ sizeBytes: 6_442_450_944, connCount: 20, insertError: true })
    const result = await handler({} as any)
    // insert failed, so alertsInserted=0 (but ok still true)
    expect(result.ok).toBe(true)
    expect(result.alertsInserted).toBe(0)
  })

  it('includes vertical in inserted alert', async () => {
    process.env.NUXT_PUBLIC_VERTICAL = 'maquinas'
    mockSupabase = makeSupabase({ sizeBytes: 6_442_450_944, connCount: 20 })
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertSpy })

    await handler({} as any)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ vertical: 'maquinas' }),
    )
  })

  it('includes details with currentGb in storage alert', async () => {
    // 6GB / 8GB = 75%
    mockSupabase = makeSupabase({ sizeBytes: 6_442_450_944, connCount: 20 })
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertSpy })

    await handler({} as any)
    const call = insertSpy.mock.calls[0][0]
    expect(call.details.currentGb).toBeCloseTo(6, 0)
    expect(call.details.pct).toBeGreaterThan(70)
  })

  it('includes currentCount in connections alert', async () => {
    mockSupabase = makeSupabase({ sizeBytes: 1_073_741_824, connCount: 45 })
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertSpy })

    await handler({} as any)
    const call = insertSpy.mock.calls[0][0]
    expect(call.details.currentCount).toBe(45)
    expect(call.details.limitCount).toBe(60)
  })

  it('uses threshold=70 in inserted alert', async () => {
    mockSupabase = makeSupabase({ sizeBytes: 6_442_450_944, connCount: 20 })
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertSpy })

    await handler({} as any)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 70 }),
    )
  })
})
