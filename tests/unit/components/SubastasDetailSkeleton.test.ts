/**
 * Tests for app/components/subastas/SubastasDetailSkeleton.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SubastasDetailSkeleton from '../../../app/components/subastas/SubastasDetailSkeleton.vue'

describe('SubastasDetailSkeleton', () => {
  it('renders loading container', () => {
    const w = shallowMount(SubastasDetailSkeleton)
    expect(w.find('.auction-detail-loading').exists()).toBe(true)
  })

  it('renders hero skeleton', () => {
    const w = shallowMount(SubastasDetailSkeleton)
    expect(w.find('.skeleton-hero').exists()).toBe(true)
  })

  it('renders 3 skeleton lines', () => {
    const w = shallowMount(SubastasDetailSkeleton)
    expect(w.findAll('.skeleton-line')).toHaveLength(3)
  })

  it('has wide, medium, and narrow lines', () => {
    const w = shallowMount(SubastasDetailSkeleton)
    expect(w.find('.skeleton-line.wide').exists()).toBe(true)
    expect(w.find('.skeleton-line.medium').exists()).toBe(true)
    expect(w.find('.skeleton-line.narrow').exists()).toBe(true)
  })
})
