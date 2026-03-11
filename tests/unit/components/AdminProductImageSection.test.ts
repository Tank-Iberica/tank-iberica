/**
 * Tests for app/components/admin/productos/AdminProductImageSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductImageSection from '../../../app/components/admin/productos/AdminProductImageSection.vue'

describe('AdminProductImageSection', () => {
  const pendingImages = [
    { id: 'img-1', previewUrl: 'https://cdn.example.com/1.jpg' },
    { id: 'img-2', previewUrl: 'https://cdn.example.com/2.jpg' },
    { id: 'img-3', previewUrl: 'https://cdn.example.com/3.jpg' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductImageSection, {
      props: {
        pendingImages,
        uploadingImages: false,
        cloudinaryUploading: false,
        cloudinaryProgress: 0,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows image count in title', () => {
    expect(factory().find('.section-title').text()).toContain('3/10')
  })

  it('renders upload zone', () => {
    expect(factory().find('.upload-zone-label').exists()).toBe(true)
  })

  it('renders image grid', () => {
    expect(factory().find('.img-grid').exists()).toBe(true)
  })

  it('renders image items', () => {
    expect(factory().findAll('.img-item')).toHaveLength(3)
  })

  it('marks first image as cover', () => {
    expect(factory().findAll('.img-item')[0].classes()).toContain('cover')
  })

  it('shows cover badge on first image', () => {
    expect(factory().find('.cover-badge').text()).toBe('PORTADA')
  })

  it('shows upload progress when uploading', () => {
    const w = factory({ cloudinaryUploading: true, cloudinaryProgress: 60 })
    expect(w.find('.upload-progress').exists()).toBe(true)
    expect(w.find('.upload-progress span').text()).toBe('60%')
  })

  it('hides progress when not uploading', () => {
    expect(factory().find('.upload-progress').exists()).toBe(false)
  })

  it('hides image grid when no images', () => {
    expect(factory({ pendingImages: [] }).find('.img-grid').exists()).toBe(false)
  })

  it('shows hint when images exist', () => {
    expect(factory().find('.img-hint').exists()).toBe(true)
  })

  it('emits remove on delete click', async () => {
    const w = factory()
    await w.find('.del').trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
    expect(w.emitted('remove')![0]).toEqual(['img-1'])
  })

  it('shows move up button on non-first images', () => {
    const items = factory().findAll('.img-item')
    // First item should not have up button
    expect(items[0].findAll('button[title="Mover arriba"]')).toHaveLength(0)
    // Second item should have up button
    expect(items[1].find('button[title="Mover arriba"]').exists()).toBe(true)
  })

  it('shows move down button on non-last images', () => {
    const items = factory().findAll('.img-item')
    // Last item should not have down button
    expect(items[2].findAll('button[title="Mover abajo"]')).toHaveLength(0)
  })
})
