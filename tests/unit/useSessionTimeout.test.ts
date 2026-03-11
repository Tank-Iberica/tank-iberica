import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nuxt auto-imports
const mockSignOut = vi.fn().mockResolvedValue({})
const mockNavigateTo = vi.fn()
const mockUser = { value: null as any }
const mockWatch = vi.fn()

vi.stubGlobal('useSupabaseUser', () => mockUser)
vi.stubGlobal('useSupabaseClient', () => ({
  auth: { signOut: mockSignOut },
}))
vi.stubGlobal('useNuxtApp', () => ({ $t: (k: string) => k }))
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('computed', (fn: Function) => ({ value: fn() }))
vi.stubGlobal('watch', mockWatch)
vi.stubGlobal('onMounted', (fn: Function) => fn())
vi.stubGlobal('onUnmounted', vi.fn())

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser.value = null
  })

  it('exports expected API', async () => {
    mockUser.value = { id: '1', app_metadata: {}, user_metadata: { user_type: 'buyer' } }
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { isExpired, touchActivity, timeoutMs, isAdmin } = useSessionTimeout()
    expect(typeof isExpired).toBe('function')
    expect(typeof touchActivity).toBe('function')
    expect(timeoutMs).toBeDefined()
    expect(isAdmin).toBeDefined()
  })

  it('detects admin users', async () => {
    mockUser.value = { id: '1', app_metadata: { role: 'admin' }, user_metadata: {} }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { isAdmin, timeoutMs } = useSessionTimeout()
    expect(isAdmin.value).toBe(true)
    // Admin timeout = 30 minutes
    expect(timeoutMs.value).toBe(30 * 60 * 1000)
  })

  it('detects regular users', async () => {
    mockUser.value = { id: '1', app_metadata: {}, user_metadata: { user_type: 'buyer' } }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { isAdmin, timeoutMs } = useSessionTimeout()
    expect(isAdmin.value).toBe(false)
    // User timeout = 7 days
    expect(timeoutMs.value).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('touchActivity writes to localStorage', async () => {
    mockUser.value = { id: '1', app_metadata: {}, user_metadata: {} }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { touchActivity } = useSessionTimeout()
    touchActivity()
    const stored = localStorage.getItem('tracciona_last_activity')
    expect(stored).toBeTruthy()
    expect(Number(stored)).toBeGreaterThan(0)
  })

  it('isExpired returns false for fresh activity', async () => {
    mockUser.value = { id: '1', app_metadata: {}, user_metadata: {} }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { touchActivity, isExpired } = useSessionTimeout()
    touchActivity()
    // Force write by clearing throttle
    localStorage.setItem('tracciona_last_activity', String(Date.now()))
    expect(isExpired()).toBe(false)
  })

  it('isExpired returns true for old activity', async () => {
    mockUser.value = { id: '1', app_metadata: {}, user_metadata: { user_type: 'buyer' } }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { isExpired } = useSessionTimeout()
    // Set last activity to 8 days ago (user timeout = 7 days)
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
    localStorage.setItem('tracciona_last_activity', String(eightDaysAgo))
    expect(isExpired()).toBe(true)
  })

  it('isExpired returns true for admin after 31 minutes', async () => {
    mockUser.value = { id: '1', app_metadata: { role: 'admin' }, user_metadata: {} }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { isExpired } = useSessionTimeout()
    // Set last activity to 31 minutes ago
    const thirtyOneMinAgo = Date.now() - 31 * 60 * 1000
    localStorage.setItem('tracciona_last_activity', String(thirtyOneMinAgo))
    expect(isExpired()).toBe(true)
  })

  it('isExpired returns false for admin within 30 minutes', async () => {
    mockUser.value = { id: '1', app_metadata: { role: 'admin' }, user_metadata: {} }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    const { isExpired } = useSessionTimeout()
    const twentyMinAgo = Date.now() - 20 * 60 * 1000
    localStorage.setItem('tracciona_last_activity', String(twentyMinAgo))
    expect(isExpired()).toBe(false)
  })

  it('registers watch on user', async () => {
    mockUser.value = { id: '1', app_metadata: {}, user_metadata: {} }
    vi.resetModules()
    const { useSessionTimeout } = await import('../../app/composables/useSessionTimeout')
    useSessionTimeout()
    expect(mockWatch).toHaveBeenCalled()
  })
})
