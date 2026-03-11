/**
 * Tests for app/components/admin/productos/nuevo/NuevoBasicData.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (item: { name_es: string; name_en?: string | null }, locale: string) =>
    locale === 'en' && item.name_en ? item.name_en : item.name_es,
}))

import NuevoBasicData from '../../../app/components/admin/productos/nuevo/NuevoBasicData.vue'

const subcategories = [
  { id: 's1', name_es: 'Camiones', name_en: 'Trucks', status: 'active' },
  { id: 's2', name_es: 'Remolques', name_en: 'Trailers', status: 'active' },
]
const types = [
  { id: 't1', name_es: 'Rígido', name_en: 'Rigid', status: 'active' },
]

describe('NuevoBasicData', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoBasicData, {
      props: {
        selectedSubcategoryId: 's1',
        subcategories,
        typeId: 't1',
        types,
        brand: 'Scania',
        model: 'R450',
        year: 2022,
        plate: '1234-ABC',
        price: 85000,
        rentalPrice: 2500,
        showRentalPrice: true,
        location: 'Madrid, España',
        locationEn: 'Madrid, Spain',
        locationCountry: 'España',
        locationProvince: 'Madrid',
        locationRegion: 'Comunidad de Madrid',
        countryFlagFn: (c: string) => c === 'España' ? '🇪🇸' : '🏳️',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().find('.section-title').text()).toBe('Datos del vehiculo')
  })

  it('renders subcategory select with options', () => {
    const options = factory().findAll('select')[0].findAll('option')
    // 1 placeholder + 2 subcategories
    expect(options).toHaveLength(3)
  })

  it('renders type select with options', () => {
    const options = factory().findAll('select')[1].findAll('option')
    // 1 placeholder + 1 type
    expect(options).toHaveLength(2)
  })

  it('renders brand input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Scania')
  })

  it('renders model input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[1].element as HTMLInputElement).value).toBe('R450')
  })

  it('renders year input', () => {
    const input = factory().find('input[type="number"]')
    expect((input.element as HTMLInputElement).value).toBe('2022')
  })

  it('renders plate input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[2].element as HTMLInputElement).value).toBe('1234-ABC')
  })

  it('renders price input', () => {
    const numbers = factory().findAll('input[type="number"]')
    expect((numbers[1].element as HTMLInputElement).value).toBe('85000')
  })

  it('shows rental price when showRentalPrice is true', () => {
    const numbers = factory().findAll('input[type="number"]')
    expect(numbers.length).toBeGreaterThanOrEqual(3)
    expect((numbers[2].element as HTMLInputElement).value).toBe('2500')
  })

  it('hides rental price when showRentalPrice is false', () => {
    const w = factory({ showRentalPrice: false })
    const numbers = w.findAll('input[type="number"]')
    // year + price only (no rental)
    expect(numbers).toHaveLength(2)
  })

  it('renders location ES input', () => {
    const inputs = factory().findAll('input[type="text"]')
    // brand, model, plate, location ES, location EN
    expect((inputs[3].element as HTMLInputElement).value).toBe('Madrid, España')
  })

  it('renders location EN input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[4].element as HTMLInputElement).value).toBe('Madrid, Spain')
  })

  it('shows detected country info', () => {
    const detected = factory().find('.location-detected')
    expect(detected.exists()).toBe(true)
    expect(detected.text()).toContain('España')
    expect(detected.text()).toContain('Madrid')
  })

  it('hides country info when no country', () => {
    const w = factory({ locationCountry: null })
    expect(w.find('.location-detected').exists()).toBe(false)
  })

  it('shows country flag', () => {
    expect(factory().find('.location-detected').text()).toContain('🇪🇸')
  })

  it('emits update:brand on input', async () => {
    const w = factory()
    const inputs = w.findAll('input[type="text"]')
    await inputs[0].trigger('input')
    expect(w.emitted('update:brand')).toBeTruthy()
  })

  it('emits update:model on input', async () => {
    const w = factory()
    const inputs = w.findAll('input[type="text"]')
    await inputs[1].trigger('input')
    expect(w.emitted('update:model')).toBeTruthy()
  })

  it('emits update:selectedSubcategoryId on change', async () => {
    const w = factory()
    await w.findAll('select')[0].trigger('change')
    expect(w.emitted('update:selectedSubcategoryId')).toBeTruthy()
  })

  it('emits update:typeId on change', async () => {
    const w = factory()
    await w.findAll('select')[1].trigger('change')
    expect(w.emitted('update:typeId')).toBeTruthy()
  })
})
