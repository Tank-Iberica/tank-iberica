/**
 * Tests for app/components/subastas/SubastasDetailInfo.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubastasDetailInfo from '../../../app/components/subastas/SubastasDetailInfo.vue'

describe('SubastasDetailInfo', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubastasDetailInfo, {
      props: {
        description: 'Camión en buen estado',
        startPrice: '25.000 €',
        bidIncrement: '500 €',
        buyerPremiumPct: 5,
        deposit: '2.500 €',
        startDate: '01/03/2026',
        endDate: '15/03/2026',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders details section', () => {
    expect(factory().find('.auction-details-section').exists()).toBe(true)
  })

  it('shows section heading', () => {
    expect(factory().find('.section-heading').text()).toBe('auction.detailsTitle')
  })

  it('shows description', () => {
    expect(factory().find('.auction-description').text()).toBe('Camión en buen estado')
  })

  it('hides description when null', () => {
    const w = factory({ description: null })
    expect(w.find('.auction-description').exists()).toBe(false)
  })

  it('renders 6 detail items', () => {
    expect(factory().findAll('.detail-item')).toHaveLength(6)
  })

  it('shows start price', () => {
    const items = factory().findAll('.detail-item')
    expect(items[0].find('.detail-value').text()).toBe('25.000 €')
  })

  it('shows bid increment', () => {
    const items = factory().findAll('.detail-item')
    expect(items[1].find('.detail-value').text()).toBe('500 €')
  })

  it('shows buyer premium percentage', () => {
    const items = factory().findAll('.detail-item')
    expect(items[2].find('.detail-value').text()).toBe('5%')
  })

  it('shows deposit', () => {
    const items = factory().findAll('.detail-item')
    expect(items[3].find('.detail-value').text()).toBe('2.500 €')
  })

  it('shows start date', () => {
    const items = factory().findAll('.detail-item')
    expect(items[4].find('.detail-value').text()).toBe('01/03/2026')
  })

  it('shows end date', () => {
    const items = factory().findAll('.detail-item')
    expect(items[5].find('.detail-value').text()).toBe('15/03/2026')
  })
})
