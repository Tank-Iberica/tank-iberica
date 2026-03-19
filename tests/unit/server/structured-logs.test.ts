import { describe, it, expect, vi, beforeEach } from 'vitest'

import { logger, createLogger } from '../../../server/utils/logger'

describe('Structured logging enforcement', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Module-level logger', () => {
    it('logger.info outputs JSON with level "info"', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      logger.info('test message', { foo: 'bar' })
      expect(spy).toHaveBeenCalledOnce()
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.level).toBe('info')
      expect(output.msg).toBe('test message')
      expect(output.foo).toBe('bar')
    })

    it('logger.warn outputs JSON with level "warn"', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('warning message')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.level).toBe('warn')
      expect(output.msg).toBe('warning message')
    })

    it('logger.error outputs JSON with level "error"', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.error('error occurred', { code: 500 })
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.level).toBe('error')
      expect(output.msg).toBe('error occurred')
      expect(output.code).toBe(500)
    })

    it('logger works without data argument', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      logger.info('plain message')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.msg).toBe('plain message')
      expect(output.level).toBe('info')
    })
  })

  describe('Request-scoped createLogger', () => {
    const mockEvent = {
      context: { requestId: 'req-123', correlationId: 'corr-456' },
      path: '/api/test',
    } as any

    it('includes reqId in output', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const log = createLogger(mockEvent)
      log.info('request log')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.reqId).toBe('req-123')
    })

    it('includes correlationId in output', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const log = createLogger(mockEvent)
      log.info('request log')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.correlationId).toBe('corr-456')
    })

    it('includes request path in output', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = createLogger(mockEvent)
      log.warn('slow request')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.path).toBe('/api/test')
    })

    it('falls back to "no-id" when requestId is missing', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const log = createLogger({ context: {}, path: '/api/test' } as any)
      log.info('no id')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.reqId).toBe('no-id')
    })

    it('uses reqId as correlationId fallback', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const log = createLogger({ context: { requestId: 'req-789' }, path: '/test' } as any)
      log.info('msg')
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.correlationId).toBe('req-789')
    })

    it('merges custom data into output', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const log = createLogger(mockEvent)
      log.error('db failure', { table: 'vehicles', duration: 5000 })
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output.table).toBe('vehicles')
      expect(output.duration).toBe(5000)
      expect(output.level).toBe('error')
    })
  })
})
