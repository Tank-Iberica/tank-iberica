import { describe, it, expect, vi, beforeEach } from 'vitest'
import { acquireDbCronLock } from '../../../server/utils/cronLock'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('../../../server/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

function makeSupabase(insertError: { code?: string; message?: string } | null = null) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: insertError }),
    }),
  } as unknown as SupabaseClient
}

describe('acquireDbCronLock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when insert succeeds (lock acquired)', async () => {
    const supabase = makeSupabase(null)
    const result = await acquireDbCronLock(supabase, 'test-cron')
    expect(result).toBe(true)
  })

  it('returns false on unique violation (23505) — lock already held', async () => {
    const supabase = makeSupabase({ code: '23505', message: 'duplicate key' })
    const result = await acquireDbCronLock(supabase, 'test-cron')
    expect(result).toBe(false)
  })

  it('returns true on non-unique DB error — proceeds rather than blocking cron', async () => {
    const supabase = makeSupabase({ code: '42P01', message: 'table not found' })
    const result = await acquireDbCronLock(supabase, 'test-cron')
    expect(result).toBe(true)
  })

  it('inserts into idempotency_keys with correct fields', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    } as unknown as SupabaseClient

    await acquireDbCronLock(supabase, 'my-cron', 3600_000)

    expect(supabase.from).toHaveBeenCalledWith('idempotency_keys')
    const [insertArg] = insertMock.mock.calls[0] as [Record<string, unknown>]
    expect(insertArg.key).toMatch(/^cron:my-cron:\d+$/)
    expect(insertArg.endpoint).toBe('cron:my-cron')
    expect((insertArg.response as Record<string, unknown>).status).toBe('running')
    expect(typeof insertArg.expires_at).toBe('string')
  })

  it('uses custom windowMs to compute the key', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    } as unknown as SupabaseClient

    const windowMs = 2 * 60 * 60 * 1000 // 2 hours
    await acquireDbCronLock(supabase, 'cron-a', windowMs)

    const [insertArg] = insertMock.mock.calls[0] as [Record<string, unknown>]
    const expectedWindowKey = Math.floor(Date.now() / windowMs).toString()
    expect(insertArg.key).toBe(`cron:cron-a:${expectedWindowKey}`)
  })

  it('logs a warning when lock is already held', async () => {
    const { logger } = await import('../../../server/utils/logger')
    const supabase = makeSupabase({ code: '23505', message: 'dup' })
    await acquireDbCronLock(supabase, 'dup-cron')
    expect(logger.warn).toHaveBeenCalled()
  })

  it('logs a warning but proceeds on non-unique DB error', async () => {
    const { logger } = await import('../../../server/utils/logger')
    const supabase = makeSupabase({ code: '08006', message: 'connection failure' })
    const result = await acquireDbCronLock(supabase, 'fragile-cron')
    expect(result).toBe(true)
    expect(logger.warn).toHaveBeenCalled()
  })
})
