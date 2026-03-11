/**
 * Tests for app/components/admin/social/PostCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PostCard from '../../../app/components/admin/social/PostCard.vue'

const basePost = {
  id: 'p1',
  image_url: 'https://img.test/truck.jpg',
  status: 'pending' as const,
  impressions: 0,
  clicks: 0,
}

describe('SocialPostCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PostCard, {
      props: {
        post: { ...basePost },
        vehicleTitle: 'Scania R450 2022',
        preview: 'Great truck available now...',
        platformLabel: 'Instagram',
        platformClass: 'platform-instagram',
        statusClass: 'status-pending',
        statusLabel: 'Pendiente',
        formattedDate: '15/01/2026',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders post card', () => {
    expect(factory().find('.post-card').exists()).toBe(true)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.post-vehicle-title').text()).toBe('Scania R450 2022')
  })

  it('shows preview text', () => {
    expect(factory().find('.post-preview').text()).toBe('Great truck available now...')
  })

  it('shows platform badge', () => {
    const badge = factory().find('.platform-badge')
    expect(badge.text()).toBe('Instagram')
    expect(badge.classes()).toContain('platform-instagram')
  })

  it('shows status badge', () => {
    const badge = factory().find('.status-badge')
    expect(badge.text()).toBe('Pendiente')
    expect(badge.classes()).toContain('status-pending')
  })

  it('shows formatted date', () => {
    expect(factory().find('.post-date').text()).toBe('15/01/2026')
  })

  it('shows image when image_url exists', () => {
    expect(factory().find('.post-image img').exists()).toBe(true)
  })

  it('shows placeholder when no image', () => {
    const w = factory({ post: { ...basePost, image_url: null } })
    expect(w.find('.post-image-placeholder').exists()).toBe(true)
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

  it('shows metrics for posted posts', () => {
    const w = factory({ post: { ...basePost, status: 'posted', impressions: 100, clicks: 25 } })
    expect(w.find('.post-metrics').exists()).toBe(true)
    expect(w.html()).toContain('100')
    expect(w.html()).toContain('25')
  })

  it('hides metrics for non-posted posts', () => {
    expect(factory().find('.post-metrics').exists()).toBe(false)
  })

  it('emits select on card click', async () => {
    const w = factory()
    await w.find('.post-card').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
  })

  it('emits approve on approve click', async () => {
    const w = factory()
    await w.find('.btn-approve').trigger('click')
    expect(w.emitted('approve')?.[0]).toEqual(['p1'])
  })

  it('always shows edit button', () => {
    expect(factory().find('.btn-edit').exists()).toBe(true)
  })

  it('emits select on edit click', async () => {
    const w = factory()
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
  })
})
