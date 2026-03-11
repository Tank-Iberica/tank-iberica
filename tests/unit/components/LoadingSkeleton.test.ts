/**
 * Tests for app/components/admin/comentarios/LoadingSkeleton.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LoadingSkeleton from '../../../app/components/admin/comentarios/LoadingSkeleton.vue'

describe('LoadingSkeleton (comentarios)', () => {
  it('renders skeleton list container', () => {
    const w = shallowMount(LoadingSkeleton)
    expect(w.find('.skeleton-list').exists()).toBe(true)
  })

  it('renders 5 skeleton cards', () => {
    const w = shallowMount(LoadingSkeleton)
    expect(w.findAll('.skeleton-card')).toHaveLength(5)
  })

  it('each card has a header section', () => {
    const w = shallowMount(LoadingSkeleton)
    expect(w.findAll('.skeleton-header')).toHaveLength(5)
  })

  it('each card has an actions section', () => {
    const w = shallowMount(LoadingSkeleton)
    expect(w.findAll('.skeleton-actions')).toHaveLength(5)
  })

  it('each card has skeleton lines for content', () => {
    const w = shallowMount(LoadingSkeleton)
    const card = w.findAll('.skeleton-card')[0]
    expect(card.find('.skeleton-long').exists()).toBe(true)
    expect(card.find('.skeleton-medium').exists()).toBe(true)
  })

  it('each actions section has 3 button skeletons', () => {
    const w = shallowMount(LoadingSkeleton)
    const actions = w.findAll('.skeleton-actions')[0]
    expect(actions.findAll('.skeleton-btn')).toHaveLength(3)
  })
})
