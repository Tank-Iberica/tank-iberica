/**
 * Tests for app/components/admin/banner/AdminBannerEmojiPicker.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminBannerEmojiPicker from '../../../app/components/admin/banner/AdminBannerEmojiPicker.vue'

describe('AdminBannerEmojiPicker', () => {
  const categories = [
    { name: 'Smileys', emojis: ['😀', '😂', '🥹'] },
    { name: 'Animals', emojis: ['🐶', '🐱'] },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminBannerEmojiPicker, {
      props: {
        show: true,
        categories,
        ...overrides,
      },
      global: { stubs: { Teleport: true, Transition: true } },
    })

  it('renders when show is true', () => {
    expect(factory().find('.emoji-picker-overlay').exists()).toBe(true)
  })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.emoji-picker-overlay').exists()).toBe(false)
  })

  it('shows header text', () => {
    expect(factory().find('.emoji-picker-header').text()).toContain('Seleccionar emoji')
  })

  it('renders category names', () => {
    const names = factory().findAll('.emoji-category-name')
    expect(names).toHaveLength(2)
    expect(names[0].text()).toBe('Smileys')
    expect(names[1].text()).toBe('Animals')
  })

  it('renders emoji buttons', () => {
    expect(factory().findAll('.emoji-btn')).toHaveLength(5)
  })

  it('emits select with emoji on click', async () => {
    const w = factory()
    await w.findAll('.emoji-btn')[0].trigger('click')
    expect(w.emitted('select')![0]).toEqual(['😀'])
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.btn-close-picker').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on backdrop click', async () => {
    const w = factory()
    await w.find('.emoji-picker-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
