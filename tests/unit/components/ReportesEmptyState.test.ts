/**
 * Tests for app/components/admin/reportes/ReportesEmptyState.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ReportesEmptyState from '../../../app/components/admin/reportes/ReportesEmptyState.vue'

describe('ReportesEmptyState', () => {
  const factory = (activeFilter = 'all') =>
    shallowMount(ReportesEmptyState, {
      props: { activeFilter },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders empty-state-container', () => {
    const w = factory()
    expect(w.find('.empty-state-container').exists()).toBe(true)
  })

  it('shows empty icon SVG', () => {
    const w = factory()
    expect(w.find('.empty-icon svg').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('.empty-title').text()).toBe('report.admin.noReports')
  })

  it('shows generic message when filter is all', () => {
    const w = factory('all')
    expect(w.find('.empty-description').text()).toBe('report.admin.noReportsYet')
  })

  it('shows filtered message when filter is not all', () => {
    const w = factory('pending')
    expect(w.find('.empty-description').text()).toBe('report.admin.noReportsFiltered')
  })
})
