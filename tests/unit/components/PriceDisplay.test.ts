/**
 * Tests for app/components/shared/PriceDisplay.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue'

beforeAll(() => {
  vi.stubGlobal('computed', computed)
})

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (price: number, locale: string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price),
  formatPriceCents: (cents: number, locale: string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(cents / 100),
}))

import PriceDisplay from '../../../app/components/shared/PriceDisplay.vue'

describe('PriceDisplay', () => {
  const factory = (props: Record<string, unknown> = {}) =>
    shallowMount(PriceDisplay, {
      props: { price: 25000, ...props },
    })

  it('renders price-display span', () => {
    const w = factory()
    expect(w.find('.price-display').exists()).toBe(true)
  })

  it('formats price in EUR', () => {
    const w = factory({ price: 25000 })
    expect(w.text()).toContain('25.000')
  })

  it('shows fallback when price is null', () => {
    const w = factory({ price: null })
    expect(w.text()).toContain('-')
  })

  it('shows custom fallback', () => {
    const w = factory({ price: null, fallback: 'N/A' })
    expect(w.text()).toContain('N/A')
  })

  it('formats cents when cents prop is true', () => {
    const w = factory({ price: 250000, cents: true })
    // 250000 cents = 2500.00€
    expect(w.text()).toContain('2500')
  })

  it('shows suffix when provided and price exists', () => {
    const w = factory({ price: 1000, suffix: '/mes' })
    expect(w.find('.price-suffix').text()).toBe('/mes')
  })

  it('hides suffix when price is null', () => {
    const w = factory({ price: null, suffix: '/mes' })
    expect(w.find('.price-suffix').exists()).toBe(false)
  })

  it('hides suffix when suffix is empty', () => {
    const w = factory({ price: 1000, suffix: '' })
    expect(w.find('.price-suffix').exists()).toBe(false)
  })
})
