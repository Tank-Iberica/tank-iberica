/**
 * Tests for app/components/vehicle/CategoryLinks.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'

const mockCategories = [
  { id: 'cat-1', name: null, name_es: 'Camiones', name_en: 'Trucks', slug: 'camiones' },
  { id: 'cat-2', name: null, name_es: 'Furgonetas', name_en: 'Vans', slug: 'furgonetas' },
]

const mockLimit = vi.fn()
const mockOrder = vi.fn()
const mockSelectFn = vi.fn()

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', (fn: Function) => void fn())
  vi.stubGlobal('useI18n', () => ({ locale: { value: 'es' }, t: (k: string) => k }))
  vi.stubGlobal('localizedField', (name: Record<string, string> | null, locale: string) => {
    if (!name) return ''
    return name[locale] || name['es'] || ''
  })

  mockLimit.mockResolvedValue({ data: mockCategories, error: null })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockSelectFn.mockReturnValue({ order: mockOrder })

  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({ select: mockSelectFn }),
  }))
})

import CategoryLinks from '../../../app/components/vehicle/CategoryLinks.vue'

const mountLinks = (props = {}) =>
  shallowMount(CategoryLinks, {
    props,
    global: {
      mocks: { $t: (k: string) => k },
      stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
    },
  })

describe('CategoryLinks', () => {
  it('renders nothing when no links', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    const w = mountLinks()
    await flushPromises()
    expect(w.find('.category-links').exists()).toBe(false)
  })

  it('renders nav when categories available', async () => {
    const w = mountLinks()
    await flushPromises()
    expect(w.find('.category-links').exists()).toBe(true)
  })

  it('shows category chips', async () => {
    const w = mountLinks()
    await flushPromises()
    const chips = w.findAll('.category-link-chip')
    expect(chips).toHaveLength(2)
  })

  it('shows category names in spanish', async () => {
    const w = mountLinks()
    await flushPromises()
    expect(w.text()).toContain('Camiones')
    expect(w.text()).toContain('Furgonetas')
  })

  it('links chips to category filter URL', async () => {
    const w = mountLinks()
    await flushPromises()
    const links = w.findAll('.category-link-chip')
    expect(links[0].attributes('href')).toBe('/?category_id=cat-1')
  })

  it('shows "More Brand" link when currentBrand is provided', async () => {
    const w = mountLinks({ currentBrand: 'Volvo' })
    await flushPromises()
    const chips = w.findAll('.category-link-chip')
    // categories (2) + more brand (1) = 3
    expect(chips).toHaveLength(3)
    const brandChip = chips[chips.length - 1]
    expect(brandChip.attributes('href')).toContain('brand=Volvo')
  })

  it('renders nav with aria-label', async () => {
    const w = mountLinks()
    await flushPromises()
    expect(w.find('nav').attributes('aria-label')).toBeTruthy()
  })

  it('shows english names when locale is en', async () => {
    vi.stubGlobal('useI18n', () => ({ locale: { value: 'en' }, t: (k: string) => k }))
    vi.stubGlobal('localizedField', (name: Record<string, string> | null, locale: string) => {
      if (!name) return ''
      return name[locale] || name['es'] || ''
    })
    const catsEn = [
      { id: 'cat-1', name: null, name_es: 'Camiones', name_en: 'Trucks', slug: 'camiones' },
    ]
    mockLimit.mockResolvedValueOnce({ data: catsEn, error: null })
    const w = mountLinks()
    await flushPromises()
    expect(w.text()).toContain('Trucks')
    // restore
    vi.stubGlobal('useI18n', () => ({ locale: { value: 'es' }, t: (k: string) => k }))
    vi.stubGlobal('localizedField', (name: Record<string, string> | null, locale: string) => {
      if (!name) return ''
      return name[locale] || name['es'] || ''
    })
  })

  it('handles null categories gracefully', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: null })
    const w = mountLinks()
    await flushPromises()
    expect(w.find('.category-links').exists()).toBe(false)
  })

  it('renders h3 heading', async () => {
    const w = mountLinks()
    await flushPromises()
    expect(w.find('h3').exists()).toBe(true)
  })
})
