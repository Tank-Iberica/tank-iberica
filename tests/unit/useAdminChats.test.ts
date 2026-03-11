import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminChats } from '../../app/composables/admin/useAdminChats'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockFetchConversations: ReturnType<typeof vi.fn>
let mockSendMessage: ReturnType<typeof vi.fn>
let mockSetActiveConversation: ReturnType<typeof vi.fn>
let mockSearchConversations: ReturnType<typeof vi.fn>
let mockSubscribeToRealtime: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminChat', () => ({
  useAdminChat: () => ({
    loading: { value: false },
    sending: { value: false },
    error: { value: null },
    activeConversation: { value: null },
    activeUserId: { value: null },
    totalUnreadCount: { value: 0 },
    fetchConversations: (...args: unknown[]) => mockFetchConversations(...args),
    setActiveConversation: (...args: unknown[]) => mockSetActiveConversation(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    searchConversations: (...args: unknown[]) => mockSearchConversations(...args),
    subscribeToRealtime: (...args: unknown[]) => mockSubscribeToRealtime(...args),
    formatMessageTime: (d: string) => d,
    formatFullDate: (d: string) => d,
    getUserDisplayName: (u: { email: string }) => u.email,
    getUserInitials: (u: { email: string }) => u.email[0]!.toUpperCase(),
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchConversations = vi.fn().mockResolvedValue(undefined)
  mockSendMessage = vi.fn().mockResolvedValue(false)
  mockSetActiveConversation = vi.fn()
  mockSearchConversations = vi.fn().mockReturnValue([])
  mockSubscribeToRealtime = vi.fn()
})

// ─── groupMessagesByDate (pure helper) ───────────────────────────────────

describe('groupMessagesByDate', () => {
  it('returns empty array for empty messages', () => {
    const c = useAdminChats()
    const result = c.groupMessagesByDate([])
    expect(result).toEqual([])
  })

  it('groups messages by date', () => {
    const c = useAdminChats()
    const messages = [
      { id: 'm1', user_id: 'u1', content: 'Hello', direction: 'user_to_admin' as const, is_read: false, created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
      { id: 'm2', user_id: 'u1', content: 'World', direction: 'user_to_admin' as const, is_read: false, created_at: '2026-03-15T11:00:00Z', updated_at: '2026-03-15T11:00:00Z' },
    ]
    const result = c.groupMessagesByDate(messages)
    expect(result).toHaveLength(1)
    expect(result[0]!.messages).toHaveLength(2)
  })

  it('creates separate groups for different dates', () => {
    const c = useAdminChats()
    const messages = [
      { id: 'm1', user_id: 'u1', content: 'Day 1', direction: 'user_to_admin' as const, is_read: false, created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
      { id: 'm2', user_id: 'u1', content: 'Day 2', direction: 'user_to_admin' as const, is_read: false, created_at: '2026-03-16T10:00:00Z', updated_at: '2026-03-16T10:00:00Z' },
    ]
    const result = c.groupMessagesByDate(messages)
    expect(result).toHaveLength(2)
  })

  it('each group has date and messages array', () => {
    const c = useAdminChats()
    const messages = [
      { id: 'm1', user_id: 'u1', content: 'Hi', direction: 'user_to_admin' as const, is_read: false, created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
    ]
    const result = c.groupMessagesByDate(messages)
    expect(result[0]).toHaveProperty('date')
    expect(result[0]).toHaveProperty('messages')
    expect(Array.isArray(result[0]!.messages)).toBe(true)
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('searchQuery starts as empty string', () => {
    const c = useAdminChats()
    expect(c.searchQuery.value).toBe('')
  })

  it('messageInput starts as empty string', () => {
    const c = useAdminChats()
    expect(c.messageInput.value).toBe('')
  })

  it('showConversationList starts as true', () => {
    const c = useAdminChats()
    expect(c.showConversationList.value).toBe(true)
  })

  it('messagesContainer starts as null', () => {
    const c = useAdminChats()
    expect(c.messagesContainer.value).toBeNull()
  })
})

// ─── filteredConversations ────────────────────────────────────────────────

describe('filteredConversations', () => {
  it('calls searchConversations with searchQuery', () => {
    mockSearchConversations.mockReturnValue([{ user: { email: 'test@test.com' } }])
    const c = useAdminChats()
    // filteredConversations is computed (one-shot) with empty searchQuery
    expect(mockSearchConversations).toHaveBeenCalledWith('')
  })

  it('returns results from searchConversations', () => {
    const convs = [{ user: { email: 'test@test.com' } }]
    mockSearchConversations.mockReturnValue(convs)
    const c = useAdminChats()
    expect(c.filteredConversations.value).toEqual(convs)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchConversations', async () => {
    const c = useAdminChats()
    await c.init()
    expect(mockFetchConversations).toHaveBeenCalled()
  })

  it('calls subscribeToRealtime', async () => {
    const c = useAdminChats()
    await c.init()
    expect(mockSubscribeToRealtime).toHaveBeenCalled()
  })
})

// ─── handleSendMessage ────────────────────────────────────────────────────

describe('handleSendMessage', () => {
  it('does not send when activeUserId is null', async () => {
    const c = useAdminChats()
    c.messageInput.value = 'Hello'
    // activeUserId.value is null from mock
    await c.handleSendMessage()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('does not send when messageInput is empty', async () => {
    const c = useAdminChats()
    c.activeUserId.value = 'u1'
    c.messageInput.value = '   '
    await c.handleSendMessage()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('calls sendMessage with userId and content', async () => {
    const c = useAdminChats()
    c.activeUserId.value = 'u1'
    c.messageInput.value = 'Hello!'
    mockSendMessage.mockResolvedValue(true)
    await c.handleSendMessage()
    expect(mockSendMessage).toHaveBeenCalledWith('u1', 'Hello!')
  })

  it('clears messageInput on success', async () => {
    const c = useAdminChats()
    c.activeUserId.value = 'u1'
    c.messageInput.value = 'Hello!'
    mockSendMessage.mockResolvedValue(true)
    await c.handleSendMessage()
    expect(c.messageInput.value).toBe('')
  })

  it('keeps messageInput on send failure', async () => {
    const c = useAdminChats()
    c.activeUserId.value = 'u1'
    c.messageInput.value = 'Hello!'
    mockSendMessage.mockResolvedValue(false)
    await c.handleSendMessage()
    expect(c.messageInput.value).toBe('Hello!')
  })
})

// ─── selectConversation ───────────────────────────────────────────────────

describe('selectConversation', () => {
  it('calls setActiveConversation with userId', () => {
    const c = useAdminChats()
    c.selectConversation('u1')
    expect(mockSetActiveConversation).toHaveBeenCalledWith('u1')
  })

  it('sets showConversationList to false', () => {
    const c = useAdminChats()
    c.selectConversation('u1')
    expect(c.showConversationList.value).toBe(false)
  })
})

// ─── goBackToList ─────────────────────────────────────────────────────────

describe('goBackToList', () => {
  it('calls setActiveConversation with null', () => {
    const c = useAdminChats()
    c.goBackToList()
    expect(mockSetActiveConversation).toHaveBeenCalledWith(null)
  })

  it('sets showConversationList to true', () => {
    const c = useAdminChats()
    c.showConversationList.value = false
    c.goBackToList()
    expect(c.showConversationList.value).toBe(true)
  })
})

// ─── handleKeyDown ────────────────────────────────────────────────────────

describe('handleKeyDown', () => {
  it('calls handleSendMessage on Enter key', async () => {
    const c = useAdminChats()
    c.activeUserId.value = 'u1'
    c.messageInput.value = 'Hello'
    mockSendMessage.mockResolvedValue(true)
    const event = { key: 'Enter', shiftKey: false, preventDefault: vi.fn() } as unknown as KeyboardEvent
    c.handleKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('does not call send on Shift+Enter', async () => {
    const c = useAdminChats()
    c.activeUserId.value = 'u1'
    c.messageInput.value = 'Hello'
    const event = { key: 'Enter', shiftKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent
    c.handleKeyDown(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('does not call send for non-Enter keys', () => {
    const c = useAdminChats()
    const event = { key: 'a', shiftKey: false, preventDefault: vi.fn() } as unknown as KeyboardEvent
    c.handleKeyDown(event)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})
