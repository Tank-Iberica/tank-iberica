/**
 * Tests for app/components/ui/BreadcrumbNav.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BreadcrumbNav from '../../../app/components/ui/BreadcrumbNav.vue'

const baseItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Vehículo actual' },
]

describe('BreadcrumbNav', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BreadcrumbNav, {
      props: { items: [...baseItems], ...overrides },
      global: {
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders nav with aria-label', () => {
    expect(factory().find('nav[aria-label="Breadcrumb"]').exists()).toBe(true)
  })

  it('renders all breadcrumb items', () => {
    expect(factory().findAll('.breadcrumb-item')).toHaveLength(3)
  })

  it('renders links for items with to', () => {
    const links = factory().findAll('.breadcrumb-link')
    expect(links).toHaveLength(2)
    expect(links[0].text()).toBe('Inicio')
    expect(links[1].text()).toBe('Catálogo')
  })

  it('renders current item without link', () => {
    const current = factory().find('.breadcrumb-current')
    expect(current.text()).toBe('Vehículo actual')
    expect(current.attributes('aria-current')).toBe('page')
  })

  it('shows separators between items (not after last)', () => {
    const separators = factory().findAll('.breadcrumb-separator')
    expect(separators).toHaveLength(2)
  })

  it('renders single item without separator', () => {
    const w = factory({ items: [{ label: 'Home' }] })
    expect(w.findAll('.breadcrumb-separator')).toHaveLength(0)
  })

  it('renders empty list', () => {
    const w = factory({ items: [] })
    expect(w.findAll('.breadcrumb-item')).toHaveLength(0)
  })
})
