/**
 * Tests for app/components/admin/servicios/ServiciosTypeTabs.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminServicios', () => ({
  TYPE_TABS: ['all', 'transport', 'transfer', 'insurance', 'contract'] as string[],
}))

import ServiciosTypeTabs from '../../../app/components/admin/servicios/ServiciosTypeTabs.vue'

describe('ServiciosTypeTabs', () => {
  const tabCounts = { all: 42, transport: 15, transfer: 10, insurance: 8, contract: 9 }
  const getTypeIcon = (type: string) => ({ transport: '🚛', transfer: '📄', insurance: '🛡️', contract: '📋' }[type] || '')

  const factory = (activeTab = 'all') =>
    shallowMount(ServiciosTypeTabs, {
      props: { activeTab, tabCounts, getTypeIcon },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders tabs-row', () => {
    const w = factory()
    expect(w.find('.tabs-row').exists()).toBe(true)
  })

  it('renders one button per TYPE_TAB', () => {
    const w = factory()
    expect(w.findAll('.tab-btn')).toHaveLength(5)
  })

  it('active tab has active class', () => {
    const w = factory('transport')
    const btns = w.findAll('.tab-btn')
    expect(btns[1].classes()).toContain('active')
  })

  it('shows count for each tab', () => {
    const w = factory()
    const btns = w.findAll('.tab-btn')
    expect(btns[0].find('.tab-count').text()).toBe('42')
  })

  it('shows icon for non-all tabs', () => {
    const w = factory()
    const btns = w.findAll('.tab-btn')
    expect(btns[0].find('.tab-icon').exists()).toBe(false) // 'all' has no icon
    expect(btns[1].find('.tab-icon').exists()).toBe(true)
  })

  it('emits selectTab on click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[2].trigger('click')
    expect(w.emitted('selectTab')).toBeTruthy()
    expect(w.emitted('selectTab')![0]).toEqual(['transfer'])
  })
})
