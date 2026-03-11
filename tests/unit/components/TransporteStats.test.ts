/**
 * Tests for app/components/admin/transporte/TransporteStats.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TransporteStats from '../../../app/components/admin/transporte/TransporteStats.vue'

describe('TransporteStats', () => {
  const stats = { total: 50, pending: 8, inTransit: 12, completedThisMonth: 30 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransporteStats, {
      props: { stats, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders stats row', () => {
    expect(factory().find('.stats-row').exists()).toBe(true)
  })

  it('renders 4 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(4)
  })

  it('shows total', () => {
    expect(factory().findAll('.stat-value')[0].text()).toBe('50')
  })

  it('shows pending', () => {
    expect(factory().find('.stat-pending .stat-value').text()).toBe('8')
  })

  it('shows in transit', () => {
    expect(factory().find('.stat-transit .stat-value').text()).toBe('12')
  })

  it('shows completed this month', () => {
    expect(factory().find('.stat-completed .stat-value').text()).toBe('30')
  })
})
