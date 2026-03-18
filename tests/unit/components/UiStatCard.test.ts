/**
 * Tests for UiStatCard and UiFilterBar components.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiStatCard from '../../../app/components/ui/UiStatCard.vue'
import UiFilterBar from '../../../app/components/ui/UiFilterBar.vue'

const NuxtLinkStub = {
  template: '<a :href="to" class="nuxt-link"><slot /></a>',
  props: ['to'],
}

describe('UiStatCard', () => {
  const stubs = { NuxtLink: NuxtLinkStub }

  it('renders value and label', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 42, label: 'Vehicles' },
      global: { stubs },
    })
    expect(wrapper.find('.stat-card-value').text()).toBe('42')
    expect(wrapper.find('.stat-card-label').text()).toBe('Vehicles')
  })

  it('renders icon when provided', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 10, label: 'Items', icon: '📦' },
      global: { stubs },
    })
    expect(wrapper.find('.stat-card-icon').text()).toContain('📦')
  })

  it('shows positive trend', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 100, label: 'Sales', trend: 15 },
      global: { stubs },
    })
    const trend = wrapper.find('.stat-card-trend')
    expect(trend.text()).toBe('+15%')
    expect(trend.classes()).toContain('stat-card-trend--up')
  })

  it('shows negative trend', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 50, label: 'Views', trend: -8 },
      global: { stubs },
    })
    const trend = wrapper.find('.stat-card-trend')
    expect(trend.text()).toBe('-8%')
    expect(trend.classes()).toContain('stat-card-trend--down')
  })

  it('shows neutral trend for zero', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 50, label: 'Views', trend: 0 },
      global: { stubs },
    })
    expect(wrapper.find('.stat-card-trend').classes()).toContain('stat-card-trend--neutral')
  })

  it('renders as NuxtLink when to prop provided', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 5, label: 'Alerts', to: '/dashboard' },
      global: { stubs },
    })
    expect(wrapper.find('.nuxt-link').exists()).toBe(true)
    expect(wrapper.classes()).toContain('stat-card--clickable')
  })

  it('hides trend when not provided', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: 5, label: 'Items' },
      global: { stubs },
    })
    expect(wrapper.find('.stat-card-trend').exists()).toBe(false)
  })

  it('accepts string value', () => {
    const wrapper = mount(UiStatCard, {
      props: { value: '€1,234', label: 'Revenue' },
      global: { stubs },
    })
    expect(wrapper.find('.stat-card-value').text()).toBe('€1,234')
  })
})

describe('UiFilterBar', () => {
  const mocks = {
    $t: (_key: string, fallback: string) => fallback,
  }

  it('renders slot content', () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      slots: { default: '<select class="test-filter"><option>All</option></select>' },
    })
    expect(wrapper.find('.test-filter').exists()).toBe(true)
  })

  it('hides reset button when showReset is false', () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      props: { showReset: false },
    })
    expect(wrapper.find('.filter-bar-reset').exists()).toBe(false)
  })

  it('shows reset button when showReset and hasActiveFilters', () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      props: { showReset: true, hasActiveFilters: true },
    })
    expect(wrapper.find('.filter-bar-reset').exists()).toBe(true)
    expect(wrapper.find('.filter-bar-reset').text()).toBe('Limpiar filtros')
  })

  it('hides reset when no active filters', () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      props: { showReset: true, hasActiveFilters: false },
    })
    expect(wrapper.find('.filter-bar-reset').exists()).toBe(false)
  })

  it('emits reset on button click', async () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      props: { showReset: true, hasActiveFilters: true },
    })
    await wrapper.find('.filter-bar-reset').trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('uses custom reset label', () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      props: { showReset: true, hasActiveFilters: true, resetLabel: 'Clear' },
    })
    expect(wrapper.find('.filter-bar-reset').text()).toBe('Clear')
  })

  it('has toolbar role and aria-label', () => {
    const wrapper = mount(UiFilterBar, {
      global: { mocks },
      props: { ariaLabel: 'Vehicle filters' },
    })
    expect(wrapper.attributes('role')).toBe('toolbar')
    expect(wrapper.attributes('aria-label')).toBe('Vehicle filters')
  })
})
