/**
 * Tests for app/components/modals/advertise/AdvertiseImagesSection.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/modals/useAdvertiseModal', () => ({
  MAX_PHOTOS: 5,
}))

import AdvertiseImagesSection from '../../../app/components/modals/advertise/AdvertiseImagesSection.vue'

describe('AdvertiseImagesSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdvertiseImagesSection, {
      props: {
        photos: [],
        photoPreviews: [],
        techSheet: null,
        techSheetPreview: '',
        errors: {},
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section-fields--stacked').exists()).toBe(true)
  })

  it('renders 2 upload blocks', () => {
    expect(factory().findAll('.upload-block')).toHaveLength(2)
  })

  it('shows upload area when under max photos', () => {
    expect(factory().find('.upload-area').exists()).toBe(true)
  })

  it('hides upload area when at max photos', () => {
    const photos = Array.from({ length: 5 }, () => new File([''], 'test.jpg'))
    const w = factory({ photos })
    // When at max, .upload-area for photos is hidden
    expect(w.findAll('.upload-area').length).toBeLessThanOrEqual(1) // only tech sheet upload
  })

  it('shows photo count', () => {
    expect(factory().text()).toContain('(0/5)')
  })

  it('shows photo recommendations', () => {
    expect(factory().find('.photo-recommendations').exists()).toBe(true)
  })

  it('shows 5 recommendation items', () => {
    expect(factory().findAll('.photo-recommendations li')).toHaveLength(5)
  })

  it('shows photo previews', () => {
    const w = factory({ photoPreviews: ['data:image/png;base64,1', 'data:image/png;base64,2'] })
    expect(w.findAll('.photo-thumb')).toHaveLength(2)
  })

  it('shows remove button on each preview', () => {
    const w = factory({ photoPreviews: ['data:image/png;base64,1'] })
    expect(w.find('.photo-thumb .photo-remove').exists()).toBe(true)
  })

  it('emits remove-photo on remove click', async () => {
    const w = factory({ photoPreviews: ['data:image/png;base64,1'] })
    await w.find('.photo-thumb .photo-remove').trigger('click')
    expect(w.emitted('remove-photo')).toBeTruthy()
    expect(w.emitted('remove-photo')![0]).toEqual([0])
  })

  it('shows tech sheet upload when no tech sheet', () => {
    expect(factory().find('.upload-area--compact').exists()).toBe(true)
  })

  it('shows tech sheet preview', () => {
    const w = factory({ techSheet: new File([''], 'sheet.jpg'), techSheetPreview: 'data:image/png;base64,x' })
    expect(w.find('.tech-sheet-preview').exists()).toBe(true)
  })

  it('emits remove-tech-sheet on remove click', async () => {
    const w = factory({ techSheet: new File([''], 'sheet.jpg'), techSheetPreview: 'data:image/png;base64,x' })
    await w.find('.tech-sheet-preview .photo-remove').trigger('click')
    expect(w.emitted('remove-tech-sheet')).toBeTruthy()
  })

  it('shows photo error', () => {
    const w = factory({ errors: { photos: 'required' } })
    expect(w.find('.field-error').exists()).toBe(true)
  })

  it('shows tech sheet error', () => {
    const w = factory({ errors: { techSheet: 'required' } })
    expect(w.findAll('.field-error').length).toBeGreaterThanOrEqual(1)
  })

  it('shows privacy note', () => {
    expect(factory().find('.privacy-note').exists()).toBe(true)
  })
})
