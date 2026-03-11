import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

let handler: Function

describe('auth middleware', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
    vi.resetModules()
    const mod = await import('../../app/middleware/auth')
    handler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to login', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    }))
    await handler({ path: '/dashboard' })
    expect(navigateSpy).toHaveBeenCalledWith('/?auth=login')
  })

  it('redirects when session has no user id', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: null } } }),
      },
    }))
    await handler({ path: '/profile' })
    expect(navigateSpy).toHaveBeenCalledWith('/?auth=login')
  })

  it('allows authenticated users through', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'u1', user_metadata: {} } } },
        }),
      },
    }))
    await handler({ path: '/profile' })
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('redirects users with force_password_reset to new-password page', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'u1', user_metadata: { force_password_reset: true } },
            },
          },
        }),
      },
    }))
    await handler({ path: '/dashboard' })
    expect(navigateSpy).toHaveBeenCalledWith('/auth/nueva-password')
  })

  it('does not redirect on the reset page itself even with force_password_reset', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'u1', user_metadata: { force_password_reset: true } },
            },
          },
        }),
      },
    }))
    await handler({ path: '/auth/nueva-password' })
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('allows normal authenticated user on any route', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'u1', user_metadata: { force_password_reset: false } },
            },
          },
        }),
      },
    }))
    await handler({ path: '/dashboard/vehiculos' })
    expect(navigateSpy).not.toHaveBeenCalled()
  })
})
