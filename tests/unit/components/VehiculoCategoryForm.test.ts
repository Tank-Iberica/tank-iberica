/**
 * Tests for app/components/dashboard/vehiculos/VehiculoCategoryForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VehiculoCategoryForm from '../../../app/components/dashboard/vehiculos/VehiculoCategoryForm.vue'

const categories = [
  { id: 'cat1', slug: 'venta', name: { es: 'Venta', en: 'Sale' } },
  { id: 'cat2', slug: 'alquiler', name: { es: 'Alquiler', en: 'Rent' } },
]

const subcategories = [
  { id: 'sub1', slug: 'camiones', name: { es: 'Camiones', en: 'Trucks' } },
  { id: 'sub2', slug: 'remolques', name: { es: 'Remolques', en: 'Trailers' } },
]

describe('VehiculoCategoryForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VehiculoCategoryForm, {
      props: {
        categoryId: 'cat1',
        subcategoryId: 'sub1',
        categories,
        filteredSubcategories: subcategories,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('renders category select', () => {
    expect(factory().find('#category').exists()).toBe(true)
  })

  it('renders subcategory select', () => {
    expect(factory().find('#subcategory').exists()).toBe(true)
  })

  it('shows category options (2 + placeholder)', () => {
    expect(factory().find('#category').findAll('option')).toHaveLength(3)
  })

  it('shows subcategory options (2 + placeholder)', () => {
    expect(factory().find('#subcategory').findAll('option')).toHaveLength(3)
  })

  it('uses name.es for category label', () => {
    const opts = factory().find('#category').findAll('option')
    expect(opts[1].text()).toBe('Venta')
  })

  it('uses name.es for subcategory label', () => {
    const opts = factory().find('#subcategory').findAll('option')
    expect(opts[1].text()).toBe('Camiones')
  })

  it('sets selected category value', () => {
    expect((factory().find('#category').element as HTMLSelectElement).value).toBe('cat1')
  })

  it('sets selected subcategory value', () => {
    expect((factory().find('#subcategory').element as HTMLSelectElement).value).toBe('sub1')
  })
})
