/**
 * Tests for app/components/subastas/SubastasDetailDisclaimers.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubastasDetailDisclaimers from '../../../app/components/subastas/SubastasDetailDisclaimers.vue'

describe('SubastasDetailDisclaimers', () => {
  const factory = () =>
    shallowMount(SubastasDetailDisclaimers, {
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders disclaimers section', () => {
    expect(factory().find('.disclaimers-section').exists()).toBe(true)
  })

  it('shows section heading', () => {
    expect(factory().find('.section-heading').text()).toBe('auction.disclaimersTitle')
  })

  it('renders 5 disclaimer items', () => {
    expect(factory().findAll('.disclaimers-list li')).toHaveLength(5)
  })

  it('shows all disclaimer keys', () => {
    const items = factory().findAll('.disclaimers-list li')
    expect(items[0].text()).toBe('auction.disclaimerAsIs')
    expect(items[1].text()).toBe('auction.disclaimerPremium')
    expect(items[2].text()).toBe('auction.disclaimerBinding')
    expect(items[3].text()).toBe('auction.disclaimerDeposit')
    expect(items[4].text()).toBe('auction.disclaimerInspection')
  })
})
