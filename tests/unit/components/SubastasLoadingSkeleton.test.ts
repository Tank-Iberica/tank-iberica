/**
 * Tests for app/components/subastas/index/SubastasLoadingSkeleton.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SubastasLoadingSkeleton from '../../../app/components/subastas/index/SubastasLoadingSkeleton.vue'

describe('SubastasLoadingSkeleton', () => {
  const factory = () => shallowMount(SubastasLoadingSkeleton)

  it('renders loading container', () => {
    expect(factory().find('.auctions-loading').exists()).toBe(true)
  })

  it('renders 6 skeleton cards', () => {
    expect(factory().findAll('.skeleton-card')).toHaveLength(6)
  })

  it('each card has skeleton image', () => {
    expect(factory().findAll('.skeleton-img')).toHaveLength(6)
  })

  it('each card has 3 skeleton lines', () => {
    // 6 cards × 3 lines = 18
    expect(factory().findAll('.skeleton-line')).toHaveLength(18)
  })

  it('has wide, medium, and narrow lines per card', () => {
    expect(factory().findAll('.skeleton-line.wide')).toHaveLength(6)
    expect(factory().findAll('.skeleton-line.medium')).toHaveLength(6)
    expect(factory().findAll('.skeleton-line.narrow')).toHaveLength(6)
  })
})
