/**
 * Tests for app/components/vendedor/VendedorStats.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VendedorStats from '../../../app/components/vendedor/VendedorStats.vue'

describe('VendedorStats', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VendedorStats, {
      props: { activeListings: 15, totalReviews: 8, avgRating: 4.5, responseRateFormatted: '95%', ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders stats row', () => {
    expect(factory().find('.stats-row').exists()).toBe(true)
  })

  it('shows 4 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(4)
  })

  it('shows active listings', () => {
    expect(factory().findAll('.stat-value')[0].text()).toBe('15')
  })

  it('shows total reviews', () => {
    expect(factory().findAll('.stat-value')[1].text()).toBe('8')
  })

  it('shows avg rating', () => {
    expect(factory().findAll('.stat-value')[2].text()).toBe('4.5')
  })

  it('shows -- for zero rating', () => {
    const w = factory({ avgRating: 0 })
    expect(w.findAll('.stat-value')[2].text()).toBe('--')
  })

  it('shows response rate', () => {
    expect(factory().findAll('.stat-value')[3].text()).toBe('95%')
  })
})
