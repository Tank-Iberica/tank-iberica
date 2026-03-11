/**
 * Tests for app/components/admin/noticias/index/NoticiasTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NoticiasTable from '../../../app/components/admin/noticias/index/NoticiasTable.vue'

describe('NoticiasTable', () => {
  const sortedNews = [
    {
      id: 'n-1',
      title_es: 'Mercado de tractoras crece',
      slug: 'mercado-tractoras-crece',
      category: 'mercado',
      status: 'published',
      views: 1500,
      published_at: '2026-03-01',
      created_at: '2026-02-28',
    },
    {
      id: 'n-2',
      title_es: 'Nuevas normativas Euro 7',
      slug: 'nuevas-normativas-euro-7',
      category: 'regulacion',
      status: 'draft',
      views: 0,
      published_at: null,
      created_at: '2026-03-02',
    },
  ]

  const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NoticiasTable, {
      props: {
        sortedNews,
        hasActiveFilters: false,
        categoryLabels: { mercado: 'Mercado', regulacion: 'Regulación' } as Record<string, string>,
        getSortIcon: () => '↕',
        getSeoScore: () => ({ score: 75, level: 'good' as const }),
        formatDate: (d: string | null) => d || '—',
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders data table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 7 headers', () => {
    expect(factory().findAll('th')).toHaveLength(7)
  })

  it('renders news rows', () => {
    expect(factory().findAll('.news-row')).toHaveLength(2)
  })

  it('shows news title', () => {
    expect(factory().find('.news-title').text()).toBe('Mercado de tractoras crece')
  })

  it('shows slug', () => {
    expect(factory().find('.slug-text').text()).toContain('mercado-tractoras-crece')
  })

  it('shows category pill', () => {
    expect(factory().find('.cat-pill').text()).toBe('Mercado')
  })

  it('shows status select with options', () => {
    expect(factory().find('.status-select').exists()).toBe(true)
    // 3 options × 2 rows = 6
    expect(factory().findAll('.status-select option')).toHaveLength(6)
  })

  it('shows views count', () => {
    expect(factory().text()).toContain('1500')
  })

  it('shows SEO badge', () => {
    expect(factory().find('.seo-badge').text()).toBe('75')
  })

  it('shows action buttons per row', () => {
    expect(factory().findAll('.action-delete')).toHaveLength(2)
  })

  it('emits navigate on row click', async () => {
    const w = factory()
    await w.find('.news-row').trigger('click')
    expect(w.emitted('navigate')).toBeTruthy()
  })

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.action-delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows empty state when no news', () => {
    const w = factory({ sortedNews: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('shows filter hint in empty state with active filters', () => {
    const w = factory({ sortedNews: [], hasActiveFilters: true })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
