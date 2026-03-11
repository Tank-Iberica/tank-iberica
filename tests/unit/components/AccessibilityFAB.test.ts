/**
 * Tests for app/components/AccessibilityFAB.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed } from 'vue'

const mockSetFontSize = vi.fn()
const mockColorMode = { preference: 'system', value: 'light' }

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useAccessibility', () => ({
    colorMode: mockColorMode,
    fontSize: ref('normal'),
    setFontSize: mockSetFontSize,
  }))
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onBeforeUnmount', vi.fn())
})

import AccessibilityFAB from '../../../app/components/AccessibilityFAB.vue'

describe('AccessibilityFAB', () => {
  const factory = () =>
    shallowMount(AccessibilityFAB, {
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders fab wrapper', () => {
    const w = factory()
    expect(w.find('.a11y-fab-wrapper').exists()).toBe(true)
  })

  it('renders FAB button', () => {
    const w = factory()
    expect(w.find('.a11y-fab').exists()).toBe(true)
  })

  it('FAB has aria-label', () => {
    const w = factory()
    expect(w.find('.a11y-fab').attributes('aria-label')).toBe('a11y.fabLabel')
  })

  it('FAB has aria-expanded false initially', () => {
    const w = factory()
    expect(w.find('.a11y-fab').attributes('aria-expanded')).toBe('false')
  })

  it('panel is hidden by default', () => {
    const w = factory()
    expect(w.find('.a11y-panel').exists()).toBe(false)
  })

  it('opens panel on FAB click', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-panel').exists()).toBe(true)
  })

  it('closes panel on second FAB click', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-panel').exists()).toBe(false)
  })

  it('FAB gets open class when panel is open', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-fab--open').exists()).toBe(true)
  })

  it('panel has dialog role', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-panel').attributes('role')).toBe('dialog')
  })

  it('panel has aria-modal', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-panel').attributes('aria-modal')).toBe('true')
  })

  it('shows panel title', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-panel__title').text()).toBe('a11y.panelTitle')
  })

  it('renders 4 theme mode chips', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.findAll('.a11y-chip')).toHaveLength(4)
  })

  it('renders 3 font size buttons', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.findAll('.a11y-size')).toHaveLength(3)
  })

  it('close button closes panel', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-panel').exists()).toBe(true)
    await w.find('.a11y-panel__close').trigger('click')
    expect(w.find('.a11y-panel').exists()).toBe(false)
  })

  it('theme chip has radiogroup role', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-chips').attributes('role')).toBe('radiogroup')
  })

  it('font sizes section has radiogroup role', async () => {
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    expect(w.find('.a11y-sizes').attributes('role')).toBe('radiogroup')
  })

  it('system chip is active by default', async () => {
    mockColorMode.preference = 'system'
    const w = factory()
    await w.find('.a11y-fab').trigger('click')
    const chips = w.findAll('.a11y-chip')
    expect(chips[0].classes()).toContain('a11y-chip--active')
  })
})
