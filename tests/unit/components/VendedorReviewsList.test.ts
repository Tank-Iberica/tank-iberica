/**
 * Tests for app/components/vendedor/VendedorReviewsList.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useVendedorDetail', () => ({
  renderStars: (r: number) => '★'.repeat(Math.round(r)),
}))

import { shallowMount } from '@vue/test-utils'
import VendedorReviewsList from '../../../app/components/vendedor/VendedorReviewsList.vue'

const baseReviews = [
  { id: 'r1', rating: 5, title: 'Excelente', content: 'Muy buen servicio', reviewer_name: 'Juan', created_at: '2026-03-01T00:00:00Z', verified_purchase: true },
  { id: 'r2', rating: 3, title: null, content: null, reviewer_name: null, created_at: '2026-02-15T00:00:00Z', verified_purchase: false },
]

describe('VendedorReviewsList', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VendedorReviewsList, {
      props: { reviews: [...baseReviews], reviewsLoading: false, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders reviews section', () => {
    expect(factory().find('.reviews-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('seller.reviewsTitle')
  })

  it('renders review cards', () => {
    expect(factory().findAll('.review-card')).toHaveLength(2)
  })

  it('shows review rating', () => {
    expect(factory().findAll('.review-rating')[0].text()).toBe('5/5')
  })

  it('shows verified purchase badge', () => {
    expect(factory().findAll('.review-verified')).toHaveLength(1)
  })

  it('shows review content', () => {
    expect(factory().findAll('.review-content')[0].text()).toBe('Muy buen servicio')
  })

  it('shows anonymous for missing reviewer', () => {
    const authors = factory().findAll('.review-author')
    expect(authors[1].text()).toBe('seller.anonymous')
  })

  it('shows loading state', () => {
    const w = factory({ reviewsLoading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
  })

  it('shows empty state', () => {
    const w = factory({ reviews: [] })
    expect(w.find('.empty-reviews').exists()).toBe(true)
  })

  it('shows load more button when >= 10 reviews', () => {
    const tenReviews = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`, rating: 4, title: null, content: null, reviewer_name: 'User', created_at: '2026-01-01', verified_purchase: false,
    }))
    const w = factory({ reviews: tenReviews })
    expect(w.find('.btn-load-more').exists()).toBe(true)
  })

  it('emits load-more on button click', async () => {
    const tenReviews = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`, rating: 4, title: null, content: null, reviewer_name: 'User', created_at: '2026-01-01', verified_purchase: false,
    }))
    const w = factory({ reviews: tenReviews })
    await w.find('.btn-load-more').trigger('click')
    expect(w.emitted('load-more')).toBeTruthy()
  })
})
