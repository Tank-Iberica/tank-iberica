/**
 * Tests for honeypot endpoints
 * /api/admin/debug and /api/wp-login
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLogger = { warn: vi.fn() }
const mockSetResponseStatus = vi.fn()
const mockGetHeader = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getHeader: mockGetHeader,
  setResponseStatus: mockSetResponseStatus,
}))

vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

describe('honeypot endpoints', () => {
  const fakeEvent = { method: 'GET' } as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHeader.mockReturnValue(undefined)
  })

  describe('/api/admin/debug', () => {
    it('returns 404', async () => {
      const { default: handler } = await import('../../../server/api/admin/debug.get')
      const result = await (handler as Function)(fakeEvent)
      expect(mockSetResponseStatus).toHaveBeenCalledWith(fakeEvent, 404)
      expect(result).toEqual({ error: 'Not found' })
    })

    it('logs the probe attempt', async () => {
      const { default: handler } = await import('../../../server/api/admin/debug.get')
      await (handler as Function)(fakeEvent)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[honeypot]',
        expect.objectContaining({ endpoint: '/api/admin/debug' }),
      )
    })

    it('includes IP and UA in log', async () => {
      mockGetHeader.mockImplementation((_: any, header: string) => {
        if (header === 'x-forwarded-for') return '1.2.3.4'
        if (header === 'user-agent') return 'ScannerBot/1.0'
        return undefined
      })
      const { default: handler } = await import('../../../server/api/admin/debug.get')
      await (handler as Function)(fakeEvent)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[honeypot]',
        expect.objectContaining({ ip: '1.2.3.4', ua: 'ScannerBot/1.0' }),
      )
    })
  })

  describe('/api/wp-login GET', () => {
    it('returns 404', async () => {
      const { default: handler } = await import('../../../server/api/wp-login.get')
      const result = await (handler as Function)(fakeEvent)
      expect(mockSetResponseStatus).toHaveBeenCalledWith(fakeEvent, 404)
      expect(result).toEqual({ error: 'Not found' })
    })

    it('logs the probe attempt', async () => {
      const { default: handler } = await import('../../../server/api/wp-login.get')
      await (handler as Function)(fakeEvent)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[honeypot]',
        expect.objectContaining({ endpoint: '/api/wp-login' }),
      )
    })
  })

  describe('/api/wp-login POST', () => {
    it('returns 404', async () => {
      const postEvent = { method: 'POST' } as any
      const { default: handler } = await import('../../../server/api/wp-login.post')
      const result = await (handler as Function)(postEvent)
      expect(mockSetResponseStatus).toHaveBeenCalledWith(postEvent, 404)
      expect(result).toEqual({ error: 'Not found' })
    })

    it('logs with method POST', async () => {
      const postEvent = { method: 'POST' } as any
      const { default: handler } = await import('../../../server/api/wp-login.post')
      await (handler as Function)(postEvent)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[honeypot]',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
