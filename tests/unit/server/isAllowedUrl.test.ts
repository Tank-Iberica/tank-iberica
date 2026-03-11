import { describe, it, expect, afterEach } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isAllowedUrl', () => {
  async function load() {
    vi.resetModules()
    const { isAllowedUrl } = await import('../../../server/utils/isAllowedUrl')
    return isAllowedUrl
  }

  it('allows tracciona.com', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('https://tracciona.com/dashboard')).toBe(true)
  })

  it('allows www.tracciona.com', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('https://www.tracciona.com/success')).toBe(true)
  })

  it('allows localhost:3000 in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('http://localhost:3000/callback')).toBe(true)
  })

  it('rejects localhost:3000 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('http://localhost:3000/callback')).toBe(false)
  })

  it('rejects external domains', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('https://evil.com/redirect')).toBe(false)
  })

  it('rejects invalid URLs', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('not-a-url')).toBe(false)
  })

  it('rejects javascript: scheme', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const isAllowedUrl = await load()
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false)
  })
})
