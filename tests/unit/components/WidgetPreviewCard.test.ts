/**
 * Tests for app/components/dashboard/herramientas/widget/WidgetPreviewCard.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import WidgetPreviewCard from '../../../app/components/dashboard/herramientas/widget/WidgetPreviewCard.vue'

describe('WidgetPreviewCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(WidgetPreviewCard, {
      props: {
        previewUrl: 'https://tracciona.com/embed/test',
        iframeWidth: '100%',
        theme: 'light' as const,
        ...overrides,
      },
    })

  it('renders preview card', () => {
    expect(factory().find('.preview-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('dashboard.widget.preview')
  })

  it('renders iframe when url provided', () => {
    const iframe = factory().find('.preview-iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('src')).toBe('https://tracciona.com/embed/test')
  })

  it('shows placeholder when no url', () => {
    const w = factory({ previewUrl: '' })
    expect(w.find('.preview-placeholder').exists()).toBe(true)
    expect(w.find('.preview-iframe').exists()).toBe(false)
  })

  it('adds dark-preview class for dark theme', () => {
    expect(factory({ theme: 'dark' }).find('.preview-container').classes()).toContain('dark-preview')
  })

  it('no dark-preview class for light theme', () => {
    expect(factory({ theme: 'light' }).find('.preview-container').classes()).not.toContain('dark-preview')
  })

  it('iframe has width attribute', () => {
    expect(factory().find('.preview-iframe').attributes('width')).toBe('100%')
  })
})
