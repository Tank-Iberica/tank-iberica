/**
 * Tests for app/components/admin/noticias/index/NoticiasToolbar.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NoticiasToolbar from '../../../app/components/admin/noticias/index/NoticiasToolbar.vue'

describe('NoticiasToolbar', () => {
  const statusOptions = [
    { value: null, label: 'Todos' },
    { value: 'published', label: 'Publicados' },
    { value: 'draft', label: 'Borradores' },
  ]

  const categoryOptions = [
    { value: null, label: 'Todas' },
    { value: 'noticias', label: 'Noticias' },
    { value: 'guias', label: 'Guias' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NoticiasToolbar, {
      props: {
        filters: { search: '', status: null, category: null },
        statusOptions,
        categoryOptions,
        hasActiveFilters: false,
        ...overrides,
      },
    })

  it('renders toolbar', () => {
    expect(factory().find('.toolbar').exists()).toBe(true)
  })

  it('shows search input', () => {
    expect(factory().find('.search-input').exists()).toBe(true)
  })

  it('shows category select with options', () => {
    const selects = factory().findAll('.filter-select')
    expect(selects[0].findAll('option')).toHaveLength(3)
  })

  it('shows status select with options', () => {
    const selects = factory().findAll('.filter-select')
    expect(selects[1].findAll('option')).toHaveLength(3)
  })

  it('hides clear button when no active filters', () => {
    expect(factory().find('.btn').exists()).toBe(false)
  })

  it('shows clear button when has active filters', () => {
    const w = factory({ hasActiveFilters: true })
    expect(w.find('.btn').text()).toBe('Limpiar')
  })

  it('emits update:search on input', async () => {
    const w = factory()
    await w.find('.search-input').trigger('input')
    expect(w.emitted('update:search')).toBeTruthy()
  })

  it('emits update:category on category change', async () => {
    const w = factory()
    const selects = w.findAll('.filter-select')
    await selects[0].trigger('change')
    expect(w.emitted('update:category')).toBeTruthy()
  })

  it('emits update:status on status change', async () => {
    const w = factory()
    const selects = w.findAll('.filter-select')
    await selects[1].trigger('change')
    expect(w.emitted('update:status')).toBeTruthy()
  })

  it('emits clear-filters on clear click', async () => {
    const w = factory({ hasActiveFilters: true })
    await w.find('.btn').trigger('click')
    expect(w.emitted('clear-filters')).toBeTruthy()
  })
})
