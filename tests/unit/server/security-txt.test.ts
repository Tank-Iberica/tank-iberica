/**
 * Tests for /.well-known/security.txt route
 *
 * Verifies RFC 9116 compliance and content structure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      contactEmail: 'security@tracciona.es',
      siteUrl: 'https://tracciona.es',
    },
  }),
}))

describe('security.txt route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeEvent() {
    const headers: Record<string, string> = {}
    return {
      node: {
        res: {
          setHeader: (key: string, value: string) => {
            headers[key.toLowerCase()] = value
          },
        },
      },
      _headers: headers,
    } as unknown as Parameters<
      (typeof import('~/server/routes/.well-known/security.txt'))['default']
    >[0]
  }

  it('returns text/plain content type', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    await handler(event)
    expect((event as { _headers: Record<string, string> })._headers['content-type']).toContain(
      'text/plain',
    )
  })

  it('contains RFC 9116 required Contact field', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    const result = (await handler(event)) as string

    expect(result).toContain('Contact:')
    expect(result).toContain('security@tracciona.es')
  })

  it('contains RFC 9116 required Expires field in ISO format', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    const result = (await handler(event)) as string

    expect(result).toMatch(/Expires: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('contains Canonical field pointing to site URL', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    const result = (await handler(event)) as string

    expect(result).toContain('Canonical: https://tracciona.es/.well-known/security.txt')
  })

  it('contains Policy field', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    const result = (await handler(event)) as string

    expect(result).toContain('Policy:')
  })

  it('contains Preferred-Languages field', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    const result = (await handler(event)) as string

    expect(result).toContain('Preferred-Languages:')
    expect(result).toContain('es')
    expect(result).toContain('en')
  })

  it('sets cache-control header', async () => {
    const { default: handler } = await import('~/server/routes/.well-known/security.txt')
    const event = makeEvent()
    await handler(event)
    expect(
      (event as { _headers: Record<string, string> })._headers['cache-control'],
    ).toContain('max-age=')
  })
})
