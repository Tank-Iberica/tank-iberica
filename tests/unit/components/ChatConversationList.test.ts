/**
 * Tests for app/components/admin/chats/ChatConversationList.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ChatConversationList from '../../../app/components/admin/chats/ChatConversationList.vue'

describe('ChatConversationList', () => {
  const conversations = [
    {
      user: { id: 'u-1', name: 'Juan López', avatar_url: 'https://example.com/juan.jpg' },
      lastMessage: { content: 'Hola, me interesa', created_at: '2026-03-01', direction: 'user_to_admin' },
      unreadCount: 2,
    },
    {
      user: { id: 'u-2', name: 'Ana García', avatar_url: null },
      lastMessage: { content: 'Gracias', created_at: '2026-02-28', direction: 'admin_to_user' },
      unreadCount: 0,
    },
    {
      user: { id: 'u-3', name: 'Pedro', avatar_url: null },
      lastMessage: null,
      unreadCount: 0,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ChatConversationList, {
      props: {
        conversations,
        activeUserId: null,
        searchQuery: '',
        getUserDisplayName: (u: { name: string }) => u.name,
        getUserInitials: (u: { name: string }) => u.name.charAt(0),
        formatMessageTime: (d: string) => d,
        showConversationList: true,
        ...overrides,
      },
    })

  it('renders conversation list', () => {
    expect(factory().find('.conversation-list').exists()).toBe(true)
  })

  it('shows search input', () => {
    expect(factory().find('.search-box input').exists()).toBe(true)
  })

  it('renders conversation items', () => {
    expect(factory().findAll('.conversation-item')).toHaveLength(3)
  })

  it('shows user display name', () => {
    expect(factory().find('.conversation-name').text()).toBe('Juan López')
  })

  it('shows avatar image when url set', () => {
    const items = factory().findAll('.conversation-item')
    expect(items[0].find('.avatar img').exists()).toBe(true)
  })

  it('shows avatar initials when no url', () => {
    const items = factory().findAll('.conversation-item')
    expect(items[1].find('.avatar-initials').text()).toBe('A')
  })

  it('shows unread dot when unread > 0', () => {
    const items = factory().findAll('.conversation-item')
    expect(items[0].find('.unread-dot').exists()).toBe(true)
    expect(items[1].find('.unread-dot').exists()).toBe(false)
  })

  it('shows unread badge count', () => {
    expect(factory().find('.unread-badge').text()).toBe('2')
  })

  it('shows last message content', () => {
    const items = factory().findAll('.conversation-item')
    expect(items[0].find('.preview-text').text()).toContain('Hola, me interesa')
  })

  it('shows Tu: prefix for admin messages', () => {
    const items = factory().findAll('.conversation-item')
    expect(items[1].find('.preview-you').exists()).toBe(true)
  })

  it('shows empty preview when no last message', () => {
    const items = factory().findAll('.conversation-item')
    expect(items[2].find('.preview-empty').text()).toBe('Sin mensajes')
  })

  it('shows message time', () => {
    expect(factory().find('.conversation-time').text()).toBe('2026-03-01')
  })

  it('marks active conversation', () => {
    const w = factory({ activeUserId: 'u-1' })
    expect(w.findAll('.conversation-item')[0].classes()).toContain('active')
  })

  it('emits select-conversation on click', async () => {
    const w = factory()
    await w.find('.conversation-item').trigger('click')
    expect(w.emitted('select-conversation')?.[0]?.[0]).toBe('u-1')
  })

  it('emits update:searchQuery on input', async () => {
    const w = factory()
    await w.find('.search-box input').trigger('input')
    expect(w.emitted('update:searchQuery')).toBeTruthy()
  })

  it('shows empty list when no conversations', () => {
    const w = factory({ conversations: [] })
    expect(w.find('.empty-list').exists()).toBe(true)
  })

  it('shows search empty text when query present', () => {
    const w = factory({ conversations: [], searchQuery: 'test' })
    expect(w.find('.empty-list p').text()).toContain('No hay resultados')
  })

  it('shows default empty text when no query', () => {
    const w = factory({ conversations: [] })
    expect(w.find('.empty-list p').text()).toContain('No hay conversaciones')
  })

  it('adds mobile-hidden class when hidden', () => {
    const w = factory({ showConversationList: false, activeUserId: 'u-1' })
    expect(w.find('.conversation-list').classes()).toContain('mobile-hidden')
  })
})
