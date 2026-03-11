/**
 * Tests for app/components/modals/advertise/AdvertiseVehicleTypeSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdvertiseVehicleTypeSection from '../../../app/components/modals/advertise/AdvertiseVehicleTypeSection.vue'

describe('AdvertiseVehicleTypeSection', () => {
  const categories = [
    { id: 'cat-1', name_es: 'Tractora', name_en: 'Tractor', name: null },
    { id: 'cat-2', name_es: 'Remolque', name_en: 'Trailer', name: null },
  ]

  const subcategories = [
    { id: 'sub-1', name_es: 'Cabeza tractora', name_en: 'Tractor head', name: null },
    { id: 'sub-2', name_es: 'Portacontenedores', name_en: 'Container carrier', name: null },
  ]

  const attributes = [
    { id: 'a-1', name: 'potencia', type: 'slider', unit: 'CV', options: { min: 100, max: 1000, step: 50 } },
    { id: 'a-2', name: 'abs', type: 'tick', unit: null, options: null },
    { id: 'a-3', name: 'ejes', type: 'desplegable', unit: null, options: ['2', '3', '4'] },
    { id: 'a-4', name: 'notas', type: 'caja', unit: null, options: null },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdvertiseVehicleTypeSection, {
      props: {
        categories,
        linkedSubcategories: subcategories,
        attributes,
        selectedCategoryId: 'cat-1',
        selectedSubcategoryId: 'sub-1',
        filterValues: {},
        selectorLoading: false,
        filtersLoading: false,
        catName: (item: { name_es: string }) => item.name_es,
        getFilterLabel: (f: { name: string }) => f.name.charAt(0).toUpperCase() + f.name.slice(1),
        getFilterOptions: (f: { options?: string[] }) => f.options || [],
        ...overrides,
      },
    })

  it('renders section fields', () => {
    expect(factory().find('.section-fields').exists()).toBe(true)
  })

  it('renders category select', () => {
    expect(factory().find('#adv-category').exists()).toBe(true)
  })

  it('renders category options + placeholder', () => {
    // 1 placeholder + 2 categories = 3
    expect(factory().findAll('#adv-category option')).toHaveLength(3)
  })

  it('renders subcategory select when category selected', () => {
    expect(factory().find('#adv-subcategory').exists()).toBe(true)
  })

  it('hides subcategory when no category selected', () => {
    const w = factory({ selectedCategoryId: null })
    expect(w.find('#adv-subcategory').exists()).toBe(false)
  })

  it('hides subcategory when no linked subcategories', () => {
    const w = factory({ linkedSubcategories: [] })
    expect(w.find('#adv-subcategory').exists()).toBe(false)
  })

  it('shows filter section when subcategory selected', () => {
    expect(factory().find('.filter-title').exists()).toBe(true)
  })

  it('hides filters when no subcategory', () => {
    const w = factory({ selectedSubcategoryId: null })
    expect(w.find('.filter-title').exists()).toBe(false)
  })

  it('renders slider/calc input for slider type', () => {
    expect(factory().find('#f-potencia[type="number"]').exists()).toBe(true)
  })

  it('renders checkbox for tick type', () => {
    expect(factory().find('.checkbox-input').exists()).toBe(true)
  })

  it('renders select for desplegable type', () => {
    expect(factory().find('#f-ejes').exists()).toBe(true)
  })

  it('renders text input for caja type', () => {
    expect(factory().find('#f-notas[type="text"]').exists()).toBe(true)
  })

  it('shows loading text when filtersLoading', () => {
    const w = factory({ filtersLoading: true })
    expect(w.find('.loading-text').exists()).toBe(true)
  })

  it('disables category select when selectorLoading', () => {
    const w = factory({ selectorLoading: true })
    expect((w.find('#adv-category').element as HTMLSelectElement).disabled).toBe(true)
  })
})
