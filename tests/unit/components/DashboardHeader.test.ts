/**
 * Tests for app/components/admin/dashboard/DashboardHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DashboardHeader from '../../../app/components/admin/dashboard/DashboardHeader.vue'

describe('DashboardHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardHeader, {
      props: { loading: false, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders page header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.page-title').text()).toBe('admin.metrics.title')
  })

  it('shows export button', () => {
    expect(factory().find('.btn-export').text()).toContain('admin.metrics.exportCsv')
  })

  it('disables export button when loading', () => {
    const btn = factory({ loading: true }).find('.btn-export')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables export button when not loading', () => {
    const btn = factory({ loading: false }).find('.btn-export')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('emits export on button click', async () => {
    const w = factory()
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })

  it('shows SVG icon in button', () => {
    expect(factory().find('.btn-icon').exists()).toBe(true)
  })
})
