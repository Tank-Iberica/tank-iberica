/**
 * Tests for app/components/datos/DatosProvinceTable.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useDatos', () => ({
  formatPrice: (v: number) => `${v.toLocaleString('es-ES')} €`,
}))

import { shallowMount } from '@vue/test-utils'
import DatosProvinceTable from '../../../app/components/datos/DatosProvinceTable.vue'

const baseProvs = [
  { province: 'Madrid', avgPrice: 42000, listingCount: 50 },
  { province: 'Barcelona', avgPrice: 40000, listingCount: 45 },
]

describe('DatosProvinceTable', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DatosProvinceTable, {
      props: { provinces: [...baseProvs], sortKey: 'province', sortAsc: true, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders section when provinces exist', () => {
    expect(factory().find('.datos-section').exists()).toBe(true)
  })

  it('hides section when empty', () => {
    const w = factory({ provinces: [] })
    expect(w.find('.datos-section').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.datos-section__title').text()).toBe('data.byProvince')
  })

  it('renders table rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows province names', () => {
    const cells = factory().findAll('.province-table__td--left')
    expect(cells[0].text()).toBe('Madrid')
  })

  it('shows sort arrow for active column', () => {
    const th = factory().findAll('th')[0]
    expect(th.text()).toContain('↑')
  })

  it('shows descending arrow', () => {
    const w = factory({ sortAsc: false })
    expect(w.findAll('th')[0].text()).toContain('↓')
  })

  it('emits sort on header click', async () => {
    const w = factory()
    await w.findAll('th')[1].trigger('click')
    expect(w.emitted('sort')?.[0]).toEqual(['avgPrice'])
  })

  it('applies striped class to odd rows', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].classes()).toContain('province-table__row--striped')
  })
})
