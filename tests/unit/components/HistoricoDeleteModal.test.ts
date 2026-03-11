/**
 * Tests for app/components/admin/historico/HistoricoDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/historico/HistoricoDeleteModal.vue'

const baseTarget = { id: 'h1', brand: 'Scania', model: 'R450', sale_price: 75000 }
const fmt = (v: number | null | undefined) => (v != null ? `${v.toLocaleString()} €` : '—')

describe('HistoricoDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        visible: true,
        target: { ...baseTarget },
        confirmText: '',
        canDelete: false,
        saving: false,
        fmt,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows when visible', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.modal-head span').text()).toContain('Eliminar registro')
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('.delete-info').text()).toContain('Scania')
    expect(factory().find('.delete-info').text()).toContain('R450')
  })

  it('shows formatted price', () => {
    expect(factory().find('.delete-info').text()).toContain('75')
  })

  it('shows warning', () => {
    expect(factory().find('.warning').exists()).toBe(true)
  })

  it('shows confirm input', () => {
    const input = factory().find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Borrar')
  })

  it('disables delete when canDelete false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('disables delete when saving', () => {
    const w = factory({ canDelete: true, saving: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when canDelete and not saving', () => {
    const w = factory({ canDelete: true, saving: false })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on X button click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    const cancelBtn = btns.find(b => !b.classes().includes('btn-danger'))
    await cancelBtn!.trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on delete click', async () => {
    const w = factory({ canDelete: true })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits update:confirmText on input', async () => {
    const w = factory()
    const input = w.find('input[type="text"]')
    Object.defineProperty(input.element, 'value', { value: 'Borrar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })
})
