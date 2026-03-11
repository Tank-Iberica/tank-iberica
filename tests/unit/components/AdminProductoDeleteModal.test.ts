/**
 * Tests for app/components/admin/productos/AdminProductoDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/productos/AdminProductoDeleteModal.vue'

describe('AdminProductoDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        show: true,
        vehicleBrand: 'MAN',
        vehicleModel: 'TGX',
        deleteConfirm: '',
        canDelete: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows when show is true', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.modal-head span').text()).toContain('Eliminar')
  })

  it('shows vehicle info', () => {
    const html = factory().html()
    expect(html).toContain('MAN')
    expect(html).toContain('TGX')
  })

  it('shows warning', () => {
    expect(factory().find('.warn').exists()).toBe(true)
  })

  it('shows confirm input', () => {
    expect(factory().find('input[type="text"]').exists()).toBe(true)
  })

  it('disables delete when canDelete is false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when canDelete is true', () => {
    const w = factory({ canDelete: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits update:show false on overlay click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('update:show')?.[0]).toEqual([false])
  })

  it('emits update:show false on X click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('update:show')?.[0]).toEqual([false])
  })

  it('emits update:show false on cancel click', async () => {
    const w = factory()
    const btns = w.findAll('.btn')
    const cancelBtn = btns.find(b => !b.classes().includes('btn-danger'))
    await cancelBtn!.trigger('click')
    expect(w.emitted('update:show')?.[0]).toEqual([false])
  })

  it('emits delete on delete click', async () => {
    const w = factory({ canDelete: true })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('emits update:deleteConfirm on input', async () => {
    const w = factory()
    const input = w.find('input[type="text"]')
    Object.defineProperty(input.element, 'value', { value: 'BORRAR', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:deleteConfirm')).toBeTruthy()
  })
})
