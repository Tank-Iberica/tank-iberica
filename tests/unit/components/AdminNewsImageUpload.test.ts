/**
 * Tests for app/components/admin/noticias/AdminNewsImageUpload.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsImageUpload from '../../../app/components/admin/noticias/AdminNewsImageUpload.vue'

describe('AdminNewsImageUpload', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsImageUpload, {
      props: {
        imageUrl: null,
        imagePreviewUrl: null,
        uploadingImage: false,
        uploadProgress: 0,
        uploadError: null,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Imagen destacada')
  })

  it('shows upload zone', () => {
    expect(factory().find('.upload-zone').exists()).toBe(true)
  })

  it('shows upload text when not uploading', () => {
    expect(factory().find('.upload-text').text()).toBe('Seleccionar imagen')
  })

  it('shows upload hint', () => {
    expect(factory().find('.upload-hint').text()).toContain('JPG, PNG, WebP')
  })

  it('shows progress when uploading', () => {
    const w = factory({ uploadingImage: true, uploadProgress: 45 })
    expect(w.find('.upload-progress-bar').exists()).toBe(true)
    expect(w.find('.upload-text').text()).toContain('45%')
  })

  it('renders URL input', () => {
    expect(factory().find('input[type="url"]').exists()).toBe(true)
  })

  it('hides preview when no image', () => {
    expect(factory().find('.image-preview-container').exists()).toBe(false)
  })

  it('shows preview when imageUrl set', () => {
    const w = factory({ imageUrl: 'https://cdn.example.com/img.jpg' })
    expect(w.find('.image-preview-container').exists()).toBe(true)
  })

  it('shows remove button on preview', () => {
    const w = factory({ imageUrl: 'https://cdn.example.com/img.jpg' })
    expect(w.find('.remove-image-btn').exists()).toBe(true)
  })

  it('emits removeImage on remove click', async () => {
    const w = factory({ imageUrl: 'https://cdn.example.com/img.jpg' })
    await w.find('.remove-image-btn').trigger('click')
    expect(w.emitted('removeImage')).toBeTruthy()
  })

  it('shows error message', () => {
    const w = factory({ uploadError: 'Archivo demasiado grande' })
    expect(w.find('.upload-error').text()).toBe('Archivo demasiado grande')
  })

  it('hides error when no error', () => {
    expect(factory().find('.upload-error').exists()).toBe(false)
  })
})
