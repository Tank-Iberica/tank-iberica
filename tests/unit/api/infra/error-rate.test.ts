import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('GET /api/infra/error-rate', () => {
  let handler: Function
  let mockEvent: any
  let mockDb: any

  beforeEach(async () => {
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test-secret' }))
    vi.stubGlobal('getHeader', vi.fn())
    vi.stubGlobal('useSupabaseServer', vi.fn())
    vi.stubGlobal('createError', (opts: any) => new Error(opts.statusMessage))
    vi.stubGlobal('logger', { warn: vi.fn(), error: vi.fn() })

    mockDb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    mockEvent = {
      node: { req: { headers: {} } },
    }

    vi.resetModules()
    const mod = await import('../../../../server/api/infra/error-rate.get')
    handler = mod.default
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if no auth header', async () => {
    const getHeaderMock = vi.fn().mockReturnValue(undefined)
    vi.stubGlobal('getHeader', getHeaderMock)

    await expect(handler(mockEvent)).rejects.toThrow('Unauthorized')
  })

  it('should return 401 if wrong CRON_SECRET', async () => {
    const getHeaderMock = vi.fn().mockReturnValue('Bearer wrong-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    await expect(handler(mockEvent)).rejects.toThrow('Unauthorized')
  })

  it('should return error rate 0 if no errors', async () => {
    const getHeaderMock = vi.fn().mockReturnValue('Bearer test-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    mockDb.order.mockResolvedValue({ data: [], error: null })
    const useSupaMock = vi.fn().mockReturnValue(mockDb)
    vi.stubGlobal('useSupabaseServer', useSupaMock)

    const result = await handler(mockEvent)

    expect(result).toMatchObject({
      errorRate: 0,
      errorCount: 0,
      period: '24h',
      threshold: 0.5,
      isAlertworthy: false,
    })
  })

  it('should calculate error rate correctly', async () => {
    const getHeaderMock = vi.fn().mockReturnValue('Bearer test-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    const mockErrors = Array(5).fill({ id: 1, status_code: 500 })
    mockDb.order.mockResolvedValue({ data: mockErrors, error: null })
    const useSupaMock = vi.fn().mockReturnValue(mockDb)
    vi.stubGlobal('useSupabaseServer', useSupaMock)

    const result = await handler(mockEvent)

    // 5 errors out of ~104 total (5 + 99 estimate) = ~4.8%
    expect(result.errorCount).toBe(5)
    expect(result.errorRate).toBeGreaterThan(0)
    expect(result.threshold).toBe(0.5)
  })

  it('should mark as alertworthy if error rate > threshold', async () => {
    const getHeaderMock = vi.fn().mockReturnValue('Bearer test-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    // 50 errors out of 100 = 50%
    const mockErrors = Array(50).fill({ id: 1, status_code: 500 })
    mockDb.order.mockResolvedValue({ data: mockErrors, error: null })
    const useSupaMock = vi.fn().mockReturnValue(mockDb)
    vi.stubGlobal('useSupabaseServer', useSupaMock)

    const result = await handler(mockEvent)

    expect(result.isAlertworthy).toBe(true)
    expect(result.errorRate).toBeGreaterThan(0.5)
  })

  it('should log warning if error rate is high', async () => {
    const loggerMock = { warn: vi.fn(), error: vi.fn() }
    vi.stubGlobal('logger', loggerMock)

    const getHeaderMock = vi.fn().mockReturnValue('Bearer test-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    const mockErrors = Array(50).fill({ id: 1, status_code: 500 })
    mockDb.order.mockResolvedValue({ data: mockErrors, error: null })
    const useSupaMock = vi.fn().mockReturnValue(mockDb)
    vi.stubGlobal('useSupabaseServer', useSupaMock)

    await handler(mockEvent)

    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Error rate ALERT'),
      expect.any(Object)
    )
  })

  it('should handle DB query errors gracefully', async () => {
    const loggerMock = { warn: vi.fn(), error: vi.fn() }
    vi.stubGlobal('logger', loggerMock)

    const getHeaderMock = vi.fn().mockReturnValue('Bearer test-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    const dbError = { code: 'ERROR_CODE', message: 'DB error' }
    mockDb.order.mockResolvedValue({ data: [], error: dbError })
    const useSupaMock = vi.fn().mockReturnValue(mockDb)
    vi.stubGlobal('useSupabaseServer', useSupaMock)

    const result = await handler(mockEvent)

    // Should still return a valid response with 0 rate
    expect(result.errorRate).toBe(0)
    expect(loggerMock.error).toHaveBeenCalled()
  })

  it('should include timestamp in response', async () => {
    const getHeaderMock = vi.fn().mockReturnValue('Bearer test-secret')
    vi.stubGlobal('getHeader', getHeaderMock)

    mockDb.order.mockResolvedValue({ data: [], error: null })
    const useSupaMock = vi.fn().mockReturnValue(mockDb)
    vi.stubGlobal('useSupabaseServer', useSupaMock)

    const result = await handler(mockEvent)

    expect(result).toHaveProperty('timestamp')
    expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
  })
})
