import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'

// Override setup.ts stubs with real Vue APIs for SFC component testing.
// Real ref/computed needed for reactive template evaluation (v-if unwrap).
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

const mockIsOnline = ref(true)
const mockPendingCount = ref(0)

vi.stubGlobal('useOfflineSync', () => ({
  isOnline: mockIsOnline,
  pendingCount: mockPendingCount,
}))

import OfflineBanner from '../../../app/components/ui/OfflineBanner.vue'

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockIsOnline.value = true
    mockPendingCount.value = 0
  })

  describe('Connectivity detection', () => {
    it('does not show when online', () => {
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-banner').exists()).toBe(false)
    })

    it('shows banner when offline', () => {
      mockIsOnline.value = false
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-banner').exists()).toBe(true)
    })

    it('hides when connectivity is restored', async () => {
      mockIsOnline.value = false
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-banner').exists()).toBe(true)

      mockIsOnline.value = true
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.offline-banner').exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('has role=alert', () => {
      mockIsOnline.value = false
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-banner').attributes('role')).toBe('alert')
    })

    it('has aria-live=assertive', () => {
      mockIsOnline.value = false
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-banner').attributes('aria-live')).toBe('assertive')
    })

    it('SVG icon is aria-hidden', () => {
      mockIsOnline.value = false
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Content', () => {
    it('displays offline message text', () => {
      mockIsOnline.value = false
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-text').exists()).toBe(true)
    })

    it('shows pending count when > 0', () => {
      mockIsOnline.value = false
      mockPendingCount.value = 3
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-pending').exists()).toBe(true)
    })

    it('hides pending count when 0', () => {
      mockIsOnline.value = false
      mockPendingCount.value = 0
      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('.offline-pending').exists()).toBe(false)
    })
  })
})
