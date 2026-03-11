/**
 * Tests for app/components/vehicle/DetailNotFound.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DetailNotFound from '../../../app/components/vehicle/DetailNotFound.vue'

describe('DetailNotFound', () => {
  const factory = () =>
    shallowMount(DetailNotFound, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

  it('renders wrapper', () => {
    expect(factory().find('.vehicle-not-found').exists()).toBe(true)
  })

  it('shows not found text', () => {
    expect(factory().text()).toContain('vehicle.notFound')
  })

  it('shows back link text', () => {
    expect(factory().text()).toContain('vehicle.backToCatalog')
  })

  it('back link points to /', () => {
    expect(factory().find('.back-link').attributes('href')).toBe('/')
  })
})
