/**
 * Tests for app/components/vehicle/FairPriceBadge.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Use real Vue computed/ref
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
})

// Mock usePriceHistory composable
const mockFairPriceCents = ref<number | null>(null)
const mockPriceTrend = ref<'rising' | 'falling' | 'stable' | null>(null)

vi.mock('~/composables/usePriceHistory', () => ({
  usePriceHistory: () => ({
    fairPriceCents: mockFairPriceCents,
    priceTrend: mockPriceTrend,
  }),
}))

import FairPriceBadge from '../../../app/components/vehicle/FairPriceBadge.vue'

describe('FairPriceBadge', () => {
  const factory = (currentPrice: number) =>
    shallowMount(FairPriceBadge, {
      props: { vehicleId: 'v-1', currentPrice },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('does not render when fairPriceCents is null', () => {
    mockFairPriceCents.value = null
    const w = factory(10000)
    expect(w.find('.fair-price-badge').exists()).toBe(false)
  })

  it('does not render when fairPriceCents is 0', () => {
    mockFairPriceCents.value = 0
    const w = factory(10000)
    expect(w.find('.fair-price-badge').exists()).toBe(false)
  })

  it('renders when fairPriceCents is positive', () => {
    mockFairPriceCents.value = 1000000 // 10000 EUR
    const w = factory(10000)
    expect(w.find('.fair-price-badge').exists()).toBe(true)
  })

  it('shows "fair" badge when price is within 10% of fair price', () => {
    mockFairPriceCents.value = 1000000 // 10000 EUR
    const w = factory(10000) // exact match
    expect(w.find('.badge--fair').exists()).toBe(true)
    expect(w.find('.badge-label').text()).toBe('fairPrice.fairPrice')
  })

  it('shows "below" badge when price is 10%+ below fair price', () => {
    mockFairPriceCents.value = 1200000 // 12000 EUR fair
    const w = factory(10000) // 10000 EUR current — ~17% below
    expect(w.find('.badge--below').exists()).toBe(true)
    expect(w.find('.badge-label').text()).toBe('fairPrice.belowMarket')
  })

  it('shows "above" badge when price is 10%+ above fair price', () => {
    mockFairPriceCents.value = 800000 // 8000 EUR fair
    const w = factory(10000) // 10000 EUR current — 25% above
    expect(w.find('.badge--above').exists()).toBe(true)
    expect(w.find('.badge-label').text()).toBe('fairPrice.aboveMarket')
  })

  it('shows rising trend arrow', () => {
    mockFairPriceCents.value = 1000000
    mockPriceTrend.value = 'rising'
    const w = factory(10000)
    expect(w.find('.badge-trend').text()).toBe('\u2197')
  })

  it('shows falling trend arrow', () => {
    mockFairPriceCents.value = 1000000
    mockPriceTrend.value = 'falling'
    const w = factory(10000)
    expect(w.find('.badge-trend').text()).toBe('\u2198')
  })

  it('shows stable trend arrow', () => {
    mockFairPriceCents.value = 1000000
    mockPriceTrend.value = 'stable'
    const w = factory(10000)
    expect(w.find('.badge-trend').text()).toBe('\u2192')
  })

  it('renders badge with icon, label, and trend elements', () => {
    mockFairPriceCents.value = 1000000 // 10000 EUR
    mockPriceTrend.value = 'stable'
    const w = factory(10000)
    expect(w.find('.badge-icon').exists()).toBe(true)
    expect(w.find('.badge-label').exists()).toBe(true)
    expect(w.find('.badge-trend').exists()).toBe(true)
  })
})
