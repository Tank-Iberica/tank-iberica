/**
 * Tests for app/components/admin/dashboard/DashboardHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DashboardHeader from '../../../app/components/admin/dashboard/DashboardHeader.vue'

describe('AdminDashboardHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardHeader, {
      props: {
        loading: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.page-title').text()).toBeTruthy()
  })

  it('shows export button', () => {
    expect(factory().find('.btn-export').exists()).toBe(true)
  })

  it('disables export button when loading', () => {
    expect(factory({ loading: true }).find('.btn-export').attributes('disabled')).toBeDefined()
  })

  it('enables export button when not loading', () => {
    expect(factory().find('.btn-export').attributes('disabled')).toBeUndefined()
  })

  it('emits export on button click', async () => {
    const w = factory()
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })
})
