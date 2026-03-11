/**
 * Tests for app/components/admin/banner/AdminBannerForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminBannerForm from '../../../app/components/admin/banner/AdminBannerForm.vue'

describe('AdminBannerForm', () => {
  const formData = {
    text_es: 'Bienvenido',
    text_en: 'Welcome',
    url: 'https://tracciona.com',
    from_date: null,
    to_date: null,
    active: true,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminBannerForm, {
      props: {
        formData,
        saving: false,
        showPreview: false,
        quickEmojis: ['🚛', '🔥', '⭐'],
        ...overrides,
      },
    })

  it('renders form card', () => {
    expect(factory().find('.form-card').exists()).toBe(true)
  })

  it('renders spanish text input', () => {
    expect(factory().find('#bannerEs').exists()).toBe(true)
  })

  it('renders english text input', () => {
    expect(factory().find('#bannerEn').exists()).toBe(true)
  })

  it('renders URL input', () => {
    expect(factory().find('#bannerUrl').exists()).toBe(true)
  })

  it('renders date inputs', () => {
    expect(factory().find('#bannerDesde').exists()).toBe(true)
    expect(factory().find('#bannerHasta').exists()).toBe(true)
  })

  it('renders active toggle', () => {
    expect(factory().find('.toggle-input').exists()).toBe(true)
  })

  it('renders quick emoji buttons', () => {
    expect(factory().findAll('.emoji-btn-quick')).toHaveLength(6) // 3 per lang
  })

  it('renders emoji picker buttons', () => {
    expect(factory().findAll('.btn-emoji-picker')).toHaveLength(2)
  })

  it('save button shows Guardar', () => {
    expect(factory().find('.btn-primary').text()).toBe('Guardar')
  })

  it('save button shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('Guardando...')
  })

  it('save button disabled when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('preview button shows Ver preview', () => {
    expect(factory().find('.btn-secondary').text()).toBe('Ver preview')
  })

  it('preview button shows Ocultar when preview active', () => {
    expect(factory({ showPreview: true }).find('.btn-secondary').text()).toBe('Ocultar preview')
  })

  it('emits save on primary click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits toggle-preview on secondary click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('toggle-preview')).toBeTruthy()
  })

  it('emits open-emoji-picker on emoji picker click', async () => {
    const w = factory()
    await w.findAll('.btn-emoji-picker')[0].trigger('click')
    expect(w.emitted('open-emoji-picker')).toBeTruthy()
  })

  it('emits insert-emoji on quick emoji click', async () => {
    const w = factory()
    await w.findAll('.emoji-btn-quick')[0].trigger('click')
    expect(w.emitted('insert-emoji')).toBeTruthy()
  })
})
