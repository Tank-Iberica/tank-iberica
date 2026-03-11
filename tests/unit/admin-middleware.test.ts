import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockCheckAdmin = vi.fn()
let handler: Function

describe('admin middleware', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
    vi.stubGlobal('useAdminRole', () => ({ checkAdmin: mockCheckAdmin }))
    vi.resetModules()
    const mod = await import('../../app/middleware/admin')
    handler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns without redirect when user is not authenticated', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    }))
    await handler()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('redirects non-admin authenticated users to home', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
        }),
      },
    }))
    mockCheckAdmin.mockResolvedValue(false)
    await handler()
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })

  it('allows admin users through without redirect', async () => {
    const navigateSpy = vi.fn()
    vi.stubGlobal('navigateTo', navigateSpy)
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'admin-123' } } },
        }),
      },
    }))
    mockCheckAdmin.mockResolvedValue(true)
    await handler()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('calls checkAdmin with the authenticated user id', async () => {
    vi.stubGlobal('navigateTo', vi.fn())
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'specific-user-id' } } },
        }),
      },
    }))
    mockCheckAdmin.mockResolvedValue(true)
    await handler()
    expect(mockCheckAdmin).toHaveBeenCalledWith('specific-user-id')
  })
})
