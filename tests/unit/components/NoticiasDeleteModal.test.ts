/**
 * Tests for app/components/admin/noticias/index/NoticiasDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/noticias/index/NoticiasDeleteModal.vue'

const baseTarget = { id: 'n1', title_es: 'Guía de compra de camiones' }

describe('NoticiasDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        visible: true,
        target: { ...baseTarget },
        confirmText: '',
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows when visible', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h3').text()).toBe('admin.news.deleteTitle')
  })

  it('shows article title', () => {
    expect(factory().find('.delete-title').text()).toBe('Guía de compra de camiones')
  })

  it('shows warning', () => {
    expect(factory().find('.delete-warning').exists()).toBe(true)
  })

  it('shows confirm input', () => {
    expect(factory().find('.confirm-input').exists()).toBe(true)
  })

  it('disables delete when confirmText wrong', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when confirmText is borrar', () => {
    const w = factory({ confirmText: 'borrar' })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
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
    const w = factory({ confirmText: 'borrar' })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits confirm on enter key', async () => {
    const w = factory()
    await w.find('.confirm-input').trigger('keydown.enter')
    expect(w.emitted('confirm')).toBeTruthy()
  })
})
