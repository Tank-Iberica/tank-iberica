/**
 * Tests for app/components/admin/whatsapp/AdminWhatsAppStats.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminWhatsAppStats from '../../../app/components/admin/whatsapp/AdminWhatsAppStats.vue'

describe('AdminWhatsAppStats', () => {
  const statusCounts = { all: 50, received: 10, processing: 5, processed: 15, published: 18, failed: 2 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminWhatsAppStats, {
      props: {
        statusCounts,
        pendingCount: 15,
        ...overrides,
      },
    })

  it('renders stats grid', () => {
    expect(factory().find('.stats-grid').exists()).toBe(true)
  })

  it('renders 5 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(5)
  })

  it('shows total count', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[0].find('.stat-value').text()).toBe('50')
  })

  it('shows pending count', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[1].find('.stat-value').text()).toBe('15')
  })

  it('shows processed count', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[2].find('.stat-value').text()).toBe('15')
  })

  it('shows published count', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[3].find('.stat-value').text()).toBe('18')
  })

  it('shows failed count', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[4].find('.stat-value').text()).toBe('2')
  })

  it('applies stat-pending class', () => {
    expect(factory().find('.stat-pending').exists()).toBe(true)
  })

  it('applies stat-failed class', () => {
    expect(factory().find('.stat-failed').exists()).toBe(true)
  })
})
