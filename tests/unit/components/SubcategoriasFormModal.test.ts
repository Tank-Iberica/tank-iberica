/**
 * Tests for app/components/admin/config/subcategorias/SubcategoriasFormModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SubcategoriasFormModal from '../../../app/components/admin/config/subcategorias/SubcategoriasFormModal.vue'

const baseFormData = {
  name_es: 'Camiones',
  name_en: 'Trucks',
  applicable_categories: ['cat1'],
  applicable_filters: ['f1'],
  status: 'published',
}

const filters = [
  { id: 'f1', name: 'Peso', label_es: 'Peso' },
  { id: 'f2', name: 'Potencia', label_es: 'Potencia' },
]

const categories = [
  { id: 'cat1', label: 'Venta' },
  { id: 'cat2', label: 'Alquiler' },
]

describe('SubcategoriasFormModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubcategoriasFormModal, {
      props: {
        show: true,
        editingId: null,
        formData: { ...baseFormData },
        saving: false,
        error: null,
        availableFilters: filters,
        vehicleCategories: categories,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows create title', () => {
    expect(factory().find('h3').text()).toBe('Nueva Subcategoria')
  })

  it('shows edit title when editing', () => {
    expect(factory({ editingId: 'x' }).find('h3').text()).toBe('Editar Subcategoria')
  })

  it('renders name ES input', () => {
    expect((factory().find('#name_es').element as HTMLInputElement).value).toBe('Camiones')
  })

  it('renders name EN input', () => {
    expect((factory().find('#name_en').element as HTMLInputElement).value).toBe('Trucks')
  })

  it('shows error when set', () => {
    const w = factory({ error: 'Duplicate name' })
    expect(w.find('.modal-error').text()).toBe('Duplicate name')
  })

  it('hides error when null', () => {
    expect(factory().find('.modal-error').exists()).toBe(false)
  })

  it('renders category checkboxes', () => {
    const checkboxes = factory().findAll('.categories-checkbox-grid input[type="checkbox"]')
    expect(checkboxes).toHaveLength(2)
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits toggleArrayItem on category checkbox change', async () => {
    const w = factory()
    const checkboxes = w.findAll('.categories-checkbox-grid input[type="checkbox"]')
    await checkboxes[1].trigger('change')
    expect(w.emitted('toggleArrayItem')?.[0]).toEqual(['applicable_categories', 'cat2'])
  })
})
