/**
 * Tests for app/components/vendedor/VendedorReviewForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VendedorReviewForm from '../../../app/components/vendedor/VendedorReviewForm.vue'

describe('VendedorReviewForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VendedorReviewForm, {
      props: {
        canReview: true,
        reviewRating: 0,
        reviewTitle: '',
        reviewContent: '',
        submitting: false,
        submitError: null,
        submitSuccess: false,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders form section when canReview', () => {
    expect(factory().find('.review-form-section').exists()).toBe(true)
  })

  it('hides when canReview=false', () => {
    const w = factory({ canReview: false })
    expect(w.find('.review-form-section').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('seller.writeReview')
  })

  it('renders 5 rating stars', () => {
    expect(factory().findAll('.rating-star-btn')).toHaveLength(5)
  })

  it('applies active class to selected stars', () => {
    const w = factory({ reviewRating: 3 })
    const stars = w.findAll('.rating-star-btn')
    expect(stars[0].classes()).toContain('rating-star-btn--active')
    expect(stars[2].classes()).toContain('rating-star-btn--active')
    expect(stars[3].classes()).not.toContain('rating-star-btn--active')
  })

  it('emits update-rating on star click', async () => {
    const w = factory()
    await w.findAll('.rating-star-btn')[3].trigger('click')
    expect(w.emitted('update-rating')?.[0]).toEqual([4])
  })

  it('shows submit button', () => {
    expect(factory().find('.btn-primary').text()).toBe('seller.submitReview')
  })

  it('shows loading text when submitting', () => {
    const w = factory({ submitting: true })
    expect(w.find('.btn-primary').text()).toBe('common.loading')
  })

  it('disables submit when submitting', () => {
    const w = factory({ submitting: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows error message', () => {
    const w = factory({ submitError: 'Error de red' })
    expect(w.find('.form-error').text()).toBe('Error de red')
  })

  it('shows success banner', () => {
    const w = factory({ submitSuccess: true })
    expect(w.find('.success-banner').text()).toBe('seller.reviewSubmitted')
    expect(w.find('.review-form').exists()).toBe(false)
  })

  it('emits submit on form submit', async () => {
    const w = factory()
    await w.find('.review-form').trigger('submit')
    expect(w.emitted('submit')).toBeTruthy()
  })
})
