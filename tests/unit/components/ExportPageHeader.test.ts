/**
 * Tests for app/components/dashboard/herramientas/exportar/ExportPageHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ExportPageHeader from '../../../app/components/dashboard/herramientas/exportar/ExportPageHeader.vue'

describe('ExportPageHeader', () => {
  const factory = () =>
    shallowMount(ExportPageHeader, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('dashboard.tools.export.title')
  })

  it('shows subtitle', () => {
    expect(factory().find('.subtitle').text()).toBe('dashboard.tools.export.subtitle')
  })

  it('back link points to dashboard', () => {
    expect(factory().find('.btn-back').attributes('href')).toBe('/dashboard')
  })

  it('back link has text', () => {
    expect(factory().find('.btn-back').text()).toBe('dashboard.tools.export.backToDashboard')
  })
})
