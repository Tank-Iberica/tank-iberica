/**
 * Tests for UiLastUpdated component.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UiLastUpdated from '../../../app/components/ui/UiLastUpdated.vue'

// Mock useI18n — handles both t(key, fallback) and t(key, params)
vi.stubGlobal('useI18n', () => ({
  t: (key: string, fallbackOrParams?: string | Record<string, unknown>, params?: Record<string, unknown>) => {
    // t(key, { n }) — params as 2nd arg
    if (typeof fallbackOrParams === 'object' && fallbackOrParams?.n !== undefined) {
      return `${fallbackOrParams.n} min`
    }
    // t(key, fallback, { n }) — params as 3rd arg
    if (params?.n !== undefined) return `${params.n} min`
    // t(key, fallback) — return fallback string
    if (typeof fallbackOrParams === 'string') return fallbackOrParams
    return key
  },
}))

describe('UiLastUpdated', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-17T14:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows "just now" for timestamps less than 1 min ago', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: new Date('2026-03-17T14:29:30Z') },
    })
    expect(wrapper.text()).toContain('Ahora mismo')
  })

  it('shows minutes ago for recent timestamps', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: new Date('2026-03-17T14:25:00Z') },
    })
    expect(wrapper.text()).toContain('5 min')
  })

  it('shows time for today timestamps older than 1h', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: new Date('2026-03-17T10:00:00Z') },
    })
    // Should show a time like "10:00" or "10:00 AM"
    expect(wrapper.text()).toMatch(/\d{1,2}:\d{2}/)
  })

  it('shows date for older timestamps', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: new Date('2026-03-15T10:00:00Z') },
    })
    // Should show a date like "15 Mar" or "Mar 15"
    expect(wrapper.text()).toMatch(/\d{1,2}/)
  })

  it('shows fallback for null timestamp', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: null },
    })
    expect(wrapper.text()).toContain('Sin datos')
  })

  it('accepts string timestamps', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: '2026-03-17T14:29:00Z' },
    })
    expect(wrapper.text()).toContain('1 min')
  })

  it('accepts numeric timestamps', () => {
    const ts = new Date('2026-03-17T14:20:00Z').getTime()
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: ts },
    })
    expect(wrapper.text()).toContain('10 min')
  })

  it('has title attribute with full date', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: new Date('2026-03-17T14:00:00Z') },
    })
    expect(wrapper.attributes('title')).toBeTruthy()
  })

  it('renders clock SVG icon', () => {
    const wrapper = mount(UiLastUpdated, {
      props: { timestamp: new Date() },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
