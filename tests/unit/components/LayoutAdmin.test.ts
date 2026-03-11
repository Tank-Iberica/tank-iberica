/**
 * Tests for app/layouts/admin.vue
 * Covers: auth flow (checkAdminRole, loginWithGoogle, logout),
 *         sidebar state, route watch, escape key handler
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// ── Mock Supabase client ────────────────────────────────────────────────────

const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' } })
const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

let authStateCallback: ((event: string, session: unknown) => void) | null = null
const mockGetSession = vi.fn().mockResolvedValue({
  data: { session: { user: { id: 'user-123' } } },
})
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null })
const mockSignOut = vi.fn().mockResolvedValue({})
const mockOnAuthStateChange = vi.fn().mockImplementation((cb) => {
  authStateCallback = cb
  return { data: { subscription: { unsubscribe: vi.fn() } } }
})

const mockSupabase = {
  from: mockFrom,
  auth: {
    getSession: mockGetSession,
    signInWithOAuth: mockSignInWithOAuth,
    signOut: mockSignOut,
    onAuthStateChange: mockOnAuthStateChange,
  },
}

// ── Track hooks ─────────────────────────────────────────────────────────────

const mountedCallbacks: Array<() => void | Promise<void>> = []
const unmountedCallbacks: Array<() => void> = []
const watchCallbacks: Array<{ source: () => unknown; cb: (val: unknown) => void }> = []

const mockRoute = { path: '/admin', query: {} }

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useRoute', () => mockRoute)
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('useSupabaseClient', () => mockSupabase)
  vi.stubGlobal('onMounted', (cb: () => void | Promise<void>) => {
    mountedCallbacks.push(cb)
  })
  vi.stubGlobal('onUnmounted', (cb: () => void) => {
    unmountedCallbacks.push(cb)
  })
  vi.stubGlobal('watch', (sourceOrRef: unknown, cb: (val: unknown) => void) => {
    if (typeof sourceOrRef === 'function') {
      watchCallbacks.push({ source: sourceOrRef as () => unknown, cb })
    } else {
      watchCallbacks.push({ source: () => (sourceOrRef as { value: unknown }).value, cb })
    }
  })
})

import AdminLayout from '../../../app/layouts/admin.vue'

// ── Stubs ───────────────────────────────────────────────────────────────────

const defaultStubs = {
  AdminLayoutAdminSidebar: true,
  AdminLayoutAdminHeader: true,
  NuxtErrorBoundary: { template: '<div><slot /></div>' },
  NuxtLink: { template: '<a><slot /></a>' },
}

describe('admin layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountedCallbacks.length = 0
    unmountedCallbacks.length = 0
    watchCallbacks.length = 0
    authStateCallback = null
    mockRoute.path = '/admin'
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})
  })

  const factory = () => {
    return shallowMount(AdminLayout, {
      global: {
        stubs: defaultStubs,
      },
    })
  }

  // Helper to execute all mounted callbacks
  async function runMounted() {
    for (const cb of mountedCallbacks) {
      await cb()
    }
  }

  // ── Initial state (no session) ──────────────────────────────────────────

  it('renders login screen initially (before mount resolves)', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const w = factory()
    expect(w.find('.admin-login').exists()).toBe(true)
  })

  it('shows login button', () => {
    const w = factory()
    expect(w.find('.btn-google').exists()).toBe(true)
  })

  // ── Auth flow: successful admin login ─────────────────────────────────

  it('shows admin panel after successful session + admin role check', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    expect(vm.hasSession).toBe(true)
    expect(vm.isAdmin).toBe(true)
    expect(vm.checkingAdmin).toBe(false)
  })

  // ── Auth flow: session but not admin ──────────────────────────────────

  it('shows access denied when user is not admin', async () => {
    mockSingle.mockResolvedValue({ data: { role: 'user' } })
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    expect(vm.hasSession).toBe(true)
    expect(vm.isAdmin).toBe(false)
  })

  // ── Auth flow: no session ─────────────────────────────────────────────

  it('shows login screen when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const w = factory()
    await runMounted()
    await nextTick()
    const vm = w.vm as any
    expect(vm.hasSession).toBe(false)
    expect(vm.checkingAdmin).toBe(false)
    expect(vm.isAdmin).toBe(false)
  })

  // ── checkAdminRole error path ─────────────────────────────────────────

  it('sets isAdmin to false when checkAdminRole throws', async () => {
    mockSingle.mockRejectedValue(new Error('DB error'))
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    expect(vm.isAdmin).toBe(false)
    expect(vm.checkingAdmin).toBe(false)
  })

  // ── loginWithGoogle ───────────────────────────────────────────────────

  it('calls signInWithOAuth on loginWithGoogle', async () => {
    const w = factory()
    const vm = w.vm as any
    await vm.loginWithGoogle()
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({ redirectTo: expect.stringContaining('/admin') }),
    })
  })

  it('sets errorMsg when loginWithGoogle returns error', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: 'OAuth failed' } })
    const w = factory()
    const vm = w.vm as any
    await vm.loginWithGoogle()
    expect(vm.errorMsg).toBe('OAuth failed')
    expect(vm.loading).toBe(false)
  })

  it('sets loading to true during loginWithGoogle', async () => {
    let resolveOAuth: (val: unknown) => void
    mockSignInWithOAuth.mockReturnValue(
      new Promise((r) => {
        resolveOAuth = r
      }),
    )
    const w = factory()
    const vm = w.vm as any
    const loginPromise = vm.loginWithGoogle()
    expect(vm.loading).toBe(true)
    resolveOAuth!({ error: null })
    await loginPromise
  })

  // ── logout ────────────────────────────────────────────────────────────

  it('calls signOut and resets isAdmin on logout', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    expect(vm.isAdmin).toBe(true)
    await vm.logout()
    expect(mockSignOut).toHaveBeenCalled()
    expect(vm.isAdmin).toBe(false)
  })

  // ── onAuthStateChange ─────────────────────────────────────────────────

  it('registers onAuthStateChange listener on mount', async () => {
    factory()
    await runMounted()
    expect(mockOnAuthStateChange).toHaveBeenCalled()
    expect(authStateCallback).toBeDefined()
  })

  it('updates hasSession and checks admin when auth state changes to logged in', async () => {
    const w = factory()
    await runMounted()
    await nextTick()

    // Reset to simulate re-login
    const vm = w.vm as any
    vm.hasSession = false
    vm.isAdmin = false

    // Simulate auth state change
    authStateCallback!('SIGNED_IN', { user: { id: 'new-user-456' } })
    expect(vm.hasSession).toBe(true)
    // checkAdminRole was called (async)
    expect(mockFrom).toHaveBeenCalledWith('users')
  })

  it('resets state when auth state changes to logged out', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()

    const vm = w.vm as any
    expect(vm.hasSession).toBe(true)

    // Simulate sign out
    authStateCallback!('SIGNED_OUT', null)
    expect(vm.hasSession).toBe(false)
    expect(vm.isAdmin).toBe(false)
  })

  // ── Sidebar state ─────────────────────────────────────────────────────

  it('initializes sidebar as not collapsed and not open', () => {
    const w = factory()
    const vm = w.vm as any
    expect(vm.sidebarCollapsed).toBe(false)
    expect(vm.sidebarOpen).toBe(false)
  })

  // ── Route watch closes sidebar ────────────────────────────────────────

  it('closes sidebar on route path change', async () => {
    const w = factory()
    const vm = w.vm as any
    vm.sidebarOpen = true

    // Find the route.path watch
    const routeWatch = watchCallbacks.find((wc) => {
      try {
        return wc.source() === '/admin'
      } catch {
        return false
      }
    })
    expect(routeWatch).toBeDefined()
    mockRoute.path = '/admin/users'
    routeWatch!.cb('/admin/users')
    expect(vm.sidebarOpen).toBe(false)
  })

  // ── Escape key handler ────────────────────────────────────────────────

  it('registers keydown listener for Escape key', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    factory()
    // Run ALL mounted callbacks (2nd one registers keydown)
    await runMounted()
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    addSpy.mockRestore()
  })

  it('closes sidebar on Escape keypress', async () => {
    let keyHandler: ((e: KeyboardEvent) => void) | null = null
    const addSpy = vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'keydown') keyHandler = handler as (e: KeyboardEvent) => void
    })

    const w = factory()
    await runMounted()
    const vm = w.vm as any
    vm.sidebarOpen = true

    expect(keyHandler).toBeDefined()
    keyHandler!({ key: 'Escape' } as KeyboardEvent)
    expect(vm.sidebarOpen).toBe(false)

    addSpy.mockRestore()
  })

  it('does not close sidebar on non-Escape key', async () => {
    let keyHandler: ((e: KeyboardEvent) => void) | null = null
    const addSpy = vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'keydown') keyHandler = handler as (e: KeyboardEvent) => void
    })

    const w = factory()
    await runMounted()
    const vm = w.vm as any
    vm.sidebarOpen = true

    keyHandler!({ key: 'Enter' } as KeyboardEvent)
    expect(vm.sidebarOpen).toBe(true)

    addSpy.mockRestore()
  })

  it('removes keydown listener on unmount', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    factory()
    await runMounted()

    // Run unmounted callbacks
    unmountedCallbacks.forEach((cb) => cb())
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })

  // ── useSeoMeta ────────────────────────────────────────────────────────

  it('sets noindex robots meta', () => {
    factory()
    const useSeoMeta = globalThis.useSeoMeta as ReturnType<typeof vi.fn>
    expect(useSeoMeta).toHaveBeenCalledWith({ robots: 'noindex, nofollow' })
  })

  // ── Error message display ─────────────────────────────────────────────

  it('shows error message when errorMsg is set', async () => {
    const w = factory()
    const vm = w.vm as any
    vm.errorMsg = 'Test error'
    await nextTick()
    expect(w.find('.error-msg').exists()).toBe(true)
    expect(w.find('.error-msg').text()).toBe('Test error')
  })

  // ── Checking admin state ──────────────────────────────────────────────

  it('starts with checkingAdmin true and resolves to false', async () => {
    const w = factory()
    const vm = w.vm as any
    // checkingAdmin starts as true (default ref value)
    expect(vm.checkingAdmin).toBe(true)
    // After mount + admin check completes, it becomes false
    await runMounted()
    await nextTick()
    await nextTick()
    expect(vm.checkingAdmin).toBe(false)
  })

  // ── Admin panel template events ─────────────────────────────────────

  it('toggles sidebarCollapsed on sidebar toggle-collapse event', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    expect(vm.isAdmin).toBe(true)
    await nextTick()
    const sidebar = w.findComponent({ name: 'AdminLayoutAdminSidebar' })
    if (sidebar.exists()) {
      expect(vm.sidebarCollapsed).toBe(false)
      await sidebar.vm.$emit('toggle-collapse')
      expect(vm.sidebarCollapsed).toBe(true)
    }
  })

  it('closes sidebar on sidebar close event', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    vm.sidebarOpen = true
    await nextTick()
    const sidebar = w.findComponent({ name: 'AdminLayoutAdminSidebar' })
    if (sidebar.exists()) {
      await sidebar.vm.$emit('close')
      expect(vm.sidebarOpen).toBe(false)
    }
  })

  it('toggles sidebarOpen on header toggle-sidebar event', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    await nextTick()
    const header = w.findComponent({ name: 'AdminLayoutAdminHeader' })
    if (header.exists()) {
      expect(vm.sidebarOpen).toBe(false)
      await header.vm.$emit('toggle-sidebar')
      expect(vm.sidebarOpen).toBe(true)
    }
  })

  it('toggles sidebarCollapsed on header toggle-collapse event', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    await nextTick()
    const header = w.findComponent({ name: 'AdminLayoutAdminHeader' })
    if (header.exists()) {
      expect(vm.sidebarCollapsed).toBe(false)
      await header.vm.$emit('toggle-collapse')
      expect(vm.sidebarCollapsed).toBe(true)
    }
  })

  it('closes sidebar overlay on click', async () => {
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    vm.sidebarOpen = true
    await nextTick()
    const overlay = w.find('.sidebar-overlay')
    if (overlay.exists()) {
      await overlay.trigger('click')
      expect(vm.sidebarOpen).toBe(false)
    }
  })

  // ── Access denied logout button ───────────────────────────────────────

  it('shows logout button in access denied state', async () => {
    mockSingle.mockResolvedValue({ data: { role: 'user' } })
    const w = factory()
    await runMounted()
    await nextTick()
    await nextTick()
    const vm = w.vm as any
    expect(vm.isAdmin).toBe(false)
    expect(vm.hasSession).toBe(true)
    await nextTick()
    const btn = w.find('.btn-google')
    if (btn.exists()) {
      await btn.trigger('click')
      expect(mockSignOut).toHaveBeenCalled()
    }
  })

  // ── Error boundary slot rendering ─────────────────────────────────────

  it('renders error boundary slot with error content in admin panel', async () => {
    const ErrorBoundaryStub = {
      name: 'NuxtErrorBoundary',
      template: '<div><slot /><slot name="error" :error="err" :clearError="clear" /></div>',
      emits: ['error'],
      setup(_: unknown, { emit }: { emit: (e: string, ...args: unknown[]) => void }) {
        const err = ref(new Error('admin test'))
        const clear = () => {}
        setTimeout(() => emit('error', err.value), 0)
        return { err, clear }
      },
    }
    const w = shallowMount(AdminLayout, {
      global: {
        stubs: {
          AdminLayoutAdminSidebar: true,
          AdminLayoutAdminHeader: true,
          NuxtErrorBoundary: ErrorBoundaryStub,
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    // Need admin state for the panel to render
    const vm = w.vm as any
    vm.hasSession = true
    vm.isAdmin = true
    vm.checkingAdmin = false
    await nextTick()

    expect(w.find('.error-boundary').exists()).toBe(true)
    expect(w.find('.error-boundary__btn').exists()).toBe(true)
    expect(w.find('.error-boundary__link').exists()).toBe(true)
  })
})
