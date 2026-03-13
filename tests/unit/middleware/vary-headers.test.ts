/**
 * Tests for vary-headers middleware
 * #145 Bloque 18
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

function makeEvent(path: string) {
  const headers: Record<string, string> = {}
  return {
    path,
    node: {
      res: {
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value
        }),
        _headers: headers,
      },
    },
  }
}

import middleware from '../../../server/middleware/vary-headers'

describe('vary-headers middleware', () => {
  it('sets Vary: Accept-Encoding, Accept-Language for HTML pages', async () => {
    const event = makeEvent('/')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })

  it('sets Vary: Accept-Encoding, Accept-Language for API routes', async () => {
    const event = makeEvent('/api/vehicles')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })

  it('sets Vary: Accept-Encoding only for /_nuxt/ static assets', async () => {
    const event = makeEvent('/_nuxt/entry.abc123.js')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding')
    expect(event.node.res.setHeader).not.toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })

  it('sets Vary: Accept-Encoding only for /_nuxt/ CSS', async () => {
    const event = makeEvent('/_nuxt/style.xyz.css')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding')
  })

  it('sets full Vary for /vehiculo/ pages', async () => {
    const event = makeEvent('/vehiculo/volvo-fh16-2022')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })

  it('sets full Vary for /admin/ pages', async () => {
    const event = makeEvent('/admin/infraestructura')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })

  it('sets full Vary for /api/search', async () => {
    const event = makeEvent('/api/search')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })

  it('handles empty path', async () => {
    const event = makeEvent('')
    await middleware(event as any)
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Vary',
      'Accept-Encoding, Accept-Language',
    )
  })
})
