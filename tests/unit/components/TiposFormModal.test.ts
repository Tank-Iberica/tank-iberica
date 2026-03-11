/**
 * Tests for app/components/admin/config/tipos/TiposFormModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TiposFormModal from '../../../app/components/admin/config/tipos/TiposFormModal.vue'

const baseFormData = {
  name_es: 'Cisternas',
  name_en: 'Tankers',
  subcategory_ids: ['sub1'],
  applicable_filters: ['f1'],
  status: 'published',
}

const filters = [
  { id: 'f1', name: 'ADR', label_es: 'ADR' },
]

const subcategories = [
  { id: 'sub1', name_es: 'Camiones' },
  { id: 'sub2', name_es: 'Remolques' },
]

describe('TiposFormModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TiposFormModal, {
      props: {
        show: true,
        editingId: null,
        formData: { ...baseFormData },
        saving: false,
        availableFilters: filters,
        availableSubcategories: subcategories,
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
    expect(factory().find('h3').text()).toBe('admin.configTipos.newType')
  })

  it('shows edit title when editing', () => {
    expect(factory({ editingId: 'x' }).find('h3').text()).toBe('admin.configTipos.editType')
  })

  it('renders name ES input', () => {
    expect((factory().find('#name_es').element as HTMLInputElement).value).toBe('Cisternas')
  })

  it('renders name EN input', () => {
    expect((factory().find('#name_en').element as HTMLInputElement).value).toBe('Tankers')
  })

  it('renders subcategory checkboxes', () => {
    const checkboxes = factory().findAll('.subcategories-checkbox-grid input[type="checkbox"]')
    expect(checkboxes).toHaveLength(2)
  })

  it('checks active subcategories', () => {
    const checkboxes = factory().findAll('.subcategories-checkbox-grid input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('shows empty subcategories message when none', () => {
    const w = factory({ availableSubcategories: [] })
    expect(w.find('.text-muted').exists()).toBe(true)
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

  it('emits toggleArrayItem on subcategory change', async () => {
    const w = factory()
    const checkboxes = w.findAll('.subcategories-checkbox-grid input[type="checkbox"]')
    await checkboxes[1].trigger('change')
    expect(w.emitted('toggleArrayItem')?.[0]).toEqual(['subcategory_ids', 'sub2'])
  })
})
