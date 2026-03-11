import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  usePerfilMensajes,
  formatTimestamp,
  formatMessageTime,
} from '../../app/composables/usePerfilMensajes'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function stubConversation({
  conversations = [] as unknown[],
  activeConversation = null as unknown,
  messages = [] as unknown[],
  isDataShared = false,
} = {}) {
  vi.stubGlobal('useConversation', () => ({
    conversations: { value: conversations },
    activeConversation: { value: activeConversation },
    messages: { value: messages },
    loading: { value: false },
    sending: { value: false },
    unreadCount: { value: 0 },
    isDataShared: { value: isDataShared },
    hasAcceptedShare: { value: false },
    sellerAvgResponseMinutes: { value: null },
    fetchConversations: vi.fn().mockResolvedValue(undefined),
    openConversation: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    acceptDataShare: vi.fn().mockResolvedValue(undefined),
    closeConversation: vi.fn().mockResolvedValue(undefined),
    maskContactData: (content: string) => content,
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  // Use getter-based computed for reactivity
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return (fn as () => unknown)() },
  }))
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useImageUrl', () => ({ getImageUrl: (url: string) => url }))
  stubConversation()
})

// ─── formatTimestamp (exported pure function) ─────────────────────────────────

describe('formatTimestamp', () => {
  const mockT = (key: string) => key

  it('returns time string for today\'s messages', () => {
    const now = new Date()
    const result = formatTimestamp(now.toISOString(), mockT)
    // Should be HH:MM format, e.g. "04:25"
    expect(result).toMatch(/\d+:\d+/)
  })

  it('returns yesterday key for yesterday messages', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = formatTimestamp(yesterday.toISOString(), mockT)
    expect(result).toBe('messages.yesterday')
  })

  it('returns weekday for messages within the last week', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const result = formatTimestamp(threeDaysAgo.toISOString(), mockT)
    // Should be a short weekday string (locale-dependent)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns short date for older messages', () => {
    const oldDate = new Date('2025-01-15T12:00:00Z')
    const result = formatTimestamp(oldDate.toISOString(), mockT)
    // Should include month/day info
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatMessageTime', () => {
  it('returns HH:MM time string', () => {
    const result = formatMessageTime('2026-01-15T14:30:00Z')
    expect(result).toMatch(/\d+:\d+/)
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('messageInput starts as empty string', () => {
    const c = usePerfilMensajes()
    expect(c.messageInput.value).toBe('')
  })

  it('mobileShowConversation starts as false', () => {
    const c = usePerfilMensajes()
    expect(c.mobileShowConversation.value).toBe(false)
  })
})

// ─── sortedConversations ──────────────────────────────────────────────────────

describe('sortedConversations', () => {
  it('sorts conversations by last_message_at descending', () => {
    stubConversation({
      conversations: [
        { id: 'c1', last_message_at: '2026-01-01T00:00:00Z' },
        { id: 'c2', last_message_at: '2026-01-03T00:00:00Z' },
        { id: 'c3', last_message_at: '2026-01-02T00:00:00Z' },
      ],
    })
    const c = usePerfilMensajes()
    const sorted = c.sortedConversations.value as Array<{ id: string }>
    expect(sorted[0]?.id).toBe('c2')
    expect(sorted[1]?.id).toBe('c3')
    expect(sorted[2]?.id).toBe('c1')
  })

  it('returns empty array when no conversations', () => {
    const c = usePerfilMensajes()
    expect(c.sortedConversations.value).toHaveLength(0)
  })
})

// ─── currentUserId computed ───────────────────────────────────────────────────

describe('currentUserId', () => {
  it('returns user id when user is logged in', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-42' } }))
    const c = usePerfilMensajes()
    expect(c.currentUserId.value).toBe('user-42')
  })

  it('returns empty string when no user', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = usePerfilMensajes()
    expect(c.currentUserId.value).toBe('')
  })
})

// ─── otherPartyName computed ──────────────────────────────────────────────────

describe('otherPartyName', () => {
  it('returns empty string when no activeConversation', () => {
    const c = usePerfilMensajes()
    expect(c.otherPartyName.value).toBe('')
  })

  it('returns other_party_name from activeConversation', () => {
    stubConversation({
      activeConversation: { id: 'c1', other_party_name: 'John Doe', status: 'active' },
    })
    const c = usePerfilMensajes()
    expect(c.otherPartyName.value).toBe('John Doe')
  })

  it('returns unknown user key when other_party_name is null', () => {
    stubConversation({
      activeConversation: { id: 'c1', other_party_name: null, status: 'active' },
    })
    const c = usePerfilMensajes()
    expect(c.otherPartyName.value).toBe('messages.unknownUser')
  })
})

// ─── conversationStatusLabel computed ─────────────────────────────────────────

describe('conversationStatusLabel', () => {
  it('returns empty string when no activeConversation', () => {
    const c = usePerfilMensajes()
    expect(c.conversationStatusLabel.value).toBe('')
  })

  it('returns data_shared label for data_shared status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'data_shared' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusLabel.value).toBe('messages.statusDataShared')
  })

  it('returns closed label for closed status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'closed' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusLabel.value).toBe('messages.statusClosed')
  })

  it('returns reported label for reported status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'reported' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusLabel.value).toBe('messages.statusReported')
  })

  it('returns active label for active status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'active' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusLabel.value).toBe('messages.statusActive')
  })
})

// ─── conversationStatusClass computed ─────────────────────────────────────────

describe('conversationStatusClass', () => {
  it('returns shared class for data_shared status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'data_shared' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusClass.value).toBe('conv-status--shared')
  })

  it('returns closed class for closed status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'closed' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusClass.value).toBe('conv-status--closed')
  })

  it('returns active class for active status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'active' } })
    const c = usePerfilMensajes()
    expect(c.conversationStatusClass.value).toBe('conv-status--active')
  })
})

// ─── isConversationClosed computed ────────────────────────────────────────────

describe('isConversationClosed', () => {
  it('returns true when no activeConversation', () => {
    const c = usePerfilMensajes()
    expect(c.isConversationClosed.value).toBe(true)
  })

  it('returns true for closed status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'closed' } })
    const c = usePerfilMensajes()
    expect(c.isConversationClosed.value).toBe(true)
  })

  it('returns true for reported status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'reported' } })
    const c = usePerfilMensajes()
    expect(c.isConversationClosed.value).toBe(true)
  })

  it('returns false for active status', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'active' } })
    const c = usePerfilMensajes()
    expect(c.isConversationClosed.value).toBe(false)
  })
})

// ─── isBuyer computed ─────────────────────────────────────────────────────────

describe('isBuyer', () => {
  it('returns false when no activeConversation', () => {
    const c = usePerfilMensajes()
    expect(c.isBuyer.value).toBe(false)
  })

  it('returns true when user is buyer', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'buyer-1' } }))
    stubConversation({ activeConversation: { id: 'c1', buyer_id: 'buyer-1', status: 'active' } })
    const c = usePerfilMensajes()
    expect(c.isBuyer.value).toBe(true)
  })

  it('returns false when user is not buyer', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'seller-1' } }))
    stubConversation({ activeConversation: { id: 'c1', buyer_id: 'buyer-1', status: 'active' } })
    const c = usePerfilMensajes()
    expect(c.isBuyer.value).toBe(false)
  })
})

// ─── isOwnMessage ─────────────────────────────────────────────────────────────

describe('isOwnMessage', () => {
  it('returns true when sender is current user', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    const c = usePerfilMensajes()
    expect(c.isOwnMessage('user-1')).toBe(true)
  })

  it('returns false when sender is different user', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    const c = usePerfilMensajes()
    expect(c.isOwnMessage('user-2')).toBe(false)
  })
})

// ─── getDisplayContent ────────────────────────────────────────────────────────

describe('getDisplayContent', () => {
  it('returns system message key for both_parties_shared_data', () => {
    const c = usePerfilMensajes()
    expect(c.getDisplayContent('both_parties_shared_data', true)).toBe('messages.systemDataShared')
  })

  it('returns content directly for other system messages', () => {
    const c = usePerfilMensajes()
    expect(c.getDisplayContent('some_system_event', true)).toBe('some_system_event')
  })

  it('returns content for regular messages', () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'active' } })
    const c = usePerfilMensajes()
    expect(c.getDisplayContent('Hello world', false)).toBe('Hello world')
  })
})

// ─── handleBackToList ─────────────────────────────────────────────────────────

describe('handleBackToList', () => {
  it('sets mobileShowConversation to false', () => {
    const c = usePerfilMensajes()
    c.mobileShowConversation.value = true
    c.handleBackToList()
    expect(c.mobileShowConversation.value).toBe(false)
  })
})

// ─── handleSendMessage ────────────────────────────────────────────────────────

describe('handleSendMessage', () => {
  it('does nothing when no activeConversation', async () => {
    const mockSend = vi.fn()
    vi.stubGlobal('useConversation', () => ({
      conversations: { value: [] },
      activeConversation: { value: null },
      messages: { value: [] },
      loading: { value: false },
      sending: { value: false },
      unreadCount: { value: 0 },
      isDataShared: { value: false },
      hasAcceptedShare: { value: false },
      sellerAvgResponseMinutes: { value: null },
      fetchConversations: vi.fn(),
      openConversation: vi.fn(),
      sendMessage: mockSend,
      acceptDataShare: vi.fn(),
      closeConversation: vi.fn(),
      maskContactData: (c: string) => c,
    }))
    const c = usePerfilMensajes()
    c.messageInput.value = 'Hello'
    await c.handleSendMessage()
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('does nothing when message is empty', async () => {
    const mockSend = vi.fn()
    vi.stubGlobal('useConversation', () => ({
      conversations: { value: [] },
      activeConversation: { value: { id: 'c1', status: 'active' } },
      messages: { value: [] },
      loading: { value: false },
      sending: { value: false },
      unreadCount: { value: 0 },
      isDataShared: { value: false },
      hasAcceptedShare: { value: false },
      sellerAvgResponseMinutes: { value: null },
      fetchConversations: vi.fn(),
      openConversation: vi.fn(),
      sendMessage: mockSend,
      acceptDataShare: vi.fn(),
      closeConversation: vi.fn(),
      maskContactData: (c: string) => c,
    }))
    const c = usePerfilMensajes()
    c.messageInput.value = '   ' // only whitespace
    await c.handleSendMessage()
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('clears messageInput after sending', async () => {
    stubConversation({ activeConversation: { id: 'c1', status: 'active' } })
    const c = usePerfilMensajes()
    c.messageInput.value = 'Hello'
    await c.handleSendMessage()
    expect(c.messageInput.value).toBe('')
  })
})
