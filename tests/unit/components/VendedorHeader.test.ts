/**
 * Tests for app/components/vendedor/VendedorHeader.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useVendedorDetail', () => ({
  renderStars: (r: number) => '★'.repeat(Math.round(r)),
}))
vi.stubGlobal('useImageUrl', () => ({ getImageUrl: (url: string) => url }))

import { shallowMount } from '@vue/test-utils'
import VendedorHeader from '../../../app/components/vendedor/VendedorHeader.vue'

const baseProfile = { logo_url: 'https://img.com/logo.jpg', verified: true, badge: 'founding', total_reviews: 8 }

describe('VendedorHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VendedorHeader, {
      props: {
        profile: { ...baseProfile },
        sellerName: 'Tank Ibérica',
        sellerBio: 'Empresa líder',
        sellerLocation: 'León',
        memberSince: '2024',
        responseTimeBadge: 'fast',
        responseTimeLabel: 'Responde rápido',
        avgRating: 4.5,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders header', () => {
    expect(factory().find('.seller-header').exists()).toBe(true)
  })

  it('shows seller name', () => {
    expect(factory().find('.seller-header__name').text()).toContain('Tank Ibérica')
  })

  it('shows verified badge when verified', () => {
    expect(factory().find('.verified-badge').exists()).toBe(true)
  })

  it('shows founding badge', () => {
    expect(factory().find('.founding-badge').exists()).toBe(true)
  })

  it('shows location', () => {
    expect(factory().find('.seller-header__location').text()).toBe('León')
  })

  it('shows member since', () => {
    expect(factory().text()).toContain('2024')
  })

  it('shows response time badge', () => {
    const badge = factory().find('.meta-item--badge')
    expect(badge.classes()).toContain('badge--fast')
    expect(badge.text()).toBe('Responde rápido')
  })

  it('shows rating when > 0', () => {
    expect(factory().find('.rating-value').text()).toBe('4.5')
  })

  it('hides rating when 0', () => {
    const w = factory({ avgRating: 0 })
    expect(w.find('.seller-header__rating').exists()).toBe(false)
  })

  it('shows bio', () => {
    expect(factory().find('.seller-header__bio').text()).toBe('Empresa líder')
  })

  it('shows logo placeholder when no logo', () => {
    const w = factory({ profile: { ...baseProfile, logo_url: null } })
    expect(w.find('.seller-header__logo-placeholder').text()).toBe('T')
  })
})
