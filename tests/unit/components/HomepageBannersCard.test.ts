/**
 * Tests for app/components/admin/config/homepage/HomepageBannersCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import HomepageBannersCard from '../../../app/components/admin/config/homepage/HomepageBannersCard.vue'

describe('HomepageBannersCard', () => {
  const banners = [
    {
      id: 'b-1',
      content_es: 'Oferta especial',
      content_en: 'Special offer',
      url: '/ofertas',
      active: true,
    },
    {
      id: 'b-2',
      content_es: 'Nuevo stock',
      content_en: 'New stock',
      url: '/catalogo',
      active: false,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HomepageBannersCard, {
      props: {
        banners,
        ...overrides,
      },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows Banners title', () => {
    expect(factory().find('.card-title').text()).toBe('Banners')
  })

  it('shows add button', () => {
    expect(factory().find('.btn-add').text()).toContain('Anadir banner')
  })

  it('renders banner items', () => {
    expect(factory().findAll('.banner-item')).toHaveLength(2)
  })

  it('shows banner index', () => {
    expect(factory().find('.banner-index').text()).toBe('#1')
  })

  it('shows active/inactive label', () => {
    const labels = factory().findAll('.toggle-label-inline span')
    expect(labels[0].text()).toBe('Activo')
  })

  it('shows inactive label for inactive banner', () => {
    const items = factory().findAll('.banner-item')
    expect(items[1].find('.toggle-label-inline span').text()).toBe('Inactivo')
  })

  it('shows remove button per banner', () => {
    expect(factory().findAll('.btn-remove')).toHaveLength(2)
  })

  it('shows ES and EN lang fields', () => {
    const firstBanner = factory().findAll('.banner-item')[0]
    const badges = firstBanner.findAll('.lang-badge')
    expect(badges[0].text()).toBe('ES')
    expect(badges[1].text()).toBe('EN')
  })

  it('emits add on add button click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('emits remove on remove button click', async () => {
    const w = factory()
    await w.find('.btn-remove').trigger('click')
    expect(w.emitted('remove')?.[0]?.[0]).toBe(0)
  })

  it('shows empty state when no banners', () => {
    const w = factory({ banners: [] })
    expect(w.find('.empty-state').text()).toContain('admin.configHomepage.noBanners')
  })
})
