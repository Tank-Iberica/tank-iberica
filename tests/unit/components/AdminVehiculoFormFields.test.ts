/**
 * Tests for app/components/admin/vehiculos/AdminVehiculoFormFields.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (item: { name_es: string; name_en?: string | null }, locale: string) =>
    locale === 'en' && item.name_en ? item.name_en : item.name_es,
}))

import AdminVehiculoFormFields from '../../../app/components/admin/vehiculos/AdminVehiculoFormFields.vue'

const baseForm = {
  category: 'venta',
  brand: 'Scania',
  model: 'R450',
  year: 2022,
  plate: '1234-ABC',
  price: 85000,
  rental_price: 2500,
  type_id: 't1',
  location_country: 'ES',
  location_region: 'Andalucía',
  location_province: 'Sevilla',
  location: 'Polígono Industrial',
  description_es: 'Descripción ES',
  description_en: 'Description EN',
  acquisition_cost: 70000,
  min_price: 75000,
  attributes_json: {},
}

const categoryOptions = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'venta_alquiler', label: 'Venta y Alquiler' },
]

const subcategories = [
  { id: 's1', name_es: 'Camiones', name_en: 'Trucks', status: 'active' },
]

const types = [
  { id: 't1', name_es: 'Rígido', name_en: 'Rigid', status: 'active' },
]

describe('AdminVehiculoFormFields', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiculoFormFields, {
      props: {
        form: { ...baseForm },
        categoryOptions,
        subcategories,
        selectedSubcategoryId: 's1',
        types,
        locale: 'es',
        ...overrides,
      },
    })

  it('renders category section', () => {
    const titles = factory().findAll('.section-title')
    expect(titles[0].text()).toBe('admin.vehicleForm.categorySection')
  })

  it('renders 3 category buttons', () => {
    expect(factory().findAll('.category-btn')).toHaveLength(3)
  })

  it('shows active class on selected category', () => {
    expect(factory().findAll('.category-btn')[0].classes()).toContain('active')
  })

  it('renders subcategory select', () => {
    const selects = factory().findAll('select')
    // subcategory + type + country
    expect(selects.length).toBeGreaterThanOrEqual(3)
  })

  it('renders type select with options', () => {
    const selects = factory().findAll('select')
    // type is the second select
    const typeOptions = selects[1].findAll('option')
    // placeholder + 1 type
    expect(typeOptions).toHaveLength(2)
  })

  it('renders brand input', () => {
    const brandInput = factory().find('input[required]')
    expect((brandInput.element as HTMLInputElement).value).toBe('Scania')
  })

  it('renders basic info section', () => {
    const titles = factory().findAll('.section-title')
    expect(titles[1].text()).toBe('admin.vehicleForm.basicInfo')
  })

  it('renders prices section', () => {
    const titles = factory().findAll('.section-title')
    expect(titles[2].text()).toBe('admin.vehicleForm.pricesSection')
  })

  it('renders location section', () => {
    const titles = factory().findAll('.section-title')
    expect(titles[3].text()).toBe('admin.vehicleForm.locationSection')
  })

  it('renders description section', () => {
    const titles = factory().findAll('.section-title')
    expect(titles[4].text()).toBe('admin.vehicleForm.descriptionSection')
  })

  it('renders contabilidad section', () => {
    const titles = factory().findAll('.section-title')
    expect(titles[5].text()).toBe('admin.vehicleForm.accountingSection')
  })

  it('shows sale price when category is venta', () => {
    // category = venta, should show sale price, hide rental
    const w = factory()
    const numberInputs = w.findAll('input[type="number"]')
    expect(numberInputs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders description textareas', () => {
    const textareas = factory().findAll('textarea')
    expect(textareas).toHaveLength(2)
    expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Descripción ES')
    expect((textareas[1].element as HTMLTextAreaElement).value).toBe('Description EN')
  })

  it('shows char count', () => {
    const counts = factory().findAll('.char-count')
    expect(counts[0].text()).toContain('/300')
  })

  it('renders country select with 4 countries', () => {
    // country select has placeholder + 4 countries
    const countrySelect = factory().findAll('select')[2]
    const options = countrySelect.findAll('option')
    expect(options).toHaveLength(5)
  })

  it('emits update:form on category button click', async () => {
    const w = factory()
    await w.findAll('.category-btn')[1].trigger('click')
    expect(w.emitted('update:form')).toBeTruthy()
    const emitted = w.emitted('update:form')![0][0] as typeof baseForm
    expect(emitted.category).toBe('alquiler')
  })

  it('emits update:selectedSubcategoryId on subcategory change', async () => {
    const w = factory()
    await w.findAll('select')[0].trigger('change')
    expect(w.emitted('update:selectedSubcategoryId')).toBeTruthy()
  })

  it('emits update:form on brand input', async () => {
    const w = factory()
    await w.find('input[required]').trigger('input')
    expect(w.emitted('update:form')).toBeTruthy()
  })
})
