/**
 * Tests for app/components/admin/comentarios/EmptyState.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import EmptyState from '../../../app/components/admin/comentarios/EmptyState.vue'

describe('CommentsEmptyState', () => {
  const statusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    spam: 'Spam',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(EmptyState, {
      props: {
        activeFilter: null,
        searchQuery: '',
        statusLabels,
        ...overrides,
      },
    })

  it('renders container', () => {
    expect(factory().find('.empty-state-container').exists()).toBe(true)
  })

  it('shows icon', () => {
    expect(factory().find('.empty-icon svg').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.empty-title').text()).toBe('Sin comentarios')
  })

  it('shows default message when no filter or search', () => {
    expect(factory().find('.empty-description').text()).toContain('Aun no se han recibido')
  })

  it('shows filter message when activeFilter set', () => {
    const w = factory({ activeFilter: 'pending' })
    expect(w.find('.empty-description').text()).toContain('Pendiente')
  })

  it('shows search message when searchQuery set', () => {
    const w = factory({ searchQuery: 'test' })
    expect(w.find('.empty-description').text()).toContain('busqueda')
  })

  it('filter message takes priority over search', () => {
    const w = factory({ activeFilter: 'approved', searchQuery: 'test' })
    expect(w.find('.empty-description').text()).toContain('Aprobado')
  })
})
