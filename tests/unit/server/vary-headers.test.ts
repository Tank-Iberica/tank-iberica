import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for the Vary headers middleware.
 * Ensures correct Vary headers are set for different path types.
 */

// Mock h3 defineEventHandler to capture the handler function
vi.mock('h3', () => ({
  defineEventHandler: (handler: Function) => handler,
}))

describe('vary-headers middleware', () => {
  let handler: Function
  let mockSetHeader: ReturnType<typeof vi.fn>
  let mockEvent: { path: string; node: { res: { setHeader: Function } } }

  beforeEach(async () => {
    mockSetHeader = vi.fn()
    mockEvent = {
      path: '/',
      node: { res: { setHeader: mockSetHeader } },
    }

    // Import fresh each time
    vi.resetModules()
    const mod = await import('../../../server/middleware/vary-headers')
    handler = mod.default
  })

  it('sets Vary: Accept-Encoding for static _nuxt/ assets', () => {
    mockEvent.path = '/_nuxt/chunk-abc123.js'
    handler(mockEvent)
    expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding')
  })

  it('does not include Accept-Language for _nuxt/ paths', () => {
    mockEvent.path = '/_nuxt/style.css'
    handler(mockEvent)
    expect(mockSetHeader).toHaveBeenCalledTimes(1)
    const varyValue = mockSetHeader.mock.calls[0][1]
    expect(varyValue).not.toContain('Accept-Language')
  })

  it('sets Vary: Accept-Encoding, Accept-Language for HTML pages', () => {
    mockEvent.path = '/catalogo/camiones'
    handler(mockEvent)
    expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding, Accept-Language')
  })

  it('sets Vary: Accept-Encoding, Accept-Language for API endpoints', () => {
    mockEvent.path = '/api/vehicles'
    handler(mockEvent)
    expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding, Accept-Language')
  })

  it('sets Vary for root path', () => {
    mockEvent.path = '/'
    handler(mockEvent)
    expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding, Accept-Language')
  })

  it('handles empty path', () => {
    mockEvent.path = ''
    handler(mockEvent)
    expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding, Accept-Language')
  })
})
