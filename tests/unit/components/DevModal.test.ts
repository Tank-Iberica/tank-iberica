/**
 * Tests for app/components/modals/DevModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.stubGlobal('useFocusTrap', () => ({ activate: vi.fn(), deactivate: vi.fn() }))

import DevModal from '../../../app/components/modals/DevModal.vue'

describe('DevModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DevModal, {
      props: {
        modelValue: true,
        ...overrides,
      },
      global: {
        mocks: {
          $t: (k: string, params?: Record<string, string>) =>
            params ? `${k}:${JSON.stringify(params)}` : k,
        },
        stubs: { Teleport: true, Transition: true },
      },
    })

  it('renders modal when modelValue=true', () => {
    expect(factory().find('.dev-backdrop').exists()).toBe(true)
  })

  it('does not render when modelValue=false', () => {
    const w = factory({ modelValue: false })
    expect(w.find('.dev-backdrop').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.dev-title').text()).toBe('dev.title')
  })

  it('shows generic message when no featureName', () => {
    expect(factory().find('.dev-message').text()).toBe('dev.message')
  })

  it('shows feature-specific message when featureName provided', () => {
    const w = factory({ featureName: 'Subastas' })
    expect(w.find('.dev-message').text()).toContain('dev.featureMessage')
    expect(w.find('.dev-message').text()).toContain('Subastas')
  })

  it('shows close button', () => {
    expect(factory().find('.dev-btn').text()).toBe('common.close')
  })

  it('emits update:modelValue false on close button click', async () => {
    const w = factory()
    await w.find('.dev-btn').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('emits update:modelValue false on X button click', async () => {
    const w = factory()
    await w.find('.dev-close').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('shows dev icon', () => {
    expect(factory().find('.dev-icon svg').exists()).toBe(true)
  })
})
