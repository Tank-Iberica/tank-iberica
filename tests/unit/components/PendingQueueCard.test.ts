/**
 * Tests for app/components/admin/config/languages/PendingQueueCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PendingQueueCard from '../../../app/components/admin/config/languages/PendingQueueCard.vue'

describe('PendingQueueCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PendingQueueCard, {
      props: {
        pendingVehicles: 5,
        pendingArticles: 3,
        translating: false,
        translateSuccess: false,
        translateDisabled: false,
        showApiKeyHint: false,
        ...overrides,
      },
    })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.configLanguages.pendingQueueTitle')
  })

  it('shows vehicle count', () => {
    const counts = factory().findAll('.pending-count')
    expect(counts[0].text()).toBe('5')
  })

  it('shows article count', () => {
    const counts = factory().findAll('.pending-count')
    expect(counts[1].text()).toBe('3')
  })

  it('shows success banner when translateSuccess', () => {
    expect(factory({ translateSuccess: true }).find('.success-banner').exists()).toBe(true)
  })

  it('hides success banner by default', () => {
    expect(factory().find('.success-banner').exists()).toBe(false)
  })

  it('button shows translating text', () => {
    expect(factory({ translating: true }).find('.btn-translate').text()).toBe('admin.configLanguages.translating')
  })

  it('button shows default text', () => {
    expect(factory().find('.btn-translate').text()).toBe('admin.configLanguages.translateNow')
  })

  it('button disabled when translateDisabled', () => {
    expect(factory({ translateDisabled: true }).find('.btn-translate').attributes('disabled')).toBeDefined()
  })

  it('button disabled when translating', () => {
    expect(factory({ translating: true }).find('.btn-translate').attributes('disabled')).toBeDefined()
  })

  it('shows API key hint', () => {
    expect(factory({ showApiKeyHint: true }).find('.hint-text').exists()).toBe(true)
  })

  it('hides API key hint by default', () => {
    expect(factory().find('.hint-text').exists()).toBe(false)
  })

  it('emits translate-all on click', async () => {
    const w = factory()
    await w.find('.btn-translate').trigger('click')
    expect(w.emitted('translate-all')).toBeTruthy()
  })
})
