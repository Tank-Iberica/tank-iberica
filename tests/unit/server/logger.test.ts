import { describe, it, expect, vi, afterEach } from 'vitest'
import { createLogger, logger } from '../../../server/utils/logger'
import type { H3Event } from 'h3'

function makeEvent(reqId?: string, path?: string): H3Event {
  return { context: reqId ? { requestId: reqId } : {}, path } as unknown as H3Event
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('logger (module-level singleton)', () => {
  it('exports info, warn, error methods', () => {
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('info logs structured JSON without reqId/path', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('singleton info')
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.level).toBe('info')
    expect(logged.msg).toBe('singleton info')
    expect(logged.reqId).toBeUndefined()
    expect(logged.path).toBeUndefined()
  })

  it('warn logs structured JSON with extra data', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('[featureFlags] No credentials', { flag: 'auctions' })
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.level).toBe('warn')
    expect(logged.msg).toBe('[featureFlags] No credentials')
    expect(logged.flag).toBe('auctions')
  })

  it('error logs structured JSON with extra data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('[notifications] Admin notification failed', { error: 'timeout' })
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.level).toBe('error')
    expect(logged.msg).toBe('[notifications] Admin notification failed')
    expect(logged.error).toBe('timeout')
  })
})

describe('createLogger', () => {
  it('returns an object with info, warn, and error methods', () => {
    const logger = createLogger(makeEvent('r1', '/test'))
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('info logs JSON with level=info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createLogger(makeEvent('req-1', '/api/test'))
    logger.info('Test message')
    expect(spy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.level).toBe('info')
    expect(logged.msg).toBe('Test message')
    expect(logged.reqId).toBe('req-1')
    expect(logged.path).toBe('/api/test')
  })

  it('warn logs JSON with level=warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = createLogger(makeEvent('req-2', '/api'))
    logger.warn('Warning message', { extra: 'data' })
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.level).toBe('warn')
    expect(logged.msg).toBe('Warning message')
    expect(logged.extra).toBe('data')
  })

  it('error logs JSON with level=error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createLogger(makeEvent('req-3', '/err'))
    logger.error('Error occurred')
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.level).toBe('error')
    expect(logged.msg).toBe('Error occurred')
  })

  it('uses "no-id" as reqId when requestId is missing from context', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createLogger(makeEvent(undefined, '/path'))
    logger.info('msg')
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.reqId).toBe('no-id')
  })

  it('uses "unknown" as path when event has no path', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createLogger(makeEvent('r1', undefined))
    logger.info('msg')
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.path).toBe('unknown')
  })

  it('includes extra data fields in log output', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createLogger(makeEvent('r1', '/'))
    logger.info('msg', { userId: 'u-1', action: 'login' })
    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.userId).toBe('u-1')
    expect(logged.action).toBe('login')
  })

  it('each call is independent (no cross-contamination)', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = createLogger(makeEvent('r1', '/path'))
    logger.info('info msg')
    logger.warn('warn msg')
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
