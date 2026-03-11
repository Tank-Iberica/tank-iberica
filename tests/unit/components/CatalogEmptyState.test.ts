/**
 * Tests for app/components/catalog/CatalogEmptyState.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.stubGlobal('useUserLocation', () => ({
  location: { value: { province: 'León', region: 'Castilla y León', country: 'España' } },
}))

vi.mock('~/composables/catalog/useGeoFallback', () => ({
  useGeoFallback: () => ({
    getLevelLabel: (_level: string, prov?: string) => prov ?? 'España',
  }),
}))

import CatalogEmptyState from '../../../app/components/catalog/CatalogEmptyState.vue'

describe('CatalogEmptyState', () => {
  const defaults = {
    total: 0,
    locationLevel: 'province',
    nextLevel: 'region',
    nextLevelCount: 25,
    suggestions: [] as unknown[],
    suggestionsLoading: false,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CatalogEmptyState, {
      props: { ...defaults, ...overrides },
      global: {
        mocks: { $t: (k: string, params?: Record<string, unknown>) => (params ? `${k}|${JSON.stringify(params)}` : k) },
      },
    })

  it('renders wrapper', () => {
    expect(factory().find('.empty-state-wrap').exists()).toBe(true)
  })

  it('shows zero results mode when total = 0', () => {
    expect(factory().find('.empty-icon-row').exists()).toBe(true)
  })

  it('shows few results mode when total > 0', () => {
    const w = factory({ total: 3 })
    expect(w.find('.few-results-label').exists()).toBe(true)
    expect(w.find('.empty-icon-row').exists()).toBe(false)
  })

  it('shows clear filters button in zero results', () => {
    expect(factory().find('.btn-ghost-sm').exists()).toBe(true)
  })

  it('emits clearFilters on clear click', async () => {
    const w = factory()
    await w.find('.btn-ghost-sm').trigger('click')
    expect(w.emitted('clearFilters')).toHaveLength(1)
  })

  it('shows demand card in zero results', () => {
    expect(factory().find('.demand-card').exists()).toBe(true)
  })

  it('emits openDemand on primary button', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('openDemand')).toHaveLength(1)
  })

  it('emits createAlert on outline button', async () => {
    const w = factory()
    await w.find('.btn-outline').trigger('click')
    expect(w.emitted('createAlert')).toHaveLength(1)
  })

  it('hides suggestions when empty and not loading', () => {
    expect(factory().find('.section-title').exists()).toBe(false)
  })

  it('shows suggestions section when loading', () => {
    const w = factory({ suggestionsLoading: true })
    expect(w.find('.section-title').exists()).toBe(true)
  })

  it('shows skeleton cards when loading without suggestions', () => {
    const w = factory({ suggestionsLoading: true })
    expect(w.findAll('.suggestion-card--skeleton')).toHaveLength(2)
  })

  it('shows suggestion cards', () => {
    const suggestions = [
      { labelKey: 'cat.s1', count: 10, filters: {} },
      { labelKey: 'cat.s2', count: 5, filters: {} },
    ]
    const w = factory({ suggestions })
    expect(w.findAll('.suggestion-card:not(.suggestion-card--skeleton)')).toHaveLength(2)
  })

  it('emits applySuggestion on suggestion click', async () => {
    const filters = { category: 'truck' }
    const suggestions = [{ labelKey: 'cat.s1', count: 10, filters }]
    const w = factory({ suggestions })
    await w.find('.suggestion-card').trigger('click')
    expect(w.emitted('applySuggestion')![0]).toEqual([filters])
  })

  it('shows expand area card when nextLevel exists', () => {
    expect(factory().find('.expand-card').exists()).toBe(true)
  })

  it('hides expand card when nextLevel is null', () => {
    expect(factory({ nextLevel: null }).find('.expand-card').exists()).toBe(false)
  })

  it('disables expand card when loading', () => {
    const w = factory({ nextLevelCountLoading: true })
    expect(w.find('.expand-card').attributes('disabled')).toBeDefined()
  })

  it('emits expandArea on expand click', async () => {
    const w = factory()
    await w.find('.expand-card').trigger('click')
    expect(w.emitted('expandArea')).toHaveLength(1)
  })
})
