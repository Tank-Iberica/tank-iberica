/**
 * Tests for app/components/admin/comentarios/DeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/comentarios/DeleteModal.vue'

const baseComment = {
  id: 'c-1',
  author_name: 'Juan García',
  content: 'Este es un comentario de prueba para verificar la funcionalidad del modal de eliminación.',
}

describe('ComentariosDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        show: true,
        comment: { ...baseComment },
        actionLoading: null,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders when show=true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides when show=false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows header title', () => {
    expect(factory().find('.modal-header h3').text()).toBe('admin.comments.deleteTitle')
  })

  it('shows author name', () => {
    expect(factory().find('.modal-body').text()).toContain('admin.comments.deleteConfirm')
  })

  it('shows comment preview', () => {
    expect(factory().find('.delete-preview').text()).toContain('comentario de prueba')
  })

  it('truncates long comment content', () => {
    const longContent = 'A'.repeat(200)
    const w = factory({ comment: { ...baseComment, content: longContent } })
    expect(w.find('.delete-preview').text()).toContain('...')
  })

  it('shows fallback for null author', () => {
    const w = factory({ comment: { ...baseComment, author_name: null } })
    expect(w.find('.modal-body').text()).toContain('admin.comments.deleteConfirm')
  })

  it('shows warning message', () => {
    expect(factory().find('.text-warning').exists()).toBe(true)
  })

  it('disables button when loading matches comment id', () => {
    const w = factory({ actionLoading: 'c-1' })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('shows Eliminando text when loading', () => {
    const w = factory({ actionLoading: 'c-1' })
    expect(w.find('.btn-danger').text()).toBe('Eliminando...')
  })

  it('enables button when not loading', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits confirm on delete click', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel on X click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })
})
