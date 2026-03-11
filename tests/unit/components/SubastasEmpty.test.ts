/**
 * Tests for app/components/subastas/index/SubastasEmpty.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubastasEmpty from '../../../app/components/subastas/index/SubastasEmpty.vue'

describe('SubastasEmpty', () => {
  const factory = (msg = 'No hay subastas activas') =>
    shallowMount(SubastasEmpty, {
      props: { message: msg },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders empty state', () => {
    expect(factory().find('.auctions-empty').exists()).toBe(true)
  })

  it('shows message', () => {
    expect(factory().find('.empty-title').text()).toBe('No hay subastas activas')
  })

  it('shows subtitle', () => {
    expect(factory().find('.empty-subtitle').text()).toBe('auction.emptySubtitle')
  })

  it('shows icon', () => {
    expect(factory().find('.empty-icon svg').exists()).toBe(true)
  })
})
