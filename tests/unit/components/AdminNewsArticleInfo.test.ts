/**
 * Tests for app/components/admin/noticias/AdminNewsArticleInfo.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsArticleInfo from '../../../app/components/admin/noticias/AdminNewsArticleInfo.vue'

describe('AdminNewsArticleInfo', () => {
  const article = {
    id: 'art-123',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-02-15T12:00:00Z',
    published_at: '2026-01-05T08:00:00Z',
    views: 42,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsArticleInfo, {
      props: {
        article,
        open: true,
        formatDate: (d: string | null) => d ?? '-',
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows toggle button text', () => {
    expect(factory().find('.section-toggle').text()).toContain('admin.news.articleInfo')
  })

  it('shows minus icon when open', () => {
    expect(factory().find('.toggle-icon').text()).toBe('−')
  })

  it('shows plus icon when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.toggle-icon').text()).toBe('+')
  })

  it('shows info grid when open', () => {
    expect(factory().find('.info-grid').exists()).toBe(true)
  })

  it('hides info grid when closed', () => {
    expect(factory({ open: false }).find('.info-grid').exists()).toBe(false)
  })

  it('shows article dates', () => {
    const text = factory().text()
    expect(text).toContain('2026-01-01T10:00:00Z')
    expect(text).toContain('2026-02-15T12:00:00Z')
    expect(text).toContain('2026-01-05T08:00:00Z')
  })

  it('shows views count', () => {
    expect(factory().text()).toContain('42')
  })

  it('shows article id', () => {
    expect(factory().find('.info-mono').text()).toBe('art-123')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')![0]).toEqual([false])
  })
})
