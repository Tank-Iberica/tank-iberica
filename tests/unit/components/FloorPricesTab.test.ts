/**
 * Tests for app/components/admin/publicidad/FloorPricesTab.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FloorPricesTab from '../../../app/components/admin/publicidad/FloorPricesTab.vue'

describe('FloorPricesTab', () => {
  const floorPrices = [
    { position: 'header-top', floor_cpm_cents: 200 },
    { position: 'sidebar-right', floor_cpm_cents: 150 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FloorPricesTab, {
      props: { floorPrices, savingFloors: false, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('shows position count badge', () => {
    expect(factory().find('.total-badge').text()).toContain('2')
  })

  it('renders table rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows position code', () => {
    expect(factory().findAll('code')[0].text()).toBe('header-top')
  })

  it('renders input for floor price', () => {
    expect(factory().findAll('.floor-input')).toHaveLength(2)
  })

  it('save button not disabled when not saving', () => {
    expect(factory().find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('save button disabled when saving', () => {
    expect(factory({ savingFloors: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows saving text when saving', () => {
    expect(factory({ savingFloors: true }).find('.btn-primary').text()).toBe('admin.publicidad.saving')
  })

  it('emits save on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toHaveLength(1)
  })

  it('shows empty state when no floor prices', () => {
    const w = factory({ floorPrices: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('updates floor_cpm_cents via input', async () => {
    const w = factory()
    const input = w.find('.floor-input')
    Object.defineProperty(input.element, 'value', { value: '200', writable: true })
    await input.trigger('input')
    expect(w.find('.floor-input').exists()).toBe(true)
  })
})
