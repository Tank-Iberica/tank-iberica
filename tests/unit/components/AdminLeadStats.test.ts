/**
 * Tests for app/components/admin/captacion/AdminLeadStats.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import AdminLeadStats from '../../../app/components/admin/captacion/AdminLeadStats.vue'

describe('AdminLeadStats', () => {
  const stats = { total: 100, new: 20, contacted: 30, interested: 25, active: 25 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminLeadStats, {
      props: { stats, ...overrides },
    })

  it('renders stats row', () => {
    expect(factory().find('.stats-row').exists()).toBe(true)
  })

  it('renders 5 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(5)
  })

  it('shows total value', () => {
    const values = factory().findAll('.stat-value')
    expect(values[0].text()).toBe('100')
  })

  it('shows new count', () => {
    const values = factory().findAll('.stat-value')
    expect(values[1].text()).toBe('20')
  })

  it('shows labels', () => {
    const labels = factory().findAll('.stat-label')
    expect(labels[0].text()).toBe('admin.captacion.totalLeads')
    expect(labels[1].text()).toBe('admin.captacion.newCount')
  })

  it('has colored stat cards', () => {
    const cards = factory().findAll('.stat-card')
    expect(cards[1].classes()).toContain('stat-new')
    expect(cards[2].classes()).toContain('stat-contacted')
  })
})
