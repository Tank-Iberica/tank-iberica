/**
 * Tests for app/components/datos/DatosCta.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.stubGlobal('useLocalePath', () => (p: string) => p)

import { shallowMount } from '@vue/test-utils'
import DatosCta from '../../../app/components/datos/DatosCta.vue'

describe('DatosCta', () => {
  const factory = () =>
    shallowMount(DatosCta, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders cta section', () => {
    expect(factory().find('.datos-cta').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.datos-cta__title').text()).toBe('data.downloadReport')
  })

  it('shows button', () => {
    expect(factory().find('.datos-cta__button').text()).toBe('data.downloadReport')
  })
})
