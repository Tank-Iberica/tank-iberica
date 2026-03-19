import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, watch, onUnmounted } from 'vue'

// Override setup.ts stubs with real Vue APIs for SFC component testing.
// SFC <script setup> resolves bare ref/watch/onUnmounted to globalThis,
// which by default are plain stubs. Real Vue APIs are needed for:
// - ref: creates Ref with __v_isRef so v-if unwraps correctly
// - watch: actually observes prop changes and fires callbacks
// - onUnmounted: registers cleanup on component unmount
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onUnmounted', onUnmounted)

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => {
    const map: Record<string, string> = {
      'common.operationInProgress': 'Operación en curso...',
    }
    return map[key] ?? key
  },
}))

import OperationBanner from '../../../app/components/ui/OperationBanner.vue'

describe('UiOperationBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when active is false', () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    expect(wrapper.find('.op-banner').exists()).toBe(false)
  })

  it('shows banner after delay when active', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(wrapper.find('.op-banner').exists()).toBe(true)
  })

  it('respects custom delay prop', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false, delay: 500 },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(wrapper.find('.op-banner').exists()).toBe(true)
  })

  it('does not show before delay elapses', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
    expect(wrapper.find('.op-banner').exists()).toBe(false)
  })

  it('shows custom message', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false, message: 'Saving...' },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(wrapper.find('.op-banner__text').text()).toBe('Saving...')
  })

  it('falls back to i18n message when no message prop', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(wrapper.find('.op-banner__text').text()).toBe('Operación en curso...')
  })

  it('shows spinner with aria-hidden', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    const spinner = wrapper.find('.op-banner__spinner')
    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('aria-hidden')).toBe('true')
  })

  it('has role=status and aria-live=polite', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    const banner = wrapper.find('.op-banner')
    expect(banner.attributes('role')).toBe('status')
    expect(banner.attributes('aria-live')).toBe('polite')
  })

  it('hides banner when active becomes false', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(wrapper.find('.op-banner').exists()).toBe(true)

    await wrapper.setProps({ active: false })
    await flushPromises()
    expect(wrapper.find('.op-banner').exists()).toBe(false)
  })

  it('cancels timer when active becomes false before delay', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.setProps({ active: false })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(wrapper.find('.op-banner').exists()).toBe(false)
  })

  it('does not leak timer on unmount', async () => {
    const wrapper = mount(OperationBanner, {
      props: { active: false },
    })
    await wrapper.setProps({ active: true })
    wrapper.unmount()
    // Should not throw after unmount
    vi.advanceTimersByTime(5000)
  })
})
