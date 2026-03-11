/**
 * Tests for app/components/admin/reportes/ReportesFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ReportesFilters from '../../../app/components/admin/reportes/ReportesFilters.vue'

describe('ReportesFilters', () => {
  const filters = [
    { value: 'all', labelKey: 'report.admin.filterAll' },
    { value: 'pending', labelKey: 'report.admin.filterPending' },
    { value: 'reviewing', labelKey: 'report.admin.filterReviewing' },
    { value: 'resolved_removed', labelKey: 'report.admin.filterRemoved' },
    { value: 'resolved_kept', labelKey: 'report.admin.filterKept' },
  ]

  const factory = (activeFilter = 'all') =>
    shallowMount(ReportesFilters, {
      props: { activeFilter, filters },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders filters-bar', () => {
    const w = factory()
    expect(w.find('.filters-bar').exists()).toBe(true)
  })

  it('renders one button per filter', () => {
    const w = factory()
    expect(w.findAll('.filter-btn')).toHaveLength(5)
  })

  it('shows translated labels', () => {
    const w = factory()
    const btns = w.findAll('.filter-btn')
    expect(btns[0].text()).toBe('report.admin.filterAll')
    expect(btns[1].text()).toBe('report.admin.filterPending')
  })

  it('active filter has active class', () => {
    const w = factory('pending')
    const btns = w.findAll('.filter-btn')
    expect(btns[1].classes()).toContain('active')
  })

  it('non-active filters do not have active class', () => {
    const w = factory('pending')
    const btns = w.findAll('.filter-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[2].classes()).not.toContain('active')
  })

  it('emits update:activeFilter on button click', async () => {
    const w = factory()
    await w.findAll('.filter-btn')[2].trigger('click')
    expect(w.emitted('update:activeFilter')).toBeTruthy()
    expect(w.emitted('update:activeFilter')![0]).toEqual(['reviewing'])
  })
})
