/**
 * Tests for app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioHeader.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import ExportAnuncioHeader from '../../../app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioHeader.vue'

describe('ExportAnuncioHeader', () => {
  const factory = () =>
    shallowMount(ExportAnuncioHeader, {
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('dashboard.adExport.title')
  })

  it('shows subtitle', () => {
    expect(factory().find('.subtitle').text()).toBe('dashboard.adExport.subtitle')
  })

  it('shows back button', () => {
    expect(factory().find('.btn-back').text()).toBe('common.back')
  })

  it('back links to dashboard', () => {
    expect(factory().find('.btn-back').attributes('href')).toBe('/dashboard')
  })
})
