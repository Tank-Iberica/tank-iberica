/**
 * Tests for app/components/admin/config/branding/BrandingLogosCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import BrandingLogosCard from '../../../app/components/admin/config/branding/BrandingLogosCard.vue'

describe('BrandingLogosCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BrandingLogosCard, {
      props: {
        logoUrl: 'https://cdn.example.com/logo.png',
        logoDarkUrl: 'https://cdn.example.com/logo-dark.png',
        faviconUrl: 'https://cdn.example.com/favicon.png',
        ogImageUrl: 'https://cdn.example.com/og.jpg',
        logoTextConfig: { fontFamily: 'Inter', fontWeight: 700, fontSize: 24 },
        verticalName: 'Tracciona',
        ...overrides,
      },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Logotipos e imágenes')
  })

  it('shows subtitle', () => {
    expect(factory().find('.card-subtitle').text()).toContain('Cloudinary')
  })

  it('renders uploaders grid', () => {
    expect(factory().find('.uploaders-grid').exists()).toBe(true)
  })

  it('renders logo text section', () => {
    expect(factory().find('.logo-text-section').exists()).toBe(true)
  })

  it('shows subsection title', () => {
    expect(factory().find('.subsection-title').text()).toContain('Nombre de la vertical')
  })
})
