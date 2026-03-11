/**
 * Tests for app/components/admin/comentarios/EmptyState.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import EmptyState from '../../../app/components/admin/comentarios/EmptyState.vue'

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam'

const statusLabels: Record<CommentStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  spam: 'Spam',
}

describe('EmptyState (comentarios)', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(EmptyState, {
      props: {
        activeFilter: null,
        searchQuery: '',
        statusLabels,
        ...overrides,
      },
    })

  it('renders empty state container', () => {
    const w = factory()
    expect(w.find('.empty-state-container').exists()).toBe(true)
  })

  it('shows "Sin comentarios" title', () => {
    const w = factory()
    expect(w.find('.empty-title').text()).toBe('Sin comentarios')
  })

  it('shows SVG icon', () => {
    const w = factory()
    expect(w.find('.empty-icon svg').exists()).toBe(true)
  })

  it('shows default message when no filter and no search', () => {
    const w = factory()
    expect(w.find('.empty-description').text()).toBe('Aun no se han recibido comentarios.')
  })

  it('shows filter message when activeFilter is set', () => {
    const w = factory({ activeFilter: 'pending' })
    expect(w.find('.empty-description').text()).toContain('Pendiente')
  })

  it('shows search message when searchQuery is set', () => {
    const w = factory({ searchQuery: 'test query' })
    expect(w.find('.empty-description').text()).toContain('busqueda')
  })

  it('prioritizes activeFilter message over searchQuery', () => {
    const w = factory({ activeFilter: 'approved', searchQuery: 'some query' })
    expect(w.find('.empty-description').text()).toContain('Aprobado')
  })
})
