import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

let handler: Function

function makeSupabaseClient(sessionUserId: string | null, userData: { user_type: string; role: string } | null) {
  const single = vi.fn().mockResolvedValue({ data: userData })
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: sessionUserId ? { user: { id: sessionUserId } } : null,
        },
      }),
    },
    from: vi.fn().mockReturnValue({ select }),
  }
}

describe('dealer middleware', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
    vi.resetModules()
    const mod = await import('../../app/middleware/dealer')
    handler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to login', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => makeSupabaseClient(null, null))
    await handler()
    expect(navigateSpy).toHaveBeenCalledWith('/?auth=login')
  })

  it('allows dealer users through', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () =>
      makeSupabaseClient('dealer-1', { user_type: 'dealer', role: 'user' }),
    )
    await handler()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('allows admin users through', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () =>
      makeSupabaseClient('admin-1', { user_type: 'other', role: 'admin' }),
    )
    await handler()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('redirects non-dealer non-admin users to home', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () =>
      makeSupabaseClient('buyer-1', { user_type: 'buyer', role: 'user' }),
    )
    await handler()
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })

  it('redirects when user record not found in DB', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => makeSupabaseClient('u1', null))
    await handler()
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })

  it('queries users table with authenticated user id', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    const client = makeSupabaseClient('specific-uid', { user_type: 'dealer', role: 'user' })
    vi.stubGlobal('useSupabaseClient', () => client)
    await handler()
    expect(client.from).toHaveBeenCalledWith('users')
  })
})
