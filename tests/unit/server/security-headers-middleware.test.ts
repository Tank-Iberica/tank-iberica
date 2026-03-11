import { describe, it, expect, vi, beforeAll } from 'vitest'

let handler: Function

describe('security-headers middleware', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.resetModules()
    const mod = await import('../../../server/middleware/security-headers')
    handler = mod.default as Function
  })

  function makeEvent(path: string) {
    const captured: Record<string, string> = {}
    return {
      path,
      node: {
        res: {
          setHeader: vi.fn((name: string, value: string) => {
            captured[name] = value
          }),
        },
      },
      captured,
    }
  }

  it('skips API routes', () => {
    const event = makeEvent('/api/test')
    handler(event)
    expect(event.node.res.setHeader).not.toHaveBeenCalled()
  })

  it('skips _nuxt routes', () => {
    const event = makeEvent('/_nuxt/app.js')
    handler(event)
    expect(event.node.res.setHeader).not.toHaveBeenCalled()
  })

  it('sets Content-Security-Policy header', () => {
    const event = makeEvent('/about')
    handler(event)
    expect(event.captured['Content-Security-Policy']).toBeTruthy()
    expect(event.captured['Content-Security-Policy']).toContain("default-src 'self'")
  })

  it('CSP includes report-uri directive', () => {
    const event = makeEvent('/about')
    handler(event)
    expect(event.captured['Content-Security-Policy']).toContain('report-uri')
  })

  it('sets HSTS header with max-age', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['Strict-Transport-Security']).toContain('max-age=')
    expect(event.captured['Strict-Transport-Security']).toContain('includeSubDomains')
  })

  it('sets X-Frame-Options to DENY', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['X-Frame-Options']).toBe('DENY')
  })

  it('sets X-Content-Type-Options to nosniff', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['X-Content-Type-Options']).toBe('nosniff')
  })

  it('sets Referrer-Policy', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['Referrer-Policy']).toBeTruthy()
  })

  it('sets Permissions-Policy', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['Permissions-Policy']).toBeTruthy()
  })

  it('sets Cross-Origin-Opener-Policy to same-origin', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['Cross-Origin-Opener-Policy']).toBe('same-origin')
  })

  it('sets Cross-Origin-Resource-Policy to same-origin', () => {
    const event = makeEvent('/')
    handler(event)
    expect(event.captured['Cross-Origin-Resource-Policy']).toBe('same-origin')
  })

  it('applies headers to normal page routes', () => {
    const event = makeEvent('/vehiculo/volvo-fh-2022')
    handler(event)
    expect(event.node.res.setHeader).toHaveBeenCalled()
  })
})
