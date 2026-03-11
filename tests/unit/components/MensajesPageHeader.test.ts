/**
 * Tests for app/components/perfil/mensajes/MensajesPageHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import MensajesPageHeader from '../../../app/components/perfil/mensajes/MensajesPageHeader.vue'

describe('MensajesPageHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MensajesPageHeader, {
      props: {
        unreadCount: 0,
        mobileShowConversation: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders mobile header when not showing conversation', () => {
    expect(factory().find('.messages-header--mobile').exists()).toBe(true)
  })

  it('hides mobile header when showing conversation', () => {
    expect(factory({ mobileShowConversation: true }).find('.messages-header--mobile').exists()).toBe(false)
  })

  it('always renders desktop header', () => {
    expect(factory().find('.messages-header--desktop').exists()).toBe(true)
    expect(factory({ mobileShowConversation: true }).find('.messages-header--desktop').exists()).toBe(true)
  })

  it('shows page title', () => {
    expect(factory().find('.page-title').text()).toBe('messages.pageTitle')
  })

  it('hides unread badge when count is 0', () => {
    expect(factory().find('.unread-global-badge').exists()).toBe(false)
  })

  it('shows unread badge when count > 0', () => {
    const w = factory({ unreadCount: 5 })
    const badges = w.findAll('.unread-global-badge')
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0].text()).toBe('5')
  })
})
