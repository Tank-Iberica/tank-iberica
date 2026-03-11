/**
 * Tests for app/components/admin/vehiculos/AdminVehiculoImages.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminVehiculoImages from '../../../app/components/admin/vehiculos/AdminVehiculoImages.vue'

describe('AdminVehiculoImages', () => {
  const images = [
    { id: 'img-1', url: 'https://cdn.example.com/1.jpg', thumbnail_url: 'https://cdn.example.com/1_thumb.jpg' },
    { id: 'img-2', url: 'https://cdn.example.com/2.jpg', thumbnail_url: null },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiculoImages, {
      props: {
        images,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Imágenes')
  })

  it('renders image items', () => {
    expect(factory().findAll('.image-item')).toHaveLength(2)
  })

  it('shows thumbnail_url when available', () => {
    const img = factory().find('.image-item img')
    expect(img.attributes('src')).toBe('https://cdn.example.com/1_thumb.jpg')
  })

  it('falls back to url when no thumbnail', () => {
    const imgs = factory().findAll('.image-item img')
    expect(imgs[1].attributes('src')).toBe('https://cdn.example.com/2.jpg')
  })

  it('shows position numbers', () => {
    const positions = factory().findAll('.image-position')
    expect(positions[0].text()).toBe('1')
    expect(positions[1].text()).toBe('2')
  })

  it('shows delete buttons', () => {
    expect(factory().findAll('.image-delete')).toHaveLength(2)
  })

  it('emits remove on delete click', async () => {
    const w = factory()
    await w.find('.image-delete').trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
    expect(w.emitted('remove')![0]).toEqual([0])
  })

  it('shows upload label when under limit', () => {
    expect(factory().find('.image-upload').exists()).toBe(true)
  })

  it('hides upload when at 10 images', () => {
    const tenImages = Array.from({ length: 10 }, (_, i) => ({
      id: `img-${i}`,
      url: `https://cdn.example.com/${i}.jpg`,
      thumbnail_url: null,
    }))
    expect(factory({ images: tenImages }).find('.image-upload').exists()).toBe(false)
  })

  it('shows hint text', () => {
    expect(factory().find('.field-hint').text()).toContain('Máximo 10 imágenes')
  })

  it('has draggable attribute on image items', () => {
    expect(factory().find('.image-item').attributes('draggable')).toBe('true')
  })
})
