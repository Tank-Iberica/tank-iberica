/**
 * Tests for app/components/datos/DatosCategoryGrid.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useDatos', () => ({
  formatPrice: (v: number) => `${v.toLocaleString('es-ES')} €`,
}))

import { shallowMount } from '@vue/test-utils'
import DatosCategoryGrid from '../../../app/components/datos/DatosCategoryGrid.vue'

const baseCats = [
  { subcategory: 'tractora', label: 'Tractoras', avgPrice: 45000, medianPrice: 42000, listingCount: 120, soldCount: 30, avgDaysToSell: 45, trendPct: 2.5, trendDirection: 'rising' },
  { subcategory: 'rigido', label: 'Rígidos', avgPrice: 35000, medianPrice: 33000, listingCount: 80, soldCount: 15, avgDaysToSell: 60, trendPct: -1.2, trendDirection: 'falling' },
]

describe('DatosCategoryGrid', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DatosCategoryGrid, {
      props: { categories: [...baseCats], selectedCategory: null, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders section', () => {
    expect(factory().find('.datos-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.datos-section__title').text()).toBe('data.selectCategory')
  })

  it('renders category cards', () => {
    expect(factory().findAll('.category-card')).toHaveLength(2)
  })

  it('shows category name', () => {
    expect(factory().findAll('.category-card__name')[0].text()).toBe('Tractoras')
  })

  it('shows listing count', () => {
    expect(factory().findAll('.category-card__volume')[0].text()).toContain('120')
  })

  it('applies active class to selected', () => {
    const w = factory({ selectedCategory: 'tractora' })
    expect(w.findAll('.category-card')[0].classes()).toContain('category-card--active')
  })

  it('shows rising trend class', () => {
    expect(factory().findAll('.category-card__trend')[0].classes()).toContain('category-card__trend--rising')
  })

  it('shows falling trend class', () => {
    expect(factory().findAll('.category-card__trend')[1].classes()).toContain('category-card__trend--falling')
  })

  it('emits select on card click', async () => {
    const w = factory()
    await w.findAll('.category-card')[0].trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['tractora'])
  })
})
