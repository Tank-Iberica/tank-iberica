/**
 * Tests for app/components/subastas/SubastasDetailImageGallery.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubastasDetailImageGallery from '../../../app/components/subastas/SubastasDetailImageGallery.vue'

const baseImages = [
  { url: 'https://img.com/1.jpg' },
  { url: 'https://img.com/2.jpg' },
  { url: 'https://img.com/3.jpg' },
]

describe('SubastasDetailImageGallery', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubastasDetailImageGallery, {
      props: {
        images: [...baseImages],
        currentImage: 'https://img.com/1.jpg',
        selectedIndex: 0,
        vehicleTitle: 'Volvo FH 500',
        status: 'active',
        statusLabel: 'Activa',
        ...overrides,
      },
    })

  it('renders image section', () => {
    expect(factory().find('.vehicle-image-section').exists()).toBe(true)
  })

  it('shows current image', () => {
    const img = factory().find('.vehicle-image')
    expect(img.attributes('src')).toBe('https://img.com/1.jpg')
    expect(img.attributes('alt')).toBe('Volvo FH 500')
  })

  it('shows placeholder when no current image', () => {
    const w = factory({ currentImage: null })
    expect(w.find('.vehicle-image-placeholder').exists()).toBe(true)
    expect(w.find('.vehicle-image').exists()).toBe(false)
  })

  it('shows status badge', () => {
    const badge = factory().find('.detail-status-badge')
    expect(badge.text()).toBe('Activa')
    expect(badge.classes()).toContain('status-active')
  })

  it('renders thumbnails when multiple images', () => {
    expect(factory().findAll('.thumb-btn')).toHaveLength(3)
  })

  it('hides thumbnails when single image', () => {
    const w = factory({ images: [{ url: 'https://img.com/1.jpg' }] })
    expect(w.find('.image-thumbnails').exists()).toBe(false)
  })

  it('applies active class to selected thumbnail', () => {
    const thumbs = factory().findAll('.thumb-btn')
    expect(thumbs[0].classes()).toContain('active')
    expect(thumbs[1].classes()).not.toContain('active')
  })

  it('emits select-image on thumbnail click', async () => {
    const w = factory()
    await w.findAll('.thumb-btn')[1].trigger('click')
    expect(w.emitted('select-image')?.[0]).toEqual([1])
  })

  it('shows different status classes', () => {
    const w = factory({ status: 'ended', statusLabel: 'Finalizada' })
    expect(w.find('.detail-status-badge').classes()).toContain('status-ended')
  })
})
