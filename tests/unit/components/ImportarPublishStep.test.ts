/**
 * Tests for app/components/dashboard/importar/ImportarPublishStep.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ImportarPublishStep from '../../../app/components/dashboard/importar/ImportarPublishStep.vue'

describe('ImportarPublishStep', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ImportarPublishStep, {
      props: {
        publishing: false,
        progress: 100,
        publishedCount: 5,
        errorCount: 1,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders step section', () => {
    expect(factory().find('.step-section').exists()).toBe(true)
  })

  it('shows publishing title when publishing', () => {
    const w = factory({ publishing: true })
    expect(w.find('h2').text()).toBe('dashboard.import.publishing')
  })

  it('shows success title when done', () => {
    expect(factory().find('h2').text()).toBe('dashboard.import.success')
  })

  it('shows progress bar when publishing', () => {
    const w = factory({ publishing: true, progress: 50 })
    expect(w.find('.progress-bar').exists()).toBe(true)
    expect(w.find('.progress-fill').attributes('style')).toContain('50%')
  })

  it('hides progress bar when done', () => {
    expect(factory().find('.progress-bar').exists()).toBe(false)
  })

  it('shows progress text when publishing', () => {
    const w = factory({ publishing: true, progress: 75 })
    expect(w.find('.progress-text').text()).toBe('75%')
  })

  it('shows result summary when done', () => {
    expect(factory().find('.result-summary').exists()).toBe(true)
  })

  it('shows published count', () => {
    expect(factory().find('.result-value.success').text()).toBe('5')
  })

  it('shows error count when > 0', () => {
    expect(factory().find('.result-value.error').text()).toBe('1')
  })

  it('hides error count when 0', () => {
    const w = factory({ errorCount: 0 })
    expect(w.find('.result-value.error').exists()).toBe(false)
  })

  it('shows back button when done', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
  })

  it('hides back button when publishing', () => {
    expect(factory({ publishing: true }).find('.btn-primary').exists()).toBe(false)
  })

  it('emits navigate-back on back click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('navigate-back')).toBeTruthy()
  })
})
