/**
 * Tests for app/components/layout/CookieBanner.vue
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'

const mockSaveConsent = vi.fn().mockResolvedValue(undefined)
const mockLoadConsent = vi.fn()
const mockDefaultConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: '',
}

let mountedCallback: (() => void) | null = null

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useConsent', () => ({
    loaded: ref(true),
    loadConsent: mockLoadConsent,
    saveConsent: mockSaveConsent,
    defaultConsent: mockDefaultConsent,
  }))
  vi.stubGlobal('onMounted', (cb: () => void) => {
    mountedCallback = cb
  })
})

import CookieBanner from '../../../app/components/layout/CookieBanner.vue'

describe('CookieBanner', () => {
  beforeEach(() => {
    mockLoadConsent.mockReset()
    mockSaveConsent.mockReset().mockResolvedValue(undefined)
    mountedCallback = null
  })

  const factory = (stored: unknown = null) => {
    mockLoadConsent.mockReturnValue(stored)
    const w = shallowMount(CookieBanner, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { Teleport: true, NuxtLink: { template: '<a><slot /></a>' } },
      },
    })
    if (mountedCallback) mountedCallback()
    return w
  }

  it('shows banner when no stored consent', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner').exists()).toBe(true)
  })

  it('hides banner when consent is stored', async () => {
    const w = factory({ necessary: true, analytics: true, marketing: false, timestamp: '2026-01-01' })
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner').exists()).toBe(false)
  })

  it('has dialog role', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner').attributes('role')).toBe('dialog')
  })

  it('shows banner title', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__title').text()).toBe('gdpr.bannerTitle')
  })

  it('shows banner description', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__desc').text()).toBe('gdpr.bannerDesc')
  })

  it('shows learn more link', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__link').text()).toBe('gdpr.learnMore')
  })

  it('shows 3 action buttons', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    const btns = w.findAll('.cookie-banner__btn')
    expect(btns).toHaveLength(3)
  })

  it('shows accept all button', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__btn--primary').text()).toBe('gdpr.acceptAll')
  })

  it('shows accept necessary button', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__btn--secondary').text()).toBe('gdpr.acceptNecessary')
  })

  it('shows customize button', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__btn--outline').text()).toBe('gdpr.customize')
  })

  it('customization panel is hidden by default', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    expect(w.find('.cookie-banner__customize').exists()).toBe(false)
  })

  it('shows customization panel on customize click', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--outline').trigger('click')
    expect(w.find('.cookie-banner__customize').exists()).toBe(true)
  })

  it('customization panel has 3 cookie categories', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--outline').trigger('click')
    expect(w.findAll('.cookie-category')).toHaveLength(3)
  })

  it('necessary cookies toggle is disabled', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--outline').trigger('click')
    expect(w.find('.cookie-toggle--disabled').exists()).toBe(true)
    expect(w.find('#cookie-necessary').attributes('disabled')).toBeDefined()
  })

  it('analytics and marketing toggles are enabled', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--outline').trigger('click')
    expect(w.find('#cookie-analytics').attributes('disabled')).toBeUndefined()
    expect(w.find('#cookie-marketing').attributes('disabled')).toBeUndefined()
  })

  it('shows save preferences button in customize panel', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--outline').trigger('click')
    expect(w.find('.cookie-banner__btn--full').text()).toBe('gdpr.savePreferences')
  })

  it('calls saveConsent on accept all click', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--primary').trigger('click')
    expect(mockSaveConsent).toHaveBeenCalledWith(
      expect.objectContaining({ necessary: true, analytics: true, marketing: true }),
    )
  })

  it('calls saveConsent on accept necessary click', async () => {
    const w = factory(null)
    await w.vm.$nextTick()
    await w.find('.cookie-banner__btn--secondary').trigger('click')
    expect(mockSaveConsent).toHaveBeenCalledWith(
      expect.objectContaining({ necessary: true, analytics: false, marketing: false }),
    )
  })
})
