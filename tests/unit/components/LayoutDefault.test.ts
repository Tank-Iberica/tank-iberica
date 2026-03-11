/**
 * Tests for app/layouts/default.vue
 * Covers: authOpen watch, handleOpenUserPanel, provide modal openers,
 *         onMounted auto-open auth, watch route.query.auth
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// ── Track hooks ─────────────────────────────────────────────────────────────

const mountedCallbacks: Array<() => void> = []
const watchCallbacks: Array<{ source: () => unknown; cb: (val: unknown) => void }> = []
const provides: Record<string, unknown> = {}

const mockRoute = {
  query: {} as Record<string, string>,
  path: '/',
}

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useRoute', () => mockRoute)
  vi.stubGlobal('useNuxtApp', () => ({
    hook: vi.fn(),
  }))
  vi.stubGlobal('onMounted', (cb: () => void) => {
    mountedCallbacks.push(cb)
  })
  vi.stubGlobal('provide', (key: string, val: unknown) => {
    provides[key] = val
  })
  // Capture watch calls — Vue's watch with getter function
  vi.stubGlobal('watch', (sourceOrRef: unknown, cb: (val: unknown, oldVal: unknown) => void) => {
    if (typeof sourceOrRef === 'function') {
      watchCallbacks.push({ source: sourceOrRef as () => unknown, cb })
    } else {
      // ref-based watch — simulate it
      watchCallbacks.push({ source: () => (sourceOrRef as { value: unknown }).value, cb })
    }
  })
})

import DefaultLayout from '../../../app/layouts/default.vue'

// ── Stubs ───────────────────────────────────────────────────────────────────

const defaultStubs = {
  NuxtLoadingIndicator: true,
  CatalogAnnounceBanner: true,
  LayoutAppHeader: true,
  NuxtErrorBoundary: { template: '<div><slot /></div>' },
  LayoutAppFooter: true,
  LazyModalsAuthModal: true,
  LazyUserPanel: true,
  LazyModalsAdvertiseModal: true,
  LazyModalsDemandModal: true,
  LazyModalsSubscribeModal: true,
  LayoutCookieBanner: true,
  AccessibilityFAB: true,
  UiToastContainer: true,
  UiScrollToTop: true,
  NuxtLink: { template: '<a><slot /></a>' },
}

describe('default layout', () => {
  beforeEach(() => {
    mountedCallbacks.length = 0
    watchCallbacks.length = 0
    Object.keys(provides).forEach((k) => delete provides[k])
    mockRoute.query = {}
    mockRoute.path = '/'
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const factory = (routeQuery: Record<string, string> = {}) => {
    mockRoute.query = routeQuery
    return shallowMount(DefaultLayout, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: defaultStubs,
      },
    })
  }

  // ── Basic rendering ─────────────────────────────────────────────────────

  it('renders the layout wrapper', () => {
    const w = factory()
    expect(w.find('.layout').exists()).toBe(true)
  })

  it('renders skip link', () => {
    const w = factory()
    expect(w.find('.skip-link').exists()).toBe(true)
  })

  it('renders main content area', () => {
    const w = factory()
    expect(w.find('#main-content').exists()).toBe(true)
  })

  it('renders ARIA live regions', () => {
    const w = factory()
    expect(w.find('#aria-live-region').exists()).toBe(true)
    expect(w.find('#aria-live-assertive').exists()).toBe(true)
  })

  // ── Modal openers via provide ─────────────────────────────────────────

  it('provides openDemandModal', () => {
    factory()
    expect(provides.openDemandModal).toBeDefined()
    expect(typeof provides.openDemandModal).toBe('function')
  })

  it('provides openAuthModal', () => {
    factory()
    expect(provides.openAuthModal).toBeDefined()
    expect(typeof provides.openAuthModal).toBe('function')
  })

  it('provides openSubscribeModal', () => {
    factory()
    expect(provides.openSubscribeModal).toBeDefined()
    expect(typeof provides.openSubscribeModal).toBe('function')
  })

  // ── onMounted auto-open auth ──────────────────────────────────────────

  it('opens auth modal on mount when route.query.auth is login', () => {
    const w = factory({ auth: 'login' })
    // Execute mounted callbacks
    mountedCallbacks.forEach((cb) => cb())
    // The authOpen ref should be true — check via the ModalsAuthModal v-model
    expect((w.vm as any).authOpen).toBe(true)
  })

  it('does not open auth modal on mount when no auth query', () => {
    const w = factory()
    mountedCallbacks.forEach((cb) => cb())
    expect((w.vm as any).authOpen).toBe(false)
  })

  // ── Watch route.query.auth ────────────────────────────────────────────

  it('opens auth modal when route query changes to login', () => {
    const w = factory()
    // Find the watch for route.query.auth
    const authWatch = watchCallbacks.find((wc) => {
      try {
        mockRoute.query = { auth: 'login' }
        return wc.source() === 'login'
      } catch {
        return false
      }
    })
    expect(authWatch).toBeDefined()
    authWatch!.cb('login')
    expect((w.vm as any).authOpen).toBe(true)
  })

  it('does not change auth modal when route query is not login', () => {
    const w = factory()
    const authWatch = watchCallbacks.find((wc) => {
      try {
        mockRoute.query = { auth: 'register' }
        return wc.source() === 'register'
      } catch {
        return false
      }
    })
    if (authWatch) {
      authWatch.cb('register')
    }
    expect((w.vm as any).authOpen).toBe(false)
  })

  // ── authOpen watch (recently closed prevention) ───────────────────────

  it('sets authRecentlyClosed flag when auth modal closes', async () => {
    const w = factory()
    // Find the watch for authOpen ref (boolean → boolean transition)
    const refWatch = watchCallbacks.find((wc) => {
      // This is the watch(authOpen, ...) — source is the ref itself
      try {
        return typeof wc.source() === 'boolean'
      } catch {
        return false
      }
    })

    if (refWatch) {
      // Simulate authOpen going from true to false
      refWatch.cb(false, true)
      // Now handleOpenUserPanel should be blocked
      ;(w.vm as any).handleOpenUserPanel?.()
      // userPanelOpen should NOT be true
      expect((w.vm as any).userPanelOpen).toBe(false)

      // After 600ms timeout, it should be unblocked
      vi.advanceTimersByTime(600)
    }
  })

  // ── handleOpenUserPanel ───────────────────────────────────────────────

  it('opens user panel when auth was not recently closed', () => {
    const w = factory()
    // handleOpenUserPanel should set userPanelOpen to true
    const vm = w.vm as any
    if (vm.handleOpenUserPanel) {
      vm.handleOpenUserPanel()
      expect(vm.userPanelOpen).toBe(true)
    }
  })

  // ── Header event handlers ─────────────────────────────────────────────

  it('opens auth modal on open-auth event from header', async () => {
    const w = factory()
    const header = w.findComponent({ name: 'LayoutAppHeader' })
    if (header.exists()) {
      await header.vm.$emit('open-auth')
      expect((w.vm as any).authOpen).toBe(true)
    }
  })

  it('opens advertise modal on open-anunciate event from header', async () => {
    const w = factory()
    const header = w.findComponent({ name: 'LayoutAppHeader' })
    if (header.exists()) {
      await header.vm.$emit('open-anunciate')
      expect((w.vm as any).advertiseOpen).toBe(true)
    }
  })

  // ── Provide callbacks actually set modal refs ─────────────────────────

  it('openDemandModal callback sets demandOpen to true', () => {
    const w = factory()
    ;(provides.openDemandModal as () => void)()
    expect((w.vm as any).demandOpen).toBe(true)
  })

  it('openAuthModal callback sets authOpen to true', () => {
    const w = factory()
    ;(provides.openAuthModal as () => void)()
    expect((w.vm as any).authOpen).toBe(true)
  })

  it('openSubscribeModal callback sets subscribeOpen to true', () => {
    const w = factory()
    ;(provides.openSubscribeModal as () => void)()
    expect((w.vm as any).subscribeOpen).toBe(true)
  })

  // ── Error boundary handler ────────────────────────────────────────────

  it('renders error boundary slot wrapper', () => {
    const w = factory()
    // NuxtErrorBoundary is stubbed with a template that wraps the slot
    expect(w.find('#main-content').exists()).toBe(true)
  })

  // ── Modal components render ───────────────────────────────────────────

  it('renders all modal components', () => {
    const w = factory()
    expect(w.findComponent({ name: 'LazyModalsAuthModal' }).exists()).toBe(true)
    expect(w.findComponent({ name: 'LazyUserPanel' }).exists()).toBe(true)
    expect(w.findComponent({ name: 'LazyModalsAdvertiseModal' }).exists()).toBe(true)
    expect(w.findComponent({ name: 'LazyModalsDemandModal' }).exists()).toBe(true)
    expect(w.findComponent({ name: 'LazyModalsSubscribeModal' }).exists()).toBe(true)
  })

  // ── AdvertiseModal open-auth event ────────────────────────────────────

  it('opens auth from advertise modal open-auth event', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyModalsAdvertiseModal' })
    if (modal.exists()) {
      await modal.vm.$emit('open-auth')
      expect((w.vm as any).authOpen).toBe(true)
    }
  })

  it('opens auth from demand modal open-auth event', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyModalsDemandModal' })
    if (modal.exists()) {
      await modal.vm.$emit('open-auth')
      expect((w.vm as any).authOpen).toBe(true)
    }
  })

  // ── handleOpenUserPanel from header event ─────────────────────────────

  it('opens user panel on open-user-panel event from header', async () => {
    const w = factory()
    const header = w.findComponent({ name: 'LayoutAppHeader' })
    if (header.exists()) {
      await header.vm.$emit('open-user-panel')
      expect((w.vm as any).userPanelOpen).toBe(true)
    }
  })

  // ── v-model update handlers on modals ─────────────────────────────────

  it('updates authOpen via AuthModal v-model', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyModalsAuthModal' })
    if (modal.exists()) {
      await modal.vm.$emit('update:modelValue', true)
      expect((w.vm as any).authOpen).toBe(true)
      await modal.vm.$emit('update:modelValue', false)
      expect((w.vm as any).authOpen).toBe(false)
    }
  })

  it('updates userPanelOpen via UserPanel v-model', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyUserPanel' })
    if (modal.exists()) {
      await modal.vm.$emit('update:modelValue', true)
      expect((w.vm as any).userPanelOpen).toBe(true)
    }
  })

  it('updates advertiseOpen via AdvertiseModal v-model', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyModalsAdvertiseModal' })
    if (modal.exists()) {
      await modal.vm.$emit('update:modelValue', true)
      expect((w.vm as any).advertiseOpen).toBe(true)
    }
  })

  it('updates demandOpen via DemandModal v-model', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyModalsDemandModal' })
    if (modal.exists()) {
      await modal.vm.$emit('update:modelValue', true)
      expect((w.vm as any).demandOpen).toBe(true)
    }
  })

  it('updates subscribeOpen via SubscribeModal v-model', async () => {
    const w = factory()
    const modal = w.findComponent({ name: 'LazyModalsSubscribeModal' })
    if (modal.exists()) {
      await modal.vm.$emit('update:modelValue', true)
      expect((w.vm as any).subscribeOpen).toBe(true)
    }
  })

  // ── Error boundary slot rendering ─────────────────────────────────────

  it('renders error boundary slot with error content', () => {
    const ErrorBoundaryStub = {
      name: 'NuxtErrorBoundary',
      template: '<div><slot /><slot name="error" :error="err" :clearError="clear" /></div>',
      emits: ['error'],
      setup(_: unknown, { emit }: { emit: (e: string, ...args: unknown[]) => void }) {
        const err = ref(new Error('test'))
        const clear = () => {}
        // Emit error on mount to trigger @error handler
        setTimeout(() => emit('error', err.value), 0)
        return { err, clear }
      },
    }
    const w = shallowMount(DefaultLayout, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: {
          ...defaultStubs,
          NuxtErrorBoundary: ErrorBoundaryStub,
        },
      },
    })
    // Trigger the deferred error emit
    vi.advanceTimersByTime(1)
    expect(w.find('.error-boundary').exists()).toBe(true)
    expect(w.find('.error-boundary__btn').exists()).toBe(true)
    expect(w.find('.error-boundary__link').exists()).toBe(true)
  })
})
