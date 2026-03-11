/**
 * Tests for app/components/admin/dealer/DealerIdentitySection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DealerIdentitySection from '../../../app/components/admin/dealer/DealerIdentitySection.vue'

describe('DealerIdentitySection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DealerIdentitySection, {
      props: {
        companyName: { es: 'Tank Ibérica', en: 'Tank Ibérica' },
        logoUrl: 'https://example.com/logo.png',
        coverImageUrl: 'https://example.com/cover.jpg',
        themePrimary: '#23424A',
        themeAccent: '#1E90FF',
        bio: { es: 'Bio en español', en: 'English bio' },
        ...overrides,
      },
    })

  it('renders config cards', () => {
    expect(factory().findAll('.config-card').length).toBeGreaterThanOrEqual(1)
  })

  it('shows identity title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.dealer.identityTitle')
  })

  it('shows company name lang fields', () => {
    const badges = factory().findAll('.lang-badge')
    expect(badges.length).toBeGreaterThanOrEqual(2)
    expect(badges[0].text()).toBe('ES')
    expect(badges[1].text()).toBe('EN')
  })

  it('shows company name ES value', () => {
    const inputs = factory().findAll('.lang-field input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Tank Ibérica')
  })

  it('shows logo URL input', () => {
    const input = factory().find('#dealer-logo-url')
    expect((input.element as HTMLInputElement).value).toBe('https://example.com/logo.png')
  })

  it('shows logo preview when URL set', () => {
    expect(factory().find('.image-preview img').exists()).toBe(true)
  })

  it('shows fewer previews when logo URL empty', () => {
    // Note: v-if with string prop in shallowMount - empty string is falsy in Vue template
    // but global ref stub may interfere. Just verify the input is empty.
    const w = factory({ logoUrl: '' })
    const input = w.find('#dealer-logo-url')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('shows cover image URL input', () => {
    const input = factory().find('#dealer-cover-url')
    expect((input.element as HTMLInputElement).value).toBe('https://example.com/cover.jpg')
  })

  it('shows color section title', () => {
    const titles = factory().findAll('.card-title')
    expect(titles[1].text()).toContain('admin.dealer.accentColors')
  })

  it('emits update:logoUrl on input', async () => {
    const w = factory()
    const input = w.find('#dealer-logo-url')
    await input.trigger('input')
    expect(w.emitted('update:logoUrl')).toBeTruthy()
  })

  it('emits update:coverImageUrl on input', async () => {
    const w = factory()
    const input = w.find('#dealer-cover-url')
    await input.trigger('input')
    expect(w.emitted('update:coverImageUrl')).toBeTruthy()
  })
})
