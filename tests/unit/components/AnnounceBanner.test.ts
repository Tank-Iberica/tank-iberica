/**
 * Tests for app/components/catalog/AnnounceBanner.vue
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch } from 'vue'

const mockSingle = vi.fn()
const mockSupabase = {
  from: () => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }),
}

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', (fn: Function) => void fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('useSupabaseClient', () => mockSupabase)
})

import AnnounceBanner from '../../../app/components/catalog/AnnounceBanner.vue'

const mountBanner = () =>
  shallowMount(AnnounceBanner, { global: { mocks: { $t: (k: string) => k } } })

describe('AnnounceBanner', () => {
  beforeEach(() => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useI18n', () => ({ locale: { value: 'es' }, t: (k: string) => k }))
  })

  it('renders nothing when no data', async () => {
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(false)
  })

  it('renders banner when active with text', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Oferta especial' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(true)
    expect(w.text()).toContain('Oferta especial')
  })

  it('hides banner when enabled is false', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: false, text_es: 'Texto' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(false)
  })

  it('uses text_en when locale is en', async () => {
    vi.stubGlobal('useI18n', () => ({ locale: { value: 'en' }, t: (k: string) => k }))
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'ES text', text_en: 'EN text' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.text()).toContain('EN text')
  })

  it('falls back to text_es when locale is es', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Texto ES', text_en: 'EN text' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.text()).toContain('Texto ES')
  })

  it('renders external link with target blank', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Texto', link: 'https://externa.com/page' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    const link = w.find('.banner-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
  })

  it('renders internal link without target blank', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Texto', link: '/ofertas' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    const link = w.find('.banner-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('target')).toBeUndefined()
  })

  it('hides banner when dismissed', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Texto' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(true)
    await w.find('.announcement-close').trigger('click')
    expect(w.find('.announcement-banner').exists()).toBe(false)
  })

  it('uses active field as fallback for backward compat', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { active: true, text_es: 'Texto legado' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(true)
    expect(w.text()).toContain('Texto legado')
  })

  it('hides banner before start date', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Futuro', fecha_inicio: '2099-01-01' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(false)
  })

  it('hides banner after end date', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Pasado', fecha_fin: '2000-01-01' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(false)
  })

  it('shows banner within valid date range', async () => {
    mockSingle.mockResolvedValue({
      data: {
        value: {
          enabled: true,
          text_es: 'Vigente',
          fecha_inicio: '2000-01-01',
          fecha_fin: '2099-12-31',
        },
      },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(true)
    expect(w.text()).toContain('Vigente')
  })

  it('uses url field as fallback for link', async () => {
    mockSingle.mockResolvedValue({
      data: { value: { enabled: true, text_es: 'Texto', url: 'https://alt.com/page' } },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.banner-link').exists()).toBe(true)
  })

  it('uses from_date and to_date fields', async () => {
    mockSingle.mockResolvedValue({
      data: {
        value: { enabled: true, text_es: 'From/To', from_date: '2000-01-01', to_date: '2099-12-31' },
      },
      error: null,
    })
    const w = mountBanner()
    await flushPromises()
    expect(w.find('.announcement-banner').exists()).toBe(true)
  })
})
