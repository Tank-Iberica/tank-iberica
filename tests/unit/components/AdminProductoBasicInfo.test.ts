/**
 * Tests for app/components/admin/productos/AdminProductoBasicInfo.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (obj: { name?: Record<string, string> | null; name_es: string }, locale: string) =>
    obj?.name?.[locale] || obj?.name_es || '',
}))

import { shallowMount } from '@vue/test-utils'
import AdminProductoBasicInfo from '../../../app/components/admin/productos/AdminProductoBasicInfo.vue'

const subcategories = [
  { id: 's1', name: { es: 'Tractoras', en: 'Tractors' }, name_es: 'Tractoras', status: 'active' },
]
const types = [
  { id: 't1', name: { es: 'Cabeza tractora', en: 'Tractor unit' }, name_es: 'Cabeza tractora', status: 'active' },
]

describe('AdminProductoBasicInfo', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoBasicInfo, {
      props: {
        categories: ['venta'],
        featured: false,
        selectedSubcategoryId: null,
        subcategories,
        typeId: null,
        types,
        brand: 'Scania',
        model: 'R450',
        year: 2022,
        plate: '1234-ABC',
        price: 85000,
        rentalPrice: null,
        showRentalPrice: false,
        location: 'Madrid, España',
        locationEn: 'Madrid, Spain',
        locationCountry: 'España',
        locationProvince: 'Madrid',
        locationRegion: 'Comunidad de Madrid',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders sections', () => {
    expect(factory().findAll('.section')).toHaveLength(2)
  })

  it('shows category checkboxes', () => {
    expect(factory().findAll('.cat-check')).toHaveLength(3)
  })

  it('marks active category', () => {
    expect(factory().findAll('.cat-check')[0].classes()).toContain('active')
  })

  it('shows featured checkbox', () => {
    expect(factory().find('.feat-check').exists()).toBe(true)
  })

  it('emits update:categories on toggle', async () => {
    const w = factory()
    await w.findAll('.cat-check input')[1].trigger('change')
    expect(w.emitted('update:categories')?.[0]).toEqual([['venta', 'alquiler']])
  })

  it('emits update:categories removing existing', async () => {
    const w = factory()
    await w.findAll('.cat-check input')[0].trigger('change')
    expect(w.emitted('update:categories')?.[0]).toEqual([[]])
  })

  it('emits update:featured on toggle', async () => {
    const w = factory()
    await w.find('.feat-check input').trigger('change')
    expect(w.emitted('update:featured')?.[0]).toEqual([true])
  })

  it('shows brand input with value', () => {
    const html = factory().html()
    expect(html).toContain('Scania')
  })

  it('shows model input with value', () => {
    expect(factory().html()).toContain('R450')
  })

  it('shows subcategory select with options', () => {
    const html = factory().html()
    expect(html).toContain('Tractoras')
  })

  it('shows type select with options', () => {
    expect(factory().html()).toContain('Cabeza tractora')
  })

  it('shows location country flag', () => {
    expect(factory().find('.location-detected').text()).toContain('🇪🇸')
  })

  it('shows province and region', () => {
    const loc = factory().find('.location-detected').text()
    expect(loc).toContain('Madrid')
    expect(loc).toContain('Comunidad de Madrid')
  })

  it('hides rental price when showRentalPrice is false', () => {
    const labels = factory().findAll('.field label')
    const texts = labels.map((l) => l.text())
    expect(texts.some((t) => t.includes('Alquiler'))).toBe(false)
  })

  it('shows rental price when showRentalPrice is true', () => {
    const w = factory({ showRentalPrice: true })
    const labels = w.findAll('.field label')
    const texts = labels.map((l) => l.text())
    expect(texts.some((t) => t.includes('admin.productos.basicInfo.rentalPriceMonth'))).toBe(true)
  })
})
