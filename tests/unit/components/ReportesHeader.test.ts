/**
 * Tests for app/components/admin/reportes/ReportesHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ReportesHeader from '../../../app/components/admin/reportes/ReportesHeader.vue'

describe('ReportesHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ReportesHeader, {
      props: {
        loading: false,
        reportsCount: 42,
        pendingCount: 5,
        activeFilter: 'all',
        ...overrides,
      },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders section-header', () => {
    const w = factory()
    expect(w.find('.section-header').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('h2').text()).toBe('report.admin.title')
  })

  it('shows total badge when not loading', () => {
    const w = factory()
    expect(w.find('.total-badge').text()).toContain('42')
    expect(w.find('.total-badge').text()).toContain('total')
  })

  it('hides total badge when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.total-badge').exists()).toBe(false)
  })

  it('shows pending badge when pendingCount > 0 and filter is all', () => {
    const w = factory()
    expect(w.find('.pending-badge').exists()).toBe(true)
    expect(w.find('.pending-badge').text()).toContain('5')
    expect(w.find('.pending-badge').text()).toContain('report.admin.filterPending')
  })

  it('hides pending badge when pendingCount is 0', () => {
    const w = factory({ pendingCount: 0 })
    expect(w.find('.pending-badge').exists()).toBe(false)
  })

  it('hides pending badge when filter is not all', () => {
    const w = factory({ activeFilter: 'pending' })
    expect(w.find('.pending-badge').exists()).toBe(false)
  })
})
