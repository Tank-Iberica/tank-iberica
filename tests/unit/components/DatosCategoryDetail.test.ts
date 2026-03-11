/**
 * Tests for app/components/datos/DatosCategoryDetail.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useDatos', () => ({
  formatPrice: (v: number) => `${v.toLocaleString('es-ES')} €`,
}))

import { shallowMount } from '@vue/test-utils'
import DatosCategoryDetail from '../../../app/components/datos/DatosCategoryDetail.vue'

const baseStat = {
  subcategory: 'tractora', label: 'Tractoras', avgPrice: 45000, medianPrice: 42000,
  listingCount: 120, soldCount: 30, avgDaysToSell: 45, trendPct: 2.5, trendDirection: 'rising',
}
const baseBrands = [
  { brand: 'Volvo', avgPrice: 50000, listingCount: 40 },
  { brand: 'Scania', avgPrice: 48000, listingCount: 35 },
]

describe('DatosCategoryDetail', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DatosCategoryDetail, {
      props: { categoryStat: { ...baseStat }, brandBreakdown: [...baseBrands], ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders section', () => {
    expect(factory().find('.datos-section').exists()).toBe(true)
  })

  it('shows category title', () => {
    expect(factory().find('.datos-section__title').text()).toBe('Tractoras')
  })

  it('renders stat cards', () => {
    expect(factory().findAll('.detail-stat').length).toBeGreaterThanOrEqual(4)
  })

  it('shows listing count stat', () => {
    const values = factory().findAll('.detail-stat__value')
    expect(values.some(v => v.text() === '120')).toBe(true)
  })

  it('renders brand table rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows brand names', () => {
    const cells = factory().findAll('.brand-table__td--left')
    expect(cells[0].text()).toBe('Volvo')
    expect(cells[1].text()).toBe('Scania')
  })

  it('hides section when no categoryStat', () => {
    const w = factory({ categoryStat: undefined })
    expect(w.find('.datos-section').exists()).toBe(false)
  })

  it('hides section when empty brand breakdown', () => {
    const w = factory({ brandBreakdown: [] })
    expect(w.find('.datos-section').exists()).toBe(false)
  })
})
