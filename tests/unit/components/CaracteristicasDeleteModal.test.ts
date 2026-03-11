/**
 * Tests for app/components/admin/config/caracteristicas/CaracteristicasDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CaracteristicasDeleteModal from '../../../app/components/admin/config/caracteristicas/CaracteristicasDeleteModal.vue'

describe('CaracteristicasDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CaracteristicasDeleteModal, {
      props: {
        show: true,
        filter: { id: '1', name: 'ABS', label_es: 'ABS' },
        confirmText: '',
        saving: false,
        canDelete: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows filter label', () => {
    expect(factory().text()).toContain('ABS')
  })

  it('disables delete button when canDelete is false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('emits close on cancel', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on delete', async () => {
    const w = factory({ canDelete: true })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('shows error when confirmText present but canDelete false', () => {
    expect(factory({ confirmText: 'wrong' }).find('.text-error').exists()).toBe(true)
  })

  it('shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-danger').text()).toBe('Eliminando...')
  })
})
