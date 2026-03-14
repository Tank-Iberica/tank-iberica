import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Server-Timing Middleware', () => {
  let handler: Function
  let mockEvent: any
  let setHeaderSpy: any
  let finishCallback: Function | null

  beforeEach(async () => {
    finishCallback = null

    // Stub Nuxt event handler
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.stubGlobal('setHeader', vi.fn())

    // Source uses event.node.res.on('finish', closeHandler)
    mockEvent = {
      context: {
        _timings: {
          db: 0,
          cache: 0,
          process: 0,
          external: 0,
        },
      },
      node: {
        res: {
          on: vi.fn((event: string, cb: Function) => {
            if (event === 'finish') finishCallback = cb
          }),
        },
      },
    }

    setHeaderSpy = vi.mocked(global.setHeader as any)

    vi.resetModules()
    const mod = await import('../../../server/middleware/server-timing')
    handler = mod.default
  })

  /** Call handler then trigger the finish callback */
  function callHandler(ev: any = mockEvent) {
    handler(ev)
    if (finishCallback) finishCallback()
  }

  it('should initialize with event context', () => {
    handler(mockEvent)

    expect(mockEvent.context._timings).toBeDefined()
    expect(mockEvent.context._timings).toHaveProperty('db')
    expect(mockEvent.context._timings).toHaveProperty('cache')
  })

  it('should set Server-Timing header with cache timing', () => {
    // handler() resets _timings to zeros, so set values AFTER handler but BEFORE finish
    handler(mockEvent)
    mockEvent.context._timings = { cache: 25, db: 0, process: 0, external: 0 }
    if (finishCallback) finishCallback()

    const calls = setHeaderSpy.mock.calls
    const timingCall = calls.find((call: any[]) => call[1] === 'Server-Timing')

    expect(timingCall).toBeDefined()
    expect(timingCall[2]).toContain('cache;dur=25')
  })

  it('should set Server-Timing header with db timing', () => {
    handler(mockEvent)
    mockEvent.context._timings = { db: 45, cache: 0, process: 0, external: 0 }
    if (finishCallback) finishCallback()

    const calls = setHeaderSpy.mock.calls
    const timingCall = calls.find((call: any[]) => call[1] === 'Server-Timing')

    expect(timingCall).toBeDefined()
    expect(timingCall[2]).toContain('db;dur=45')
  })

  it('should include total timing', () => {
    handler(mockEvent)
    mockEvent.context._timings = { cache: 10, db: 45, process: 0, external: 0 }
    if (finishCallback) finishCallback()

    const calls = setHeaderSpy.mock.calls
    const timingCall = calls.find((call: any[]) => call[1] === 'Server-Timing')

    expect(timingCall).toBeDefined()
    expect(timingCall[2]).toContain('total;dur=')
  })

  it('should skip zero timings', () => {
    handler(mockEvent)
    mockEvent.context._timings = { cache: 0, db: 50, process: 0, external: 0 }
    if (finishCallback) finishCallback()

    const calls = setHeaderSpy.mock.calls
    const timingCall = calls.find((call: any[]) => call[1] === 'Server-Timing')

    expect(timingCall[2]).not.toContain('cache;')
  })

  it('should set X-Response-Time header', () => {
    callHandler()

    const calls = setHeaderSpy.mock.calls
    const responseTimeCall = calls.find((call: any[]) => call[1] === 'X-Response-Time')

    expect(responseTimeCall).toBeDefined()
    expect(responseTimeCall[2]).toMatch(/\d+ms/)
  })

  it('should combine multiple timings', () => {
    handler(mockEvent)
    mockEvent.context._timings = { cache: 10, db: 45, process: 5, external: 20 }
    if (finishCallback) finishCallback()

    const calls = setHeaderSpy.mock.calls
    const timingCall = calls.find((call: any[]) => call[1] === 'Server-Timing')

    expect(timingCall[2]).toContain('cache;dur=10')
    expect(timingCall[2]).toContain('db;dur=45')
    expect(timingCall[2]).toContain('external;dur=20')
  })

  it('should handle missing timings gracefully', () => {
    mockEvent.context._timings = undefined

    // Should not throw
    expect(() => callHandler()).not.toThrow()
  })
})
