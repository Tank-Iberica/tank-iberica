/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaSettingsSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FacturaSettingsSection from '../../../app/components/dashboard/herramientas/factura/FacturaSettingsSection.vue'

describe('FacturaSettingsSection', () => {
  const filteredVehicles = [
    { id: 'v-1', label: 'Volvo FH16 - 1234ABC' },
    { id: 'v-2', label: 'Scania R450 - 5678DEF' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaSettingsSection, {
      props: {
        invoiceNumber: 'INV-001',
        invoiceDate: '2026-03-01',
        invoiceLanguage: 'es',
        invoiceConditions: 'Net 30',
        vehicleSearch: '',
        showVehicleDropdown: false,
        selectedVehicle: '',
        filteredVehicles: [],
        loadingVehicles: false,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows legend title', () => {
    expect(factory().find('.form-section__legend').text()).toBe('dashboard.tools.invoice.invoiceSettings')
  })

  it('shows invoice number input', () => {
    const inputs = factory().findAll('.form-field__input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('INV-001')
  })

  it('shows invoice date input', () => {
    const inputs = factory().findAll('.form-field__input')
    expect((inputs[1].element as HTMLInputElement).value).toBe('2026-03-01')
  })

  it('shows language select', () => {
    const select = factory().find('.form-field__select')
    expect((select.element as HTMLSelectElement).value).toBe('es')
  })

  it('shows language options', () => {
    expect(factory().find('.form-field__select').findAll('option')).toHaveLength(2)
  })

  it('shows conditions input', () => {
    const inputs = factory().findAll('.form-field__input')
    expect((inputs[2].element as HTMLInputElement).value).toBe('Net 30')
  })

  it('shows vehicle search input', () => {
    const w = factory()
    const autocompleteInput = w.find('.autocomplete-wrapper .form-field__input')
    expect(autocompleteInput.exists()).toBe(true)
  })

  it('emits update on input', async () => {
    const w = factory()
    const inputs = w.findAll('.form-field__input')
    await inputs[0].trigger('input')
    expect(w.emitted('update')).toBeTruthy()
  })

  it('emits update on select change', async () => {
    const w = factory()
    await w.find('.form-field__select').trigger('change')
    expect(w.emitted('update')).toBeTruthy()
  })

  it('emits open-dropdown on vehicle focus', async () => {
    const w = factory()
    const autocompleteInput = w.find('.autocomplete-wrapper .form-field__input')
    await autocompleteInput.trigger('focus')
    expect(w.emitted('open-dropdown')).toBeTruthy()
  })

  it('emits blur-vehicle on vehicle blur', async () => {
    const w = factory()
    const autocompleteInput = w.find('.autocomplete-wrapper .form-field__input')
    await autocompleteInput.trigger('blur')
    expect(w.emitted('blur-vehicle')).toBeTruthy()
  })

  it('hides clear button when no selectedVehicle', () => {
    expect(factory().find('.autocomplete-clear').exists()).toBe(false)
  })

  it('shows clear button when selectedVehicle set', () => {
    const w = factory({ selectedVehicle: 'v-1' })
    expect(w.find('.autocomplete-clear').exists()).toBe(true)
  })

  it('emits clear-vehicle on clear click', async () => {
    const w = factory({ selectedVehicle: 'v-1' })
    await w.find('.autocomplete-clear').trigger('click')
    expect(w.emitted('clear-vehicle')).toBeTruthy()
  })

  it('shows dropdown when open and vehicles available', () => {
    const w = factory({ showVehicleDropdown: true, filteredVehicles })
    expect(w.findAll('.autocomplete-dropdown__item')).toHaveLength(2)
  })

  it('hides dropdown when closed', () => {
    expect(factory().find('.autocomplete-dropdown').exists()).toBe(false)
  })

  it('shows empty dropdown message when no results', () => {
    const w = factory({ showVehicleDropdown: true, vehicleSearch: 'xyz' })
    expect(w.find('.autocomplete-dropdown--empty').exists()).toBe(true)
  })

  it('shows loading indicator', () => {
    const w = factory({ loadingVehicles: true })
    expect(w.find('.autocomplete-loading').exists()).toBe(true)
  })

  it('emits select-vehicle on dropdown item mousedown', async () => {
    const w = factory({ showVehicleDropdown: true, filteredVehicles })
    await w.find('.autocomplete-dropdown__item').trigger('mousedown')
    expect(w.emitted('select-vehicle')?.[0]?.[0]).toEqual({ id: 'v-1', label: 'Volvo FH16 - 1234ABC' })
  })
})
