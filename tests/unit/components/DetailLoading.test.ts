/**
 * Tests for app/components/vehicle/DetailLoading.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DetailLoading from '../../../app/components/vehicle/DetailLoading.vue'

describe('DetailLoading', () => {
  const factory = () => shallowMount(DetailLoading)

  it('renders wrapper', () => {
    expect(factory().find('.vehicle-loading').exists()).toBe(true)
  })

  it('renders skeleton gallery', () => {
    expect(factory().find('.skeleton-gallery').exists()).toBe(true)
  })

  it('renders skeleton info', () => {
    expect(factory().find('.skeleton-info').exists()).toBe(true)
  })

  it('renders 3 skeleton lines', () => {
    expect(factory().findAll('.skeleton-line')).toHaveLength(3)
  })

  it('has wide, medium, short lines', () => {
    const w = factory()
    expect(w.find('.skeleton-line.wide').exists()).toBe(true)
    expect(w.find('.skeleton-line.medium').exists()).toBe(true)
    expect(w.find('.skeleton-line.short').exists()).toBe(true)
  })
})
