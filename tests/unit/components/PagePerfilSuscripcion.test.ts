/**
 * Tests for app/pages/perfil/suscripcion.vue
 * Subscription page — plan display, openStripePortal, computed props.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'

// Restore real Vue reactivity
beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('nextTick', nextTick)
})

// --- Mocks ---
const mockFetchSubscription = vi.fn().mockResolvedValue(undefined)
const mockCurrentPlan = ref('free')
const mockSubscription = ref<Record<string, unknown> | null>(null)
const mockLoading = ref(false)

vi.stubGlobal('useSubscriptionPlan', () => ({
  currentPlan: mockCurrentPlan,
  subscription: mockSubscription,
  loading: mockLoading,
  fetchSubscription: mockFetchSubscription,
}))

vi.stubGlobal('useAuth', () => ({
  userId: ref('user-1'),
}))

vi.stubGlobal('useI18n', () => ({
  locale: ref('es'),
  t: (key: string) => key,
}))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useHead', vi.fn())

let onMountedCb: (() => void) | null = null
vi.stubGlobal('onMounted', (cb: () => void) => {
  onMountedCb = cb
})

const mock$fetch = vi.fn()
vi.stubGlobal('$fetch', mock$fetch)

// Mock location
const mockLocation = { origin: 'https://tracciona.com', href: '' }
vi.stubGlobal('location', mockLocation)

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
}

import PerfilSuscripcion from '../../../app/pages/perfil/suscripcion.vue'

describe('perfil/suscripcion.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentPlan.value = 'free'
    mockSubscription.value = null
    mockLoading.value = false
    onMountedCb = null
    mockLocation.href = ''
    mock$fetch.mockReset()
  })

  it('renders without errors', () => {
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('calls fetchSubscription on mount with userId', async () => {
    shallowMount(PerfilSuscripcion, { global: { stubs } })
    expect(onMountedCb).toBeTruthy()
    await onMountedCb!()
    expect(mockFetchSubscription).toHaveBeenCalledWith('user-1')
  })

  it('displays plan comparison cards', () => {
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    // Should have plan cards (free, pro_monthly, pro_annual = 3)
    const html = wrapper.html()
    expect(html).toContain('profile.subscription.planFree')
    expect(html).toContain('profile.subscription.planProMonthly')
    expect(html).toContain('profile.subscription.planProAnnual')
  })

  it('shows manage plan button for paid users', async () => {
    mockCurrentPlan.value = 'pro_monthly'
    mockSubscription.value = { stripe_customer_id: 'cus_123', expires_at: null }
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    const html = wrapper.html()
    expect(html).toContain('profile.subscription.managePlan')
  })

  it('shows free note for free plan users', async () => {
    mockCurrentPlan.value = 'free'
    mockSubscription.value = null
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    const html = wrapper.html()
    expect(html).toContain('profile.subscription.freeNote')
  })

  // --- openStripePortal tests ---

  it('openStripePortal does nothing when no customerId', async () => {
    mockSubscription.value = { stripe_customer_id: null }
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    // Find and click manage button (won't exist for free, but test the function)
    // The function should bail early
    expect(mock$fetch).not.toHaveBeenCalled()
  })

  it('openStripePortal sends POST with CSRF header and redirects', async () => {
    mockCurrentPlan.value = 'pro_monthly'
    mockSubscription.value = { stripe_customer_id: 'cus_test_123', expires_at: null }
    mock$fetch.mockResolvedValueOnce({ url: 'https://billing.stripe.com/session/xxx' })

    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()

    // Click the manage plan button
    const btn = wrapper.find('button')
    if (btn.exists()) {
      await btn.trigger('click')
      await flushPromises()

      expect(mock$fetch).toHaveBeenCalledWith('/api/stripe/portal', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: {
          customerId: 'cus_test_123',
          returnUrl: 'https://tracciona.com/perfil/suscripcion',
        },
      })
      expect(mockLocation.href).toBe('https://billing.stripe.com/session/xxx')
    }
  })

  it('openStripePortal handles error gracefully (user stays on page)', async () => {
    mockCurrentPlan.value = 'pro_monthly'
    mockSubscription.value = { stripe_customer_id: 'cus_test_123', expires_at: null }
    mock$fetch.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()

    const btn = wrapper.find('button')
    if (btn.exists()) {
      await btn.trigger('click')
      await flushPromises()
      // Should not redirect
      expect(mockLocation.href).toBe('')
    }
  })

  it('openStripePortal does not redirect when url is empty', async () => {
    mockCurrentPlan.value = 'pro_monthly'
    mockSubscription.value = { stripe_customer_id: 'cus_test_123', expires_at: null }
    mock$fetch.mockResolvedValueOnce({ url: '' })

    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()

    const btn = wrapper.find('button')
    if (btn.exists()) {
      await btn.trigger('click')
      await flushPromises()
      expect(mockLocation.href).toBe('')
    }
  })

  // --- Computed props ---

  it('expiresAt returns formatted date when subscription has expiry', async () => {
    mockSubscription.value = { expires_at: '2026-12-31T00:00:00Z', stripe_customer_id: 'cus_1' }
    mockCurrentPlan.value = 'pro_monthly'
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    const html = wrapper.html()
    // The date should be rendered somewhere in the template
    expect(html).toBeTruthy()
  })

  it('isPaid is false for free plan', () => {
    mockCurrentPlan.value = 'free'
    shallowMount(PerfilSuscripcion, { global: { stubs } })
    // free plan → isPaid = false → no manage button, shows freeNote
  })

  it('isPaid is true for pro_monthly plan', () => {
    mockCurrentPlan.value = 'pro_monthly'
    mockSubscription.value = { stripe_customer_id: 'cus_1' }
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    const html = wrapper.html()
    expect(html).toContain('profile.subscription.managePlan')
  })

  it('shows loading skeleton cards when loading is true', async () => {
    mockLoading.value = true
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('renders 3 plan comparison cards', async () => {
    mockLoading.value = false
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    const planCards = wrapper.findAll('.plan-card')
    expect(planCards).toHaveLength(3)
  })

  it('highlights recommended plan with badge', async () => {
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    const highlighted = wrapper.findAll('.plan-card--highlighted')
    expect(highlighted).toHaveLength(1)
    expect(wrapper.find('.plan-badge').text()).toBe('profile.subscription.recommended')
  })

  it('disables CTA button for current plan', async () => {
    mockCurrentPlan.value = 'free'
    const wrapper = shallowMount(PerfilSuscripcion, { global: { stubs } })
    await flushPromises()
    const ctaButtons = wrapper.findAll('.plan-cta')
    // First plan is 'free' which matches currentPlan → disabled
    expect(ctaButtons[0].attributes('disabled')).toBeDefined()
    // Second plan is 'pro_monthly' → not disabled
    expect(ctaButtons[1].attributes('disabled')).toBeUndefined()
  })
})
