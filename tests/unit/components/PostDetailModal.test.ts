/**
 * Tests for app/components/admin/social/PostDetailModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import PostDetailModal from '../../../app/components/admin/social/PostDetailModal.vue'

const basePost = {
  id: 'post1',
  platform: 'facebook',
  status: 'pending',
  content_es: 'Contenido ES',
  content_en: 'Content EN',
  image_url: 'https://img.test/photo.jpg',
  created_at: '2026-01-15T10:00:00Z',
  approved_at: null as string | null,
  posted_at: null as string | null,
  external_post_id: null as string | null,
  rejection_reason: null as string | null,
  impressions: 0,
  clicks: 0,
}

describe('PostDetailModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PostDetailModal, {
      props: {
        show: true,
        post: { ...basePost },
        vehicleTitle: 'Scania R450',
        platformLabel: 'Facebook',
        platformClass: 'platform-facebook',
        statusClass: 'status-pending',
        statusLabel: 'Pendiente',
        editLocale: 'es' as const,
        editContent: 'Contenido ES',
        rejectionReason: '',
        actionLoading: false,
        formatDate: (d: string | null) => d || '-',
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: { $t: (k: string) => k },
      },
    })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('hides when post is null', () => {
    expect(factory({ post: null }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows when show is true and post exists', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.modal-vehicle').text()).toBe('Scania R450')
  })

  it('shows platform label', () => {
    expect(factory().html()).toContain('Facebook')
  })

  it('shows status label', () => {
    expect(factory().html()).toContain('Pendiente')
  })

  it('shows image when post has image_url', () => {
    expect(factory().find('.modal-image img').exists()).toBe(true)
  })

  it('hides image when no image_url', () => {
    const w = factory({ post: { ...basePost, image_url: null } })
    expect(w.find('.modal-image').exists()).toBe(false)
  })

  it('renders 2 locale tabs', () => {
    expect(factory().findAll('.locale-tab')).toHaveLength(2)
  })

  it('marks ES tab active', () => {
    expect(factory().findAll('.locale-tab')[0].classes()).toContain('active')
  })

  it('marks EN tab active when editLocale is en', () => {
    const w = factory({ editLocale: 'en' })
    expect(w.findAll('.locale-tab')[1].classes()).toContain('active')
  })

  it('emits switchLocale on tab click', async () => {
    const w = factory()
    await w.findAll('.locale-tab')[1].trigger('click')
    expect(w.emitted('switchLocale')?.[0]).toEqual(['en'])
  })

  it('renders content textarea with value', () => {
    expect((factory().find('.content-textarea').element as HTMLTextAreaElement).value).toBe('Contenido ES')
  })

  it('shows rejection input for pending posts', () => {
    expect(factory().find('.rejection-input').exists()).toBe(true)
  })

  it('hides rejection input for non-pending posts', () => {
    const w = factory({ post: { ...basePost, status: 'approved' } })
    expect(w.find('.rejection-input').exists()).toBe(false)
  })

  it('shows approve button for pending', () => {
    expect(factory().find('.btn-approve-lg').exists()).toBe(true)
  })

  it('shows reject button for pending', () => {
    expect(factory().find('.btn-reject-lg').exists()).toBe(true)
  })

  it('shows publish button for approved', () => {
    const w = factory({ post: { ...basePost, status: 'approved' } })
    expect(w.find('.btn-publish-lg').exists()).toBe(true)
  })

  it('shows metrics for posted status', () => {
    const w = factory({ post: { ...basePost, status: 'posted', impressions: 150, clicks: 42 } })
    expect(w.find('.modal-metrics').exists()).toBe(true)
    expect(w.findAll('.metric-value')[0].text()).toBe('150')
    expect(w.findAll('.metric-value')[1].text()).toBe('42')
  })

  it('hides save button for posted', () => {
    const w = factory({ post: { ...basePost, status: 'posted' } })
    expect(w.find('.btn-save').exists()).toBe(false)
  })

  it('disables reject when no rejection reason', () => {
    expect(factory().find('.btn-reject-lg').attributes('disabled')).toBeDefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits approve with post id', async () => {
    const w = factory()
    await w.find('.btn-approve-lg').trigger('click')
    expect(w.emitted('approve')?.[0]).toEqual(['post1'])
  })

  it('emits saveContent on save click', async () => {
    const w = factory()
    await w.find('.btn-save').trigger('click')
    expect(w.emitted('saveContent')).toBeTruthy()
  })

  it('shows external id when present', () => {
    const w = factory({ post: { ...basePost, external_post_id: 'ext-123' } })
    expect(w.find('.external-id').text()).toBe('ext-123')
  })

  it('shows rejection reason in history', () => {
    const w = factory({ post: { ...basePost, rejection_reason: 'Bad quality' } })
    expect(w.find('.rejection').exists()).toBe(true)
  })
})
