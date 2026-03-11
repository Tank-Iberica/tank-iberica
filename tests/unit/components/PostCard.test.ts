/**
 * Tests for app/components/admin/social/PostCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import PostCard from '../../../app/components/admin/social/PostCard.vue'

describe('PostCard', () => {
  const basePost = {
    id: 'p-1',
    image_url: 'https://example.com/img.jpg',
    status: 'pending',
    impressions: 0,
    clicks: 0,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PostCard, {
      props: {
        post: basePost,
        vehicleTitle: 'Volvo FH16',
        preview: 'Nuevo camion disponible...',
        platformLabel: 'LinkedIn',
        platformClass: 'platform-linkedin',
        statusClass: 'status-pending',
        statusLabel: 'Pendiente',
        formattedDate: '01/03/2026',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders post card', () => {
    expect(factory().find('.post-card').exists()).toBe(true)
  })

  it('shows image when url set', () => {
    expect(factory().find('.post-image img').exists()).toBe(true)
  })

  it('shows placeholder when no image', () => {
    const w = factory({ post: { ...basePost, image_url: null } })
    expect(w.find('.post-image-placeholder').exists()).toBe(true)
  })

  it('shows platform badge', () => {
    expect(factory().find('.platform-badge').text()).toBe('LinkedIn')
  })

  it('applies platform class', () => {
    expect(factory().find('.platform-badge').classes()).toContain('platform-linkedin')
  })

  it('shows vehicle title', () => {
    expect(factory().find('.post-vehicle-title').text()).toBe('Volvo FH16')
  })

  it('shows preview text', () => {
    expect(factory().find('.post-preview').text()).toBe('Nuevo camion disponible...')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').text()).toBe('Pendiente')
  })

  it('applies status class', () => {
    expect(factory().find('.status-badge').classes()).toContain('status-pending')
  })

  it('shows formatted date', () => {
    expect(factory().find('.post-date').text()).toBe('01/03/2026')
  })

  it('shows approve button for pending posts', () => {
    expect(factory().find('.btn-approve').exists()).toBe(true)
  })

  it('hides approve button for non-pending posts', () => {
    const w = factory({ post: { ...basePost, status: 'approved' } })
    expect(w.find('.btn-approve').exists()).toBe(false)
  })

  it('shows publish button for approved posts', () => {
    const w = factory({ post: { ...basePost, status: 'approved' } })
    expect(w.find('.btn-publish').exists()).toBe(true)
  })

  it('hides publish button for pending posts', () => {
    expect(factory().find('.btn-publish').exists()).toBe(false)
  })

  it('shows metrics for posted posts', () => {
    const w = factory({ post: { ...basePost, status: 'posted', impressions: 120, clicks: 45 } })
    expect(w.find('.post-metrics').exists()).toBe(true)
  })

  it('hides metrics for non-posted posts', () => {
    expect(factory().find('.post-metrics').exists()).toBe(false)
  })

  it('emits select on card click', async () => {
    const w = factory()
    await w.find('.post-card').trigger('click')
    expect(w.emitted('select')?.[0]?.[0]).toEqual(basePost)
  })

  it('emits approve on approve click', async () => {
    const w = factory()
    await w.find('.btn-approve').trigger('click')
    expect(w.emitted('approve')?.[0]?.[0]).toBe('p-1')
  })

  it('emits publish on publish click', async () => {
    const w = factory({ post: { ...basePost, status: 'approved' } })
    await w.find('.btn-publish').trigger('click')
    expect(w.emitted('publish')?.[0]?.[0]).toBe('p-1')
  })
})
