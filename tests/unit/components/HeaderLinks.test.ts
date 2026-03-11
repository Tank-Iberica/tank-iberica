/**
 * Tests for app/components/admin/config/navigation/HeaderLinks.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HeaderLinks from '../../../app/components/admin/config/navigation/HeaderLinks.vue'

describe('HeaderLinks', () => {
  const links = [
    { label_es: 'Inicio', label_en: 'Home', url: '/', visible: true },
    { label_es: 'Catalogo', label_en: 'Catalog', url: '/catalogo', visible: false },
  ]

  const factory = (props = {}) =>
    shallowMount(HeaderLinks, {
      props: { links, ...props },
      global: {
        stubs: {
          AdminConfigNavigationLinksList: {
            template: '<div class="links-stub" />',
            props: ['links', 'placeholderEs', 'placeholderEn', 'placeholderUrl', 'emptyMessage'],
          },
        },
      },
    })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Enlaces del Header')
  })

  it('shows subtitle', () => {
    expect(factory().text()).toContain('Enlaces de navegacion principal')
  })

  it('has add button', () => {
    expect(factory().find('.btn-add').text()).toBe('+ Anadir')
  })

  it('emits add on click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('passes links to child', () => {
    expect(factory().find('.links-stub').exists()).toBe(true)
  })
})
