/**
 * Tests for app/components/admin/comentarios/LoadingSkeleton.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import LoadingSkeleton from '../../../app/components/admin/comentarios/LoadingSkeleton.vue'

describe('ComentariosLoadingSkeleton', () => {
  const factory = () => shallowMount(LoadingSkeleton)

  it('renders skeleton list', () => {
    expect(factory().find('.skeleton-list').exists()).toBe(true)
  })

  it('renders 5 skeleton cards', () => {
    expect(factory().findAll('.skeleton-card')).toHaveLength(5)
  })

  it('each card has header', () => {
    const cards = factory().findAll('.skeleton-card')
    expect(cards[0].find('.skeleton-header').exists()).toBe(true)
  })

  it('each card has actions', () => {
    const cards = factory().findAll('.skeleton-card')
    expect(cards[0].find('.skeleton-actions').exists()).toBe(true)
  })

  it('actions have 3 buttons', () => {
    const btns = factory().findAll('.skeleton-card')[0].findAll('.skeleton-btn')
    expect(btns).toHaveLength(3)
  })
})
