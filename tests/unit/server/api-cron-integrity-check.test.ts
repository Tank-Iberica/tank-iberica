/**
 * Tests for POST /api/cron/integrity-check
 * #436 — Cross-table referential integrity check
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyCron, mockLogger } = vi.hoisted(() => ({
  mockVerifyCron: vi.fn(),
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: (ev: unknown) => (ev as any).__supabase,
}))
vi.mock('~~/server/utils/verifyCronSecret', () => ({
  verifyCronSecret: (...a: unknown[]) => mockVerifyCron(...a),
}))
vi.mock('~~/server/utils/logger', () => ({ logger: mockLogger }))

import handler from '../../../server/api/cron/integrity-check.post'

function makeSupabase(opts: {
  orphanVehicles?: number
  orphanLeads?: number
  orphanImages?: number
  incompletePublished?: number
  rpcError?: boolean
  selectError?: boolean
} = {}) {
  const {
    orphanVehicles = 0,
    orphanLeads = 0,
    orphanImages = 0,
    incompletePublished = 0,
    rpcError = false,
    selectError = false,
  } = opts

  const insertSpy = vi.fn().mockResolvedValue({ error: null })

  return {
    insertSpy,
    supabase: {
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (rpcError) return Promise.resolve({ data: null, error: { message: 'rpc error' } })
        if (fn === 'count_orphan_vehicles') return Promise.resolve({ data: orphanVehicles, error: null })
        if (fn === 'count_orphan_leads') return Promise.resolve({ data: orphanLeads, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'vehicle_images') {
          return {
            select: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue(
                selectError
                  ? { count: null, error: { message: 'select error' } }
                  : { count: orphanImages, error: null },
              ),
            }),
          }
        }
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue(
                  selectError
                    ? { count: null, error: { message: 'select error' } }
                    : { count: incompletePublished, error: null },
                ),
              }),
            }),
          }
        }
        if (table === 'infra_alerts') {
          return { insert: insertSpy }
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }),
    },
  }
}

describe('POST /api/cron/integrity-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NUXT_PUBLIC_VERTICAL = 'tracciona'
  })

  it('returns zero checks when all counts are 0', async () => {
    const { supabase } = makeSupabase()
    const result = await handler({ __supabase: supabase } as any)
    expect(result.checks).toHaveLength(4)
    expect(result.alertsCreated).toBe(0)
    expect(result.checks.every((c: any) => c.count === 0)).toBe(true)
  })

  it('creates alert when orphan vehicles found', async () => {
    const { supabase, insertSpy } = makeSupabase({ orphanVehicles: 5 })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.alertsCreated).toBe(1)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const alerts = insertSpy.mock.calls[0][0]
    expect(alerts[0].metric).toBe('integrity_vehicles_no_dealer')
    expect(alerts[0].current_value).toBe(5)
    expect(alerts[0].is_critical).toBe(false)
  })

  it('marks as critical when count > 100', async () => {
    const { supabase, insertSpy } = makeSupabase({ orphanLeads: 150 })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.alertsCreated).toBe(1)
    const alerts = insertSpy.mock.calls[0][0]
    expect(alerts[0].is_critical).toBe(true)
  })

  it('creates multiple alerts when multiple issues found', async () => {
    const { supabase, insertSpy } = makeSupabase({
      orphanVehicles: 3,
      orphanLeads: 7,
      orphanImages: 2,
      incompletePublished: 1,
    })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.alertsCreated).toBe(4)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(insertSpy.mock.calls[0][0]).toHaveLength(4)
  })

  it('skips RPC results on error', async () => {
    const { supabase } = makeSupabase({ rpcError: true })
    const result = await handler({ __supabase: supabase } as any)
    // Only select-based checks (images + published_incomplete) succeed
    expect(result.checks).toHaveLength(2)
    expect(result.alertsCreated).toBe(0)
  })

  it('skips select results on error', async () => {
    const { supabase } = makeSupabase({ selectError: true })
    const result = await handler({ __supabase: supabase } as any)
    // Only RPC-based checks (vehicles + leads) succeed
    expect(result.checks).toHaveLength(2)
    expect(result.alertsCreated).toBe(0)
  })

  it('includes vertical in alerts', async () => {
    process.env.NUXT_PUBLIC_VERTICAL = 'horecaria'
    const { supabase, insertSpy } = makeSupabase({ orphanVehicles: 1 })
    await handler({ __supabase: supabase } as any)
    expect(insertSpy.mock.calls[0][0][0].vertical).toBe('horecaria')
  })

  it('logs info when no issues found', async () => {
    const { supabase } = makeSupabase()
    await handler({ __supabase: supabase } as any)
    expect(mockLogger.info).toHaveBeenCalledWith('[integrity-check] All integrity checks passed')
  })

  it('logs warning when issues found', async () => {
    const { supabase } = makeSupabase({ orphanImages: 10 })
    await handler({ __supabase: supabase } as any)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[integrity-check] Issues found',
      expect.objectContaining({ results: expect.any(Array) }),
    )
  })

  it('returns timestamp', async () => {
    const { supabase } = makeSupabase()
    const result = await handler({ __supabase: supabase } as any)
    expect(result.timestamp).toBeTruthy()
    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0)
  })
})
