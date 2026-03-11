/**
 * Tests for app/components/dashboard/herramientas/merchandising/MerchProductGrid.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardMerchandising', () => ({
  products: [
    { id: 'tarjetas', name_es: 'Tarjetas', name_en: 'Cards', description_es: 'Desc ES 1', description_en: 'Desc EN 1', unit_es: '500 uds', unit_en: '500 pcs', icon: '🪪', color: '#dbeafe' },
    { id: 'imanes', name_es: 'Imanes', name_en: 'Magnets', description_es: 'Desc ES 2', description_en: 'Desc EN 2', unit_es: '2 uds', unit_en: '2 pcs', icon: '🚐', color: '#dcfce7' },
  ],
}))

import MerchProductGrid from '../../../app/components/dashboard/herramientas/merchandising/MerchProductGrid.vue'

describe('MerchProductGrid', () => {
  const factory = () =>
    shallowMount(MerchProductGrid, {
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows catalog title', () => {
    expect(factory().find('.section-title').text()).toBe('dashboard.tools.merchandising.catalogTitle')
  })

  it('shows catalog description', () => {
    expect(factory().find('.section-desc').text()).toBe('dashboard.tools.merchandising.catalogDesc')
  })

  it('renders product grid', () => {
    expect(factory().find('.product-grid').exists()).toBe(true)
  })

  it('renders 2 product cards', () => {
    expect(factory().findAll('.product-card')).toHaveLength(2)
  })

  it('shows product icon', () => {
    expect(factory().find('.product-icon').text()).toBe('🪪')
  })

  it('shows product name (ES locale)', () => {
    // useI18n locale stub returns { value: 'es' }
    expect(factory().find('.product-name').text()).toBe('Tarjetas')
  })

  it('shows product description (ES locale)', () => {
    expect(factory().find('.product-desc').text()).toBe('Desc ES 1')
  })

  it('shows product unit (ES locale)', () => {
    expect(factory().find('.product-unit').text()).toBe('500 uds')
  })

  it('sets card background color via CSS var', () => {
    const card = factory().find('.product-card')
    expect(card.attributes('style')).toContain('#dbeafe')
  })
})
