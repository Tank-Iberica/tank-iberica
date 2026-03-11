/**
 * Tests for app/components/subastas/SubastasDetailError.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubastasDetailError from '../../../app/components/subastas/SubastasDetailError.vue'

describe('SubastasDetailError', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubastasDetailError, {
      props: { errorMessage: 'Subasta no encontrada', ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders error container', () => {
    expect(factory().find('.auction-detail-error').exists()).toBe(true)
  })

  it('shows error message', () => {
    expect(factory().find('p').text()).toBe('Subasta no encontrada')
  })

  it('shows back to list link', () => {
    const link = factory().find('.btn-back')
    expect(link.text()).toBe('auction.backToList')
  })

  it('links to /subastas', () => {
    expect(factory().find('.btn-back').attributes('href')).toBe('/subastas')
  })
})
