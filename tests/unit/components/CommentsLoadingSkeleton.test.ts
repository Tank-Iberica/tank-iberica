/**
 * Tests for app/components/admin/comentarios/LoadingSkeleton.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LoadingSkeleton from '../../../app/components/admin/comentarios/LoadingSkeleton.vue'

describe('CommentsLoadingSkeleton', () => {
  const factory = () => shallowMount(LoadingSkeleton)

  it('renders skeleton list', () => {
    expect(factory().find('.skeleton-list').exists()).toBe(true)
  })

  it('renders 5 skeleton cards', () => {
    expect(factory().findAll('.skeleton-card')).toHaveLength(5)
  })

  it('each card has a header', () => {
    const cards = factory().findAll('.skeleton-card')
    cards.forEach((card) => {
      expect(card.find('.skeleton-header').exists()).toBe(true)
    })
  })

  it('each card has actions section', () => {
    const cards = factory().findAll('.skeleton-card')
    cards.forEach((card) => {
      expect(card.find('.skeleton-actions').exists()).toBe(true)
    })
  })

  it('each card has 3 action buttons', () => {
    const card = factory().findAll('.skeleton-card')[0]
    expect(card.findAll('.skeleton-btn')).toHaveLength(3)
  })
})
