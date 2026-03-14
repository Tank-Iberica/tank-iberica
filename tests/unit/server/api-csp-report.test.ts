import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody } = vi.hoisted(() => ({
  mockReadBody: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getHeader: vi.fn().mockReturnValue(undefined),
}))

// Stub global auto-imports used in the handler
vi.stubGlobal('useSupabaseRestHeaders', () => null)
vi.stubGlobal('$fetch', vi.fn())

import handler from '../../../server/api/infra/csp-report.post'

function makeEvent() {
  return {} as any
}

describe('POST /api/infra/csp-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('returns status:no_report when body has no csp-report field', async () => {
    mockReadBody.mockResolvedValue({})
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'no_report' })
  })

  it('returns status:invalid when body parse throws', async () => {
    mockReadBody.mockRejectedValue(new Error('parse error'))
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'invalid' })
  })

  it('returns status:received for a valid CSP report', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': {
        'document-uri': 'https://tracciona.com/about',
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.com/script.js',
        disposition: 'enforce',
      },
    })
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'received' })
  })

  it('filters chrome-extension blocked URIs', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': {
        'blocked-uri': 'chrome-extension://some-extension/content.js',
        'violated-directive': 'script-src',
      },
    })
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'filtered' })
  })

  it('filters moz-extension blocked URIs', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': {
        'blocked-uri': 'moz-extension://some-addon/script.js',
      },
    })
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'filtered' })
  })

  it('filters data: URIs', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': {
        'blocked-uri': 'data:text/html,<script>alert(1)</script>',
      },
    })
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'filtered' })
  })

  it('filters about: URIs', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': { 'blocked-uri': 'about:blank' },
    })
    const result = await handler(makeEvent())
    expect(result).toEqual({ status: 'filtered' })
  })
})
