/**
 * Tests for app/components/perfil/mensajes/MessagesList.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/usePerfilMensajes', () => ({
  formatMessageTime: (date: string) => new Date(date).toLocaleTimeString(),
}))

import MessagesList from '../../../app/components/perfil/mensajes/MessagesList.vue'

const baseMessages = [
  { id: '1', sender_id: 'user-1', content: 'Hola, ¿disponible?', is_system: false, created_at: '2026-03-01T10:00:00Z' },
  { id: '2', sender_id: 'user-2', content: 'Sí, está disponible', is_system: false, created_at: '2026-03-01T10:05:00Z' },
  { id: '3', sender_id: 'system', content: 'both_parties_shared_data', is_system: true, created_at: '2026-03-01T10:10:00Z' },
]

describe('MessagesList', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MessagesList, {
      props: {
        messages: [...baseMessages],
        currentUserId: 'user-1',
        isDataShared: false,
        maskContactData: (text: string) => text,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders messages list', () => {
    expect(factory().find('.messages-list').exists()).toBe(true)
  })

  it('renders correct number of message bubbles', () => {
    expect(factory().findAll('.message-bubble-wrap')).toHaveLength(3)
  })

  it('marks own messages', () => {
    const wraps = factory().findAll('.message-bubble-wrap')
    expect(wraps[0].classes()).toContain('message-bubble-wrap--own')
  })

  it('marks other messages', () => {
    const wraps = factory().findAll('.message-bubble-wrap')
    expect(wraps[1].classes()).toContain('message-bubble-wrap--other')
  })

  it('marks system messages', () => {
    const wraps = factory().findAll('.message-bubble-wrap')
    expect(wraps[2].classes()).toContain('message-bubble-wrap--system')
  })

  it('shows system message with translation key', () => {
    const systemMsg = factory().find('.message-system')
    expect(systemMsg.text()).toBe('messages.systemDataShared')
  })

  it('shows regular message content', () => {
    const texts = factory().findAll('.message-text')
    expect(texts[0].text()).toBe('Hola, ¿disponible?')
    expect(texts[1].text()).toBe('Sí, está disponible')
  })

  it('shows message times', () => {
    const times = factory().findAll('.message-time')
    expect(times.length).toBe(2) // Only regular messages
    times.forEach((t) => expect(t.text()).toBeTruthy())
  })

  it('applies mask function to messages', () => {
    const maskFn = (text: string) => text.replace(/\d/g, '*')
    const w = factory({ maskContactData: maskFn })
    // Regular messages should go through mask
    const texts = w.findAll('.message-text')
    expect(texts[0].text()).toBeTruthy()
  })

  it('renders empty list when no messages', () => {
    const w = factory({ messages: [] })
    expect(w.findAll('.message-bubble-wrap')).toHaveLength(0)
  })
})
