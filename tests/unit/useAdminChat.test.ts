import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminChat } from '../../app/composables/admin/useAdminChat'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'not', 'in', 'or', 'order', 'limit', 'match',
  ]) {
    chain[m] = () => chain
  }
  chain['single'] = () => ({ then: (resolve: (v: unknown) => unknown) => resolve(result) })
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
  }),
  removeChannel: vi.fn(),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
})

// ─── Pure helpers ─────────────────────────────────────────────────────────

describe('formatMessageTime', () => {
  it('returns time string for today\'s message', () => {
    const c = useAdminChat()
    const result = c.formatMessageTime(new Date().toISOString())
    expect(typeof result).toBe('string')
    expect(result).not.toBe('')
  })

  it('returns "Ayer" for yesterday\'s message', () => {
    const c = useAdminChat()
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const result = c.formatMessageTime(yesterday)
    expect(result).toBe('Ayer')
  })

  it('returns date string for older message', () => {
    const c = useAdminChat()
    const old = new Date('2025-01-01T10:00:00Z').toISOString()
    const result = c.formatMessageTime(old)
    expect(typeof result).toBe('string')
    expect(result).not.toBe('')
  })
})

describe('formatFullDate', () => {
  it('returns a formatted date string', () => {
    const c = useAdminChat()
    const result = c.formatFullDate('2026-03-15T10:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('')
  })
})

describe('getUserDisplayName', () => {
  it('returns full name when name and apellidos exist', () => {
    const c = useAdminChat()
    const user = { id: 'u1', email: 'juan@test.com', name: 'Juan', apellidos: 'García', avatar_url: null }
    expect(c.getUserDisplayName(user)).toBe('Juan García')
  })

  it('returns email prefix when no name', () => {
    const c = useAdminChat()
    const user = { id: 'u1', email: 'juan@test.com', name: null, apellidos: null, avatar_url: null }
    expect(c.getUserDisplayName(user)).toBe('juan')
  })

  it('returns just the name when no apellidos', () => {
    const c = useAdminChat()
    const user = { id: 'u1', email: 'juan@test.com', name: 'Juan', apellidos: null, avatar_url: null }
    expect(c.getUserDisplayName(user)).toBe('Juan')
  })
})

describe('getUserInitials', () => {
  it('returns first initials from name and apellidos', () => {
    const c = useAdminChat()
    const user = { id: 'u1', email: 'j@test.com', name: 'Juan', apellidos: 'García', avatar_url: null }
    expect(c.getUserInitials(user)).toBe('JG')
  })

  it('returns first letter of email when no name', () => {
    const c = useAdminChat()
    const user = { id: 'u1', email: 'zara@test.com', name: null, apellidos: null, avatar_url: null }
    expect(c.getUserInitials(user)).toBe('Z')
  })

  it('returns single initial when no apellidos', () => {
    const c = useAdminChat()
    const user = { id: 'u1', email: 'j@test.com', name: 'Ana', apellidos: null, avatar_url: null }
    expect(c.getUserInitials(user)).toBe('A')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('conversations starts as empty Map', () => {
    const c = useAdminChat()
    expect(c.conversations.value.size).toBe(0)
  })

  it('activeUserId starts as null', () => {
    const c = useAdminChat()
    expect(c.activeUserId.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useAdminChat()
    expect(c.loading.value).toBe(false)
  })

  it('sending starts as false', () => {
    const c = useAdminChat()
    expect(c.sending.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminChat()
    expect(c.error.value).toBeNull()
  })

  it('conversationList starts as empty array', () => {
    const c = useAdminChat()
    expect(c.conversationList.value).toEqual([])
  })

  it('activeConversation starts as null', () => {
    const c = useAdminChat()
    expect(c.activeConversation.value).toBeNull()
  })

  it('totalUnreadCount starts as 0', () => {
    const c = useAdminChat()
    expect(c.totalUnreadCount.value).toBe(0)
  })
})

// ─── fetchConversations ───────────────────────────────────────────────────

describe('fetchConversations', () => {
  it('calls supabase.from("chat_messages")', async () => {
    const c = useAdminChat()
    await c.fetchConversations()
    expect(mockFrom).toHaveBeenCalledWith('chat_messages')
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminChat()
    await c.fetchConversations()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }))
    const c = useAdminChat()
    await c.fetchConversations()
    expect(c.error.value).toBe('db error')
  })

  it('handles empty messages (no conversations)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const c = useAdminChat()
    await c.fetchConversations()
    expect(c.conversations.value.size).toBe(0)
  })

  it('groups messages by user', async () => {
    const messages = [
      {
        id: 'm1', user_id: 'u1', content: 'Hello', direction: 'user_to_admin',
        is_read: false, created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z',
        users: { id: 'u1', email: 'user@test.com', name: 'User', apellidos: null, avatar_url: null },
      },
    ]
    mockFrom.mockReturnValue(makeChain({ data: messages, error: null }))
    const c = useAdminChat()
    await c.fetchConversations()
    expect(c.conversations.value.size).toBe(1)
    expect(c.conversations.value.has('u1')).toBe(true)
  })

  it('counts unread messages from user', async () => {
    const messages = [
      {
        id: 'm1', user_id: 'u1', content: 'Hello', direction: 'user_to_admin',
        is_read: false, created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z',
        users: { id: 'u1', email: 'user@test.com', name: 'User', apellidos: null, avatar_url: null },
      },
      {
        id: 'm2', user_id: 'u1', content: 'Again', direction: 'user_to_admin',
        is_read: false, created_at: '2026-03-15T10:01:00Z', updated_at: '2026-03-15T10:01:00Z',
        users: { id: 'u1', email: 'user@test.com', name: 'User', apellidos: null, avatar_url: null },
      },
    ]
    mockFrom.mockReturnValue(makeChain({ data: messages, error: null }))
    const c = useAdminChat()
    await c.fetchConversations()
    const conv = c.conversations.value.get('u1')
    expect(conv!.unreadCount).toBe(2)
  })
})

// ─── setActiveConversation ────────────────────────────────────────────────

describe('setActiveConversation', () => {
  it('sets activeUserId', () => {
    const c = useAdminChat()
    c.activeUserId.value = null
    c.setActiveConversation('u1')
    expect(c.activeUserId.value).toBe('u1')
  })

  it('clears activeUserId when null', () => {
    const c = useAdminChat()
    c.activeUserId.value = 'u1'
    c.setActiveConversation(null)
    expect(c.activeUserId.value).toBeNull()
  })
})

// ─── sendMessage ──────────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('returns false for empty content', async () => {
    const c = useAdminChat()
    const result = await c.sendMessage('u1', '   ')
    expect(result).toBe(false)
  })

  it('calls from("chat_messages") with valid content', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'm1', content: 'Hi', direction: 'admin_to_user', is_read: false, user_id: 'u1', created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' }, error: null }))
    const c = useAdminChat()
    await c.sendMessage('u1', 'Hello')
    expect(mockFrom).toHaveBeenCalledWith('chat_messages')
  })

  it('returns false on insert error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('insert error') }))
    const c = useAdminChat()
    const result = await c.sendMessage('u1', 'Hello')
    expect(result).toBe(false)
  })

  it('sets error message on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('insert error') }))
    const c = useAdminChat()
    await c.sendMessage('u1', 'Hello')
    expect(c.error.value).toBe('insert error')
  })

  it('sets sending to false after completion', async () => {
    const c = useAdminChat()
    await c.sendMessage('u1', 'Hello')
    expect(c.sending.value).toBe(false)
  })
})

// ─── searchConversations ──────────────────────────────────────────────────

describe('searchConversations', () => {
  it('returns all conversations when query is empty', () => {
    const c = useAdminChat()
    const result = c.searchConversations('')
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns empty array when no conversations match query', () => {
    // conversationList is empty (computed one-shot from empty Map), so no matches
    const c = useAdminChat()
    const result = c.searchConversations('juan')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })
})

// ─── subscribeToRealtime ──────────────────────────────────────────────────

describe('subscribeToRealtime', () => {
  it('calls supabase.channel() when subscribing', () => {
    const mockChannel = vi.fn().mockReturnValue({
      on: () => ({ subscribe: () => ({}) }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (...args: unknown[]) => mockFrom(...args),
      channel: mockChannel,
      removeChannel: vi.fn(),
    }))
    const c = useAdminChat()
    c.subscribeToRealtime()
    expect(mockChannel).toHaveBeenCalled()
  })
})

// ─── markConversationAsRead ───────────────────────────────────────────────

describe('markConversationAsRead', () => {
  it('skips update when conversation has no unread', async () => {
    const c = useAdminChat()
    c.conversations.value.set('u1', {
      user: { id: 'u1', email: 'u@test.com', name: null, apellidos: null, avatar_url: null },
      lastMessage: null,
      unreadCount: 0,
      messages: [],
    })
    await c.markConversationAsRead('u1')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls from("chat_messages") when there are unread messages', async () => {
    const c = useAdminChat()
    c.conversations.value.set('u1', {
      user: { id: 'u1', email: 'u@test.com', name: null, apellidos: null, avatar_url: null },
      lastMessage: null,
      unreadCount: 3,
      messages: [],
    })
    await c.markConversationAsRead('u1')
    expect(mockFrom).toHaveBeenCalledWith('chat_messages')
  })
})
