/**
 * Tests for app/components/vehicle/ImageGallery.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ImageGallery from '../../../app/components/vehicle/ImageGallery.vue'

describe('ImageGallery', () => {
  const images = [
    { id: '1', url: 'https://example.com/img1.jpg', position: 2 },
    { id: '2', url: 'https://example.com/img2.jpg', position: 1 },
    { id: '3', url: 'https://example.com/img3.jpg', position: 3 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ImageGallery, {
      props: { images, alt: 'Test vehicle', ...overrides },
      global: { stubs: { NuxtImg: { template: '<img />', props: ['src', 'alt'] } } },
    })

  it('renders gallery', () => {
    expect(factory().find('.gallery').exists()).toBe(true)
  })

  it('renders main image area', () => {
    expect(factory().find('.gallery-main').exists()).toBe(true)
  })

  it('shows nav arrows for multiple images', () => {
    expect(factory().find('.gallery-prev').exists()).toBe(true)
    expect(factory().find('.gallery-next').exists()).toBe(true)
  })

  it('hides nav arrows for single image', () => {
    const w = factory({ images: [images[0]] })
    expect(w.find('.gallery-prev').exists()).toBe(false)
    expect(w.find('.gallery-next').exists()).toBe(false)
  })

  it('shows counter for multiple images', () => {
    expect(factory().find('.gallery-counter').text()).toContain('1 / 3')
  })

  it('hides counter for single image', () => {
    expect(factory({ images: [images[0]] }).find('.gallery-counter').exists()).toBe(false)
  })

  it('prev button has aria-label', () => {
    expect(factory().find('.gallery-prev').attributes('aria-label')).toBe('Previous')
  })

  it('next button has aria-label', () => {
    expect(factory().find('.gallery-next').attributes('aria-label')).toBe('Next')
  })

  it('renders thumbnails for multiple images', () => {
    expect(factory().findAll('.gallery-thumb')).toHaveLength(3)
  })
})
