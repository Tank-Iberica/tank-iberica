/**
 * Tests for app/components/admin/productos/AdminProductoImages.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoImages from '../../../app/components/admin/productos/AdminProductoImages.vue'

describe('AdminProductoImages', () => {
  const images = [
    { id: 'img-1', url: 'https://example.com/1.jpg', position: 0 },
    { id: 'img-2', url: 'https://example.com/2.jpg', position: 1 },
    { id: 'img-3', url: 'https://example.com/3.jpg', position: 2 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoImages, {
      props: {
        images,
        uploading: false,
        cloudinaryUploading: false,
        cloudinaryProgress: 0,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title with image count', () => {
    expect(factory().find('.section-title').text()).toBe('Imágenes (3/10)')
  })

  it('shows upload label', () => {
    expect(factory().find('.upload-zone-label').text()).toContain('Subir imágenes')
  })

  it('shows uploading text when uploading', () => {
    const w = factory({ uploading: true })
    expect(w.find('.upload-zone-label').text()).toContain('Subiendo...')
  })

  it('shows progress bar when cloudinary uploading', () => {
    const w = factory({ cloudinaryUploading: true, cloudinaryProgress: 45 })
    expect(w.find('.upload-progress').exists()).toBe(true)
    expect(w.find('.upload-progress span').text()).toBe('45%')
  })

  it('hides progress bar when not uploading', () => {
    expect(factory().find('.upload-progress').exists()).toBe(false)
  })

  it('renders image grid', () => {
    expect(factory().find('.img-grid').exists()).toBe(true)
  })

  it('renders an item per image', () => {
    expect(factory().findAll('.img-item')).toHaveLength(3)
  })

  it('marks first image as cover', () => {
    expect(factory().findAll('.img-item')[0].classes()).toContain('cover')
  })

  it('shows PORTADA badge on first image', () => {
    expect(factory().find('.cover-badge').text()).toBe('PORTADA')
  })

  it('hides portada button on first image', () => {
    const firstItem = factory().findAll('.img-item')[0]
    const btns = firstItem.findAll('.img-actions button')
    // First image: no portada, no move-up; only move-down and delete
    const titles = btns.map(b => b.attributes('title'))
    expect(titles).not.toContain('Portada')
  })

  it('shows portada button on non-first image', () => {
    const secondItem = factory().findAll('.img-item')[1]
    const btns = secondItem.findAll('.img-actions button')
    const titles = btns.map(b => b.attributes('title'))
    expect(titles).toContain('Portada')
  })

  it('hides move-up button on first image', () => {
    const firstItem = factory().findAll('.img-item')[0]
    const titles = firstItem.findAll('.img-actions button').map(b => b.attributes('title'))
    expect(titles).not.toContain('Mover arriba')
  })

  it('hides move-down button on last image', () => {
    const lastItem = factory().findAll('.img-item')[2]
    const titles = lastItem.findAll('.img-actions button').map(b => b.attributes('title'))
    expect(titles).not.toContain('Mover abajo')
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.img-actions button.del').trigger('click')
    expect(w.emitted('delete')?.[0]?.[0]).toBe('img-1')
  })

  it('emits set-portada on portada button click', async () => {
    const w = factory()
    const secondItem = w.findAll('.img-item')[1]
    await secondItem.find('.img-actions button[title="Portada"]').trigger('click')
    expect(w.emitted('set-portada')?.[0]?.[0]).toBe(1)
  })

  it('shows empty message when no images', () => {
    const w = factory({ images: [] })
    expect(w.find('.empty-msg').text()).toContain('Sin imágenes')
  })
})
