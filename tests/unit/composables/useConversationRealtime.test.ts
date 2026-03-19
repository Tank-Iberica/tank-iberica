import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'

// Mock type imports
vi.mock('~~/types/supabase', () => ({}))
vi.mock('~/composables/shared/conversationTypes', () => ({
  Conversation: {},
  ConversationMessage: {},
}))
vi.mock('~/composables/shared/conversationHelpers', () => ({
  maskContactData: vi.fn((text: string) => text.replace(/\d/g, '*')),
  resolveUserName: vi.fn(() => 'Test User'),
}))

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', (r: any) => r)
vi.stubGlobal('watch', vi.fn())
vi.stubGlobal('onMounted', vi.fn())
vi.stubGlobal('onUnmounted', vi.fn())

const mockSubscribe = vi.fn()
const mockUnsubscribe = vi.fn()
const mockOn = vi.fn(() => ({ subscribe: mockSubscribe }))
const mockChannel = vi.fn(() => ({ on: mockOn, unsubscribe: mockUnsubscribe }))
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    or: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    eq: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  update: vi.fn(() => ({
    eq: vi.fn(() => ({
      in: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}))

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => ({
    from: mockFrom,
    channel: mockChannel,
    removeChannel: vi.fn(),
  })),
)
vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => ref({ id: 'user-1', email: 'test@test.com' })),
)

import { useConversation } from '../../../app/composables/useConversation'

describe('Supabase Realtime chat buyer↔seller (N40)', () => {
  describe('Return shape', () => {
    it('returns conversation management API', () => {
      const api = useConversation()
      expect(api).toHaveProperty('conversations')
      expect(api).toHaveProperty('activeConversation')
      expect(api).toHaveProperty('messages')
      expect(api).toHaveProperty('loading')
      expect(api).toHaveProperty('sending')
      expect(api).toHaveProperty('unreadCount')
      expect(api).toHaveProperty('fetchConversations')
    })
  })

  describe('Initial state', () => {
    it('starts with empty conversations', () => {
      const { conversations } = useConversation()
      expect(conversations.value).toEqual([])
    })

    it('starts with no active conversation', () => {
      const { activeConversation } = useConversation()
      expect(activeConversation.value).toBeNull()
    })

    it('starts with empty messages', () => {
      const { messages } = useConversation()
      expect(messages.value).toEqual([])
    })

    it('loading starts as false', () => {
      const { loading } = useConversation()
      expect(loading.value).toBe(false)
    })

    it('sending starts as false', () => {
      const { sending } = useConversation()
      expect(sending.value).toBe(false)
    })
  })

  describe('unreadCount', () => {
    it('returns 0 when no messages', () => {
      const { unreadCount } = useConversation()
      expect(unreadCount.value).toBe(0)
    })

    it('counts unread messages from other users', () => {
      const { messages, unreadCount } = useConversation()
      messages.value = [
        { id: '1', sender_id: 'other-user', is_read: false } as any,
        { id: '2', sender_id: 'other-user', is_read: true } as any,
        { id: '3', sender_id: 'user-1', is_read: false } as any, // own message
      ]
      expect(unreadCount.value).toBe(1)
    })
  })

  describe('fetchConversations', () => {
    it('queries conversations table', async () => {
      const { fetchConversations } = useConversation()
      await fetchConversations()
      expect(mockFrom).toHaveBeenCalledWith('conversations')
    })
  })

  describe('Type exports', () => {
    it('exports Conversation and ConversationMessage types', async () => {
      // Verify the module exports types (import succeeds without error)
      const mod = await import('../../../app/composables/useConversation')
      expect(mod.useConversation).toBeDefined()
    })
  })
})
