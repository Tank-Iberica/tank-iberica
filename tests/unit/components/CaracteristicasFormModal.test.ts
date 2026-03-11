/**
 * Tests for app/components/admin/config/caracteristicas/CaracteristicasFormModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import CaracteristicasFormModal from '../../../app/components/admin/config/caracteristicas/CaracteristicasFormModal.vue'

const baseFormData = {
  name: 'Volumen',
  label_en: 'Volume',
  type: 'slider' as const,
  unit: 'L',
  default_value: '',
  extra_filters: [] as string[],
  hides: [] as string[],
  choices: ['A', 'B'],
  choices_source: 'manual' as const,
  step: 1,
  status: 'active' as const,
}

const filterTypes = [
  { value: 'slider' as const, label: 'Slider', description: 'Rango' },
  { value: 'desplegable' as const, label: 'Desplegable', description: 'Lista' },
  { value: 'tick' as const, label: 'Tick', description: 'Si/No' },
]

const filterStatuses = [
  { value: 'active' as const, label: 'Activo', description: 'Visible' },
  { value: 'hidden' as const, label: 'Oculto', description: 'No visible' },
]

const availableFilters = [
  { id: 'f1', name: 'ADR', label_es: 'ADR' },
  { id: 'f2', name: 'Grua', label_es: 'Grúa' },
]

describe('CaracteristicasFormModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CaracteristicasFormModal, {
      props: {
        show: true,
        editingId: null,
        formData: { ...baseFormData },
        choiceInput: '',
        saving: false,
        showTickOptions: false,
        showChoicesOptions: true,
        showCalcOptions: false,
        showSliderInfo: false,
        availableFiltersForSelection: availableFilters,
        filterTypes,
        filterStatuses,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows create title', () => {
    expect(factory().find('h3').text()).toBe('admin.config.newCharacteristic')
  })

  it('shows edit title when editing', () => {
    expect(factory({ editingId: 'x' }).find('h3').text()).toBe('admin.config.editCharacteristic')
  })

  it('renders name input', () => {
    expect((factory().find('#name').element as HTMLInputElement).value).toBe('Volumen')
  })

  it('renders label_en input', () => {
    expect((factory().find('#label_en').element as HTMLInputElement).value).toBe('Volume')
  })

  it('renders type select with options', () => {
    const options = factory().find('#type').findAll('option')
    // 1 placeholder + 3 types
    expect(options).toHaveLength(4)
  })

  it('renders unit input', () => {
    expect((factory().find('#unit').element as HTMLInputElement).value).toBe('L')
  })

  it('renders default value input', () => {
    expect(factory().find('#default_value').exists()).toBe(true)
  })

  it('renders status select', () => {
    const options = factory().find('#status').findAll('option')
    expect(options).toHaveLength(2)
  })

  it('shows choices section when showChoicesOptions', () => {
    expect(factory().find('.type-options-section').exists()).toBe(true)
  })

  it('hides choices section when not showChoicesOptions', () => {
    const w = factory({ showChoicesOptions: false })
    expect(w.find('.type-options-title').exists()).toBe(false)
  })

  it('shows 3 source radios', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
  })

  it('shows choice chips', () => {
    expect(factory().findAll('.choice-chip')).toHaveLength(2)
  })

  it('shows tick options when showTickOptions', () => {
    const w = factory({ showTickOptions: true })
    expect(w.find('.extra-grid').exists()).toBe(true)
    expect(w.find('.hide-grid').exists()).toBe(true)
  })

  it('shows calc options when showCalcOptions', () => {
    const w = factory({ showCalcOptions: true })
    expect(w.find('#step').exists()).toBe(true)
  })

  it('shows slider info when showSliderInfo', () => {
    const w = factory({ showSliderInfo: true })
    expect(w.find('.type-options-info').exists()).toBe(true)
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on save click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('disables save when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows saving text when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('Guardando...')
  })

  it('shows save text when not saving', () => {
    expect(factory().find('.btn-primary').text()).toBe('Guardar')
  })

  it('emits add-choice on add click', async () => {
    const w = factory()
    await w.find('.btn-add-choice').trigger('click')
    expect(w.emitted('add-choice')).toBeTruthy()
  })

  it('emits remove-choice on chip remove', async () => {
    const w = factory()
    await w.find('.choice-remove').trigger('click')
    expect(w.emitted('remove-choice')?.[0]?.[0]).toBe(0)
  })

  it('shows available filter checkboxes for tick options', () => {
    const w = factory({ showTickOptions: true })
    const checkboxes = w.findAll('.checkbox-label')
    // 2 filters × 2 grids (extra + hide)
    expect(checkboxes).toHaveLength(4)
  })
})
