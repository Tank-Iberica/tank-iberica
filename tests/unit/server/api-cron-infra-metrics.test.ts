import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockSafeError, mockServiceRole, mockVerifyCronSecret } = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({ secret: 'cron-secret' }),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockVerifyCronSecret: vi.fn(),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))

// Mock infra-alert email template
vi.mock('../../utils/email-templates/infra-alert', () => ({
  infraAlertEmailHtml: vi.fn().mockReturnValue('<html>Alert</html>'),
  infraAlertSubject: vi.fn().mockReturnValue('Alert: component at 95%'),
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'cron-secret',
  resendApiKey: undefined,
  public: { cloudinaryCloudName: '' },
}))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

import handler from '../../../server/api/cron/infra-metrics.post'

function makeSupabase(rpcValue: number | null = null, rpcError: unknown = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data: null, count: null, error: null }),
    limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ data: rpcValue, error: rpcError }),
  }
}

describe('POST /api/cron/infra-metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makeSupabase())
    await handler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns metricsInserted:0 when all RPC calls return null', async () => {
    mockServiceRole.mockReturnValue(makeSupabase(null))
    const result = await handler({} as any)
    expect(result.metricsInserted).toBe(0)
    expect(result.alertsCreated).toBe(0)
    expect(result.timestamp).toBeTruthy()
  })

  it('inserts metrics when RPC returns valid data', async () => {
    let insertedRows: any = null
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: 5 }),
          insert: vi.fn().mockImplementation((rows: any) => {
            if (table === 'infra_metrics') insertedRows = rows
            return Promise.resolve({ data: null, error: null })
          }),
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: 1024 * 1024 * 100, error: null }), // 100MB
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result.metricsInserted).toBeGreaterThan(0)
    expect(insertedRows).toBeTruthy()
  })

  it('collects errors without throwing when RPC fails gracefully', async () => {
    mockServiceRole.mockReturnValue(makeSupabase(null, { message: 'RPC not found' }))
    const result = await handler({} as any)
    // Errors are returned in the result, not thrown
    expect(result).toHaveProperty('timestamp')
  })

  it('skips cloudinary when env vars not set', async () => {
    // cloudinaryCloudName is '' → should skip
    mockServiceRole.mockReturnValue(makeSupabase())
    const result = await handler({} as any)
    // No cloudinary metrics expected
    expect(result).not.toHaveProperty('cloudinary')
  })

  it('handles RPC returning a string number', async () => {
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: '50000000', error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result.metricsInserted).toBeGreaterThan(0)
  })

  it('handles RPC returning NaN gracefully', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      resendApiKey: undefined,
      public: { cloudinaryCloudName: '' },
    }))
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ data: null, error: null, count: null }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: 'not-a-number', error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    // NaN values from RPC should be skipped; stripe count is null so also skipped
    expect(result.metricsInserted).toBe(0)
  })

  it('handles RPC exception (catch block)', async () => {
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        return chain
      }),
      rpc: vi.fn().mockRejectedValue(new Error('Network error')),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    // Should still return a valid result with errors captured
    expect(result).toHaveProperty('timestamp')
    expect(result.errors).toBeDefined()
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it('collects resend metrics when resendApiKey is set and email_logs returns count', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      resendApiKey: 'resend-test-key',
      public: { cloudinaryCloudName: '' },
    }))
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        if (table === 'email_logs') {
          chain.gte = vi.fn().mockResolvedValue({ data: null, error: null, count: 42 })
        }
        if (table === 'payments') {
          chain.gte = vi.fn().mockResolvedValue({ data: null, error: null, count: 2 })
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: 100_000_000, error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result.metricsInserted).toBeGreaterThan(0)
  })

  it('generates alerts when metrics exceed warning threshold', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      resendApiKey: undefined,
      public: { cloudinaryCloudName: '' },
    }))
    // Set DB size at 90% of limit → critical level
    const dbSize = Math.floor(500 * 1024 * 1024 * 0.9)
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        // For alert cooldown check: return empty (no recent alerts)
        if (table === 'infra_alerts') {
          chain.limit = vi.fn().mockResolvedValue({ data: [], error: null })
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: dbSize, error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result.alertsCreated).toBeGreaterThan(0)
  })

  it('skips alert creation when recent alert exists (cooldown)', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      resendApiKey: undefined,
      public: { cloudinaryCloudName: '' },
    }))
    const dbSize = Math.floor(500 * 1024 * 1024 * 0.9)
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        // For alert cooldown check: return existing alert → cooldown active
        if (table === 'infra_alerts') {
          chain.limit = vi.fn().mockResolvedValue({ data: [{ id: 'existing-alert' }], error: null })
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: dbSize, error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result.alertsCreated).toBe(0)
  })

  it('reports infra_metrics insert error', async () => {
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: 1024, error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result.metricsInserted).toBe(0)
    expect(result.errors).toContain('infra_metrics insert: Insert failed')
  })

  it('collects stripe webhook failure metrics', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      resendApiKey: undefined,
      public: { cloudinaryCloudName: '' },
    }))
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        if (table === 'payments') {
          chain.gte = vi.fn().mockResolvedValue({ data: null, error: null, count: 3 })
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    expect(result).toHaveProperty('timestamp')
  })

  it('continues when alert insert fails', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      resendApiKey: undefined,
      public: { cloudinaryCloudName: '' },
    }))
    const dbSize = Math.floor(500 * 1024 * 1024 * 0.96) // emergency level
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null, count: null }),
          insert: vi.fn().mockImplementation(() => {
            if (table === 'infra_alerts') {
              return Promise.resolve({ data: null, error: { message: 'Insert error' } })
            }
            return Promise.resolve({ data: null, error: null })
          }),
        }
        return chain
      }),
      rpc: vi.fn().mockResolvedValue({ data: dbSize, error: null }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await handler({} as any)
    // Should not throw, alertsCreated remains 0 because insert failed
    expect(result.alertsCreated).toBe(0)
  })

  it('handles readBody failure gracefully', async () => {
    mockReadBody.mockRejectedValueOnce(new Error('Parse error'))
    mockServiceRole.mockReturnValue(makeSupabase())
    const result = await handler({} as any)
    expect(result).toHaveProperty('timestamp')
  })
})
