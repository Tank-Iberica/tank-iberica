/**
 * Tests for app/components/dashboard/importar/ImportarPageHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ImportarPageHeader from '../../../app/components/dashboard/importar/ImportarPageHeader.vue'

describe('ImportarPageHeader', () => {
  const factory = () =>
    shallowMount(ImportarPageHeader, {
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
    expect(factory().find('h1').text()).toBe('dashboard.import.title')
  })

  it('shows subtitle', () => {
    expect(factory().find('.subtitle').text()).toBe('dashboard.import.subtitle')
  })

  it('back link points to vehiculos', () => {
    expect(factory().find('.back-link').attributes('href')).toBe('/dashboard/vehiculos')
  })

  it('back link has text', () => {
    expect(factory().find('.back-link').text()).toBe('common.back')
  })
})
