/**
 * Tests for app/components/subastas/SubastasDetailVehicleInfo.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SubastasDetailVehicleInfo from '../../../app/components/subastas/SubastasDetailVehicleInfo.vue'

describe('SubastasDetailVehicleInfo', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubastasDetailVehicleInfo, {
      props: {
        title: 'Camión Volvo FH 500',
        year: 2022,
        location: 'Madrid, España',
        price: 85000,
        formattedPrice: '85.000 €',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders vehicle info section', () => {
    expect(factory().find('.vehicle-info-section').exists()).toBe(true)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.vehicle-title').text()).toBe('Camión Volvo FH 500')
  })

  it('shows year meta item', () => {
    const items = factory().findAll('.vehicle-meta-item')
    expect(items[0].text()).toContain('2022')
  })

  it('hides year when null', () => {
    const w = factory({ year: null })
    const items = w.findAll('.vehicle-meta-item')
    // Should only have location and price
    expect(items).toHaveLength(2)
  })

  it('shows location meta item', () => {
    const items = factory().findAll('.vehicle-meta-item')
    expect(items[1].text()).toContain('Madrid, España')
  })

  it('hides location when null', () => {
    const w = factory({ location: null })
    const items = w.findAll('.vehicle-meta-item')
    // Should have year and price
    expect(items).toHaveLength(2)
  })

  it('shows price meta item with formatted price', () => {
    const items = factory().findAll('.vehicle-meta-item')
    expect(items[2].text()).toContain('85.000 €')
  })

  it('hides price when null', () => {
    const w = factory({ price: null })
    const items = w.findAll('.vehicle-meta-item')
    // Should have year and location
    expect(items).toHaveLength(2)
  })

  it('shows all 3 meta items when all present', () => {
    expect(factory().findAll('.vehicle-meta-item')).toHaveLength(3)
  })

  it('shows no meta items when all null', () => {
    const w = factory({ year: null, location: null, price: null })
    expect(w.findAll('.vehicle-meta-item')).toHaveLength(0)
  })
})
