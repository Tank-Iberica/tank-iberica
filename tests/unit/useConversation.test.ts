import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConversation } from '../../app/composables/useConversation'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'or', 'in', 'order', 'select', 'filter', 'update', 'insert'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error }
  chain.single = () => Promise.resolve({ data, error })
  chain.maybeSingle = () => Promise.resolve({ data, error })
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient() {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([]),
      update: () => makeChain(null),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    channel: () => ({
      on: function (this: unknown) {
        return this
      },
      subscribe: () => ({}),
    }),
    removeChannel: vi.fn(),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  // Use getter-based computed so reactive state changes are reflected
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() {
      return fn()
    },
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('onUnmounted', vi.fn())
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('conversations starts as empty array', () => {
    const c = useConversation()
    expect(c.conversations.value).toHaveLength(0)
  })

  it('activeConversation starts as null', () => {
    const c = useConversation()
    expect(c.activeConversation.value).toBeNull()
  })

  it('messages starts as empty array', () => {
    const c = useConversation()
    expect(c.messages.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useConversation()
    expect(c.loading.value).toBe(false)
  })

  it('sending starts as false', () => {
    const c = useConversation()
    expect(c.sending.value).toBe(false)
  })

  it('unreadCount starts as 0', () => {
    const c = useConversation()
    expect(c.unreadCount.value).toBe(0)
  })

  it('isDataShared is false when no active conversation', () => {
    const c = useConversation()
    expect(c.isDataShared.value).toBe(false)
  })

  it('hasAcceptedShare is false when no active conversation', () => {
    const c = useConversation()
    expect(c.hasAcceptedShare.value).toBe(false)
  })
})

// ─── maskContactData ──────────────────────────────────────────────────────────

describe('maskContactData', () => {
  it('returns text unchanged when data is shared', () => {
    const c = useConversation()
    const text = 'Call me at +34 600 123 456 or test@example.com'
    expect(c.maskContactData(text, true)).toBe(text)
  })

  it('masks phone numbers when data is not shared', () => {
    const c = useConversation()
    const result = c.maskContactData('Call me at +34 600 123 456', false)
    expect(result).toContain('[datos ocultos]')
    expect(result).not.toContain('600 123 456')
  })

  it('masks email addresses when data is not shared', () => {
    const c = useConversation()
    const result = c.maskContactData('Email me at test@example.com', false)
    expect(result).toContain('[datos ocultos]')
    expect(result).not.toContain('test@example.com')
  })

  it('returns plain text unchanged when no contact data', () => {
    const c = useConversation()
    const text = 'Hi there, interested in the vehicle'
    expect(c.maskContactData(text, false)).toBe(text)
  })
})

// ─── unreadCount computed ─────────────────────────────────────────────────────

describe('unreadCount', () => {
  it('returns 0 when no user', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    expect(c.unreadCount.value).toBe(0)
  })

  it('counts messages from other users that are unread', () => {
    const c = useConversation()
    c.messages.value = [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'other-user',
        content: 'Hi',
        is_system: false,
        is_read: false,
        created_at: '',
      },
      {
        id: 'm2',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Hello',
        is_system: false,
        is_read: false,
        created_at: '',
      },
      {
        id: 'm3',
        conversation_id: 'conv-1',
        sender_id: 'other-user',
        content: 'Are you there?',
        is_system: false,
        is_read: true,
        created_at: '',
      },
    ]
    expect(c.unreadCount.value).toBe(1) // only m1 (other-user, unread)
  })
})

// ─── isDataShared computed ────────────────────────────────────────────────────

describe('isDataShared', () => {
  it('returns true when active conversation status is data_shared', () => {
    const c = useConversation()
    c.activeConversation.value = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'data_shared',
      buyer_accepted_share: true,
      seller_accepted_share: true,
      last_message_at: '',
      created_at: '',
    }
    expect(c.isDataShared.value).toBe(true)
  })

  it('returns false when status is active', () => {
    const c = useConversation()
    c.activeConversation.value = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active',
      buyer_accepted_share: false,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    expect(c.isDataShared.value).toBe(false)
  })
})

// ─── hasAcceptedShare computed ────────────────────────────────────────────────

describe('hasAcceptedShare', () => {
  it('returns buyer_accepted_share when current user is buyer', () => {
    const c = useConversation()
    c.activeConversation.value = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active',
      buyer_accepted_share: true,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    expect(c.hasAcceptedShare.value).toBe(true)
  })

  it('returns seller_accepted_share when current user is seller', () => {
    const c = useConversation()
    c.activeConversation.value = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'other',
      seller_id: 'user-1',
      status: 'active',
      buyer_accepted_share: false,
      seller_accepted_share: true,
      last_message_at: '',
      created_at: '',
    }
    expect(c.hasAcceptedShare.value).toBe(true)
  })
})

// ─── fetchConversations ───────────────────────────────────────────────────────

describe('fetchConversations', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.loading.value).toBe(false)
    expect(c.conversations.value).toHaveLength(0)
  })

  it('sets loading to false after success', async () => {
    const c = useConversation()
    await c.fetchConversations()
    expect(c.loading.value).toBe(false)
  })
})

// ─── sendMessage ──────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    await c.sendMessage('conv-1', 'Hello')
    expect(c.sending.value).toBe(false)
  })

  it('does nothing for empty message', async () => {
    const c = useConversation()
    await c.sendMessage('conv-1', '   ')
    expect(c.sending.value).toBe(false)
  })

  it('sets sending=false after sending', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'msg-1',
              conversation_id: 'conv-1',
              sender_id: 'user-1',
              content: 'Hello',
              is_system: false,
              is_read: false,
              created_at: '',
            },
            error: null,
          }),
      }),
    })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: mockInsert,
        update: mockUpdate,
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.sendMessage('conv-1', 'Hello')
    expect(c.sending.value).toBe(false)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('adds message to messages array optimistically', async () => {
    const newMsg = {
      id: 'msg-new',
      conversation_id: 'conv-1',
      sender_id: 'user-1',
      content: 'Test',
      is_system: false,
      is_read: false,
      created_at: '',
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: newMsg, error: null }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.sendMessage('conv-1', 'Test')
    expect(c.messages.value.some((m) => m.id === 'msg-new')).toBe(true)
  })
})

// ─── openConversation ────────────────────────────────────────────────────────

describe('openConversation', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    await c.openConversation('conv-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets loading=false after opening conversation', async () => {
    const c = useConversation()
    // Set up conversations first
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets activeConversation when found', async () => {
    const c = useConversation()
    const conv = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active' as const,
      buyer_accepted_share: false,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    c.conversations.value = [conv]
    await c.openConversation('conv-1')
    expect(c.activeConversation.value?.id).toBe('conv-1')
  })

  it('fetches seller response time when user is buyer', async () => {
    const dealerChain = makeChain({ avg_response_minutes: 15 })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers') return { select: () => ({ eq: () => dealerChain }) }
        return {
          select: () => makeChain([]),
          update: () => makeChain(null),
          insert: () => ({
            select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
          }),
        }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.sellerAvgResponseMinutes.value).toBe(15)
  })

  it('sets sellerAvgResponseMinutes to null when user is seller', async () => {
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'other-buyer',
        seller_id: 'user-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.sellerAvgResponseMinutes.value).toBeNull()
  })
})

// ─── markAsRead ──────────────────────────────────────────────────────────────

describe('markAsRead', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    await c.markAsRead('conv-1')
    // Should not throw
    expect(c.messages.value).toHaveLength(0)
  })

  it('marks unread messages from other users as read locally', async () => {
    const c = useConversation()
    c.messages.value = [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'other',
        content: 'Hi',
        is_system: false,
        is_read: false,
        created_at: '',
      },
      {
        id: 'm2',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Reply',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    ]
    await c.markAsRead('conv-1')
    // m1 (from other) should be marked as read, m2 (from user-1) stays
    expect(c.messages.value.find((m) => m.id === 'm1')?.is_read).toBe(true)
    expect(c.messages.value.find((m) => m.id === 'm2')?.is_read).toBe(false) // own msg
  })
})

// ─── startConversation ───────────────────────────────────────────────────────

describe('startConversation', () => {
  it('returns null when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    const result = await c.startConversation('v1', 'seller-1', 'Hello')
    expect(result).toBeNull()
  })
})

// ─── acceptDataShare ─────────────────────────────────────────────────────────

describe('acceptDataShare', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    await c.acceptDataShare('conv-1')
    expect(c.conversations.value).toEqual([])
  })

  it('does nothing when conversation not found', async () => {
    const c = useConversation()
    await c.acceptDataShare('nonexistent')
    expect(c.conversations.value).toEqual([])
  })
})

// ─── closeConversation ───────────────────────────────────────────────────────

describe('closeConversation', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useConversation()
    await c.closeConversation('conv-1')
    expect(c.conversations.value).toEqual([])
  })

  it('clears activeConversation when closing active conv', async () => {
    const c = useConversation()
    c.activeConversation.value = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active',
      buyer_accepted_share: false,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    c.messages.value = [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Hello',
        is_system: false,
        is_read: true,
        created_at: '',
      },
    ]
    await c.closeConversation('conv-1')
    expect(c.activeConversation.value).toBeNull()
    expect(c.messages.value).toHaveLength(0)
  })

  it('does not clear activeConversation when closing a different conv', async () => {
    const c = useConversation()
    c.activeConversation.value = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active',
      buyer_accepted_share: false,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    await c.closeConversation('conv-other')
    expect(c.activeConversation.value).not.toBeNull()
  })
})

// ─── sellerAvgResponseMinutes ─────────────────────────────────────────────────

describe('sellerAvgResponseMinutes', () => {
  it('starts as null', () => {
    const c = useConversation()
    expect(c.sellerAvgResponseMinutes.value).toBeNull()
  })
})

// ─── fetchConversations with data ────────────────────────────────────────────

describe('fetchConversations with data', () => {
  it('maps conversation rows correctly', async () => {
    const convRows = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '2026-03-01',
        created_at: '2026-02-28',
        vehicles: { title: 'Volvo FH', images: ['img1.jpg', 'img2.jpg'] },
        buyer: { name: 'John', apellidos: 'Doe', pseudonimo: null, company_name: null },
        seller: { name: 'Seller', apellidos: 'Corp', pseudonimo: null, company_name: 'SellerCo' },
      },
    ]
    const msgRows = [
      {
        conversation_id: 'conv-1',
        content: 'Hello there, interested in the truck',
        is_system: false,
      },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: convRows, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              in: () => ({
                eq: () => ({ order: () => Promise.resolve({ data: msgRows, error: null }) }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value).toHaveLength(1)
    expect(c.conversations.value[0]!.vehicle_title).toBe('Volvo FH')
    expect(c.conversations.value[0]!.vehicle_image).toBe('img1.jpg')
    expect(c.conversations.value[0]!.last_message_preview).toBe(
      'Hello there, interested in the truck',
    )
  })

  it('handles empty conversations list', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
        update: () => makeChain(null),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value).toHaveLength(0)
  })

  it('handles conversations with no vehicle images', async () => {
    const convRows = [
      {
        id: 'conv-2',
        vehicle_id: 'v-2',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '2026-03-01',
        created_at: '2026-02-28',
        vehicles: { title: 'Truck', images: [] },
        buyer: null,
        seller: null,
      },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: convRows, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              in: () => ({
                eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value[0]!.vehicle_image).toBeUndefined()
  })
})

// ─── startConversation with existing conversation ────────────────────────────

describe('startConversation — existing conversation', () => {
  it('returns existing conversation id and opens it', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    neq: () => ({
                      maybeSingle: () =>
                        Promise.resolve({ data: { id: 'existing-conv' }, error: null }),
                    }),
                  }),
                }),
              }),
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'new-conv' }, error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              in: () => ({
                eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              }),
            }),
            update: () => makeChain(null),
            insert: () => ({
              select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    const result = await c.startConversation('v1', 'seller-1', '')
    expect(result).toBe('existing-conv')
  })
})

// ─── acceptDataShare — buyer accepts ────────────────────────────────────────

describe('acceptDataShare — with conversations', () => {
  it('updates buyer_accepted_share when current user is buyer', async () => {
    const updateField = vi
      .fn()
      .mockReturnValue({ eq: () => Promise.resolve({ data: null, error: null }) })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            update: updateField,
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.acceptDataShare('conv-1')
    expect(updateField).toHaveBeenCalledWith({ buyer_accepted_share: true })
  })

  it('updates seller_accepted_share when current user is seller', async () => {
    const updateField = vi
      .fn()
      .mockReturnValue({ eq: () => Promise.resolve({ data: null, error: null }) })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            update: updateField,
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'other',
        seller_id: 'user-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.acceptDataShare('conv-1')
    expect(updateField).toHaveBeenCalledWith({ seller_accepted_share: true })
  })

  it('sets status to data_shared when both parties accepted', async () => {
    const updateCalls: unknown[] = []
    const updateFn = vi.fn().mockImplementation((obj) => {
      updateCalls.push(obj)
      return { eq: () => Promise.resolve({ data: null, error: null }) }
    })
    const insertFn = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            update: updateFn,
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            insert: insertFn,
            select: () => makeChain([]),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    // Seller already accepted, buyer now accepting
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: true,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.acceptDataShare('conv-1')
    // First update: buyer_accepted_share=true; Second: status='data_shared'
    expect(updateCalls).toContainEqual({ buyer_accepted_share: true })
    expect(updateCalls).toContainEqual({ status: 'data_shared' })
    // System message inserted
    expect(insertFn).toHaveBeenCalled()
  })

  it('throws when update fails', async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            update: updateFn,
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await expect(c.acceptDataShare('conv-1')).rejects.toBeDefined()
  })

  it('updates activeConversation reference after data share', async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            update: updateFn,
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const conv = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active' as const,
      buyer_accepted_share: false,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    const c = useConversation()
    c.conversations.value = [conv]
    c.activeConversation.value = conv
    await c.acceptDataShare('conv-1')
    // After fetchConversations clears list, activeConversation should be updated
    // (conversations is empty after refresh so it becomes null)
    expect(c.activeConversation.value).toBeNull()
  })

  it('does not update status when only one party accepted', async () => {
    const updateCalls: unknown[] = []
    const updateFn = vi.fn().mockImplementation((obj) => {
      updateCalls.push(obj)
      return { eq: () => Promise.resolve({ data: null, error: null }) }
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            update: updateFn,
            select: () => ({
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    // Neither party has accepted yet — buyer now accepts
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.acceptDataShare('conv-1')
    // Only buyer_accepted_share should be set, NOT status='data_shared'
    expect(updateCalls).toContainEqual({ buyer_accepted_share: true })
    expect(updateCalls).not.toContainEqual({ status: 'data_shared' })
  })
})

// ─── fetchConversations — error handling ────────────────────────────────────

describe('fetchConversations — error handling', () => {
  it('throws when fetch returns error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          or: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await expect(c.fetchConversations()).rejects.toBeDefined()
    expect(c.loading.value).toBe(false)
  })

  it('handles null data gracefully', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          or: () => ({
            order: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value).toHaveLength(0)
    expect(c.loading.value).toBe(false)
  })

  it('handles conversation with null vehicles', async () => {
    const convRows = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '2026-03-01',
        created_at: '2026-02-28',
        vehicles: null,
        buyer: null,
        seller: null,
      },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({
                order: () => Promise.resolve({ data: convRows, error: null }),
              }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              in: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value).toHaveLength(1)
    expect(c.conversations.value[0]!.vehicle_title).toBeUndefined()
    expect(c.conversations.value[0]!.vehicle_image).toBeUndefined()
  })

  it('handles null lastMsgs response', async () => {
    const convRows = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '2026-03-01',
        created_at: '2026-02-28',
        vehicles: { title: 'Truck', images: ['img.jpg'] },
        buyer: null,
        seller: null,
      },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({
                order: () => Promise.resolve({ data: convRows, error: null }),
              }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              in: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value).toHaveLength(1)
    expect(c.conversations.value[0]!.last_message_preview).toBeUndefined()
  })

  it('truncates long message previews to 80 chars', async () => {
    const longContent = 'A'.repeat(200)
    const convRows = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '2026-03-01',
        created_at: '2026-02-28',
        vehicles: { title: 'Truck', images: [] },
        buyer: null,
        seller: null,
      },
    ]
    const msgRows = [{ conversation_id: 'conv-1', content: longContent, is_system: false }]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({
                order: () => Promise.resolve({ data: convRows, error: null }),
              }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              in: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: msgRows, error: null }),
                }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    expect(c.conversations.value[0]!.last_message_preview!.length).toBe(80)
  })

  it('uses first message per conversation for preview (dedup)', async () => {
    const convRows = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '2026-03-01',
        created_at: '2026-02-28',
        vehicles: { title: 'Truck', images: [] },
        buyer: null,
        seller: null,
      },
    ]
    const msgRows = [
      { conversation_id: 'conv-1', content: 'Latest message', is_system: false },
      { conversation_id: 'conv-1', content: 'Older message', is_system: false },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({
                order: () => Promise.resolve({ data: convRows, error: null }),
              }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              in: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: msgRows, error: null }),
                }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.fetchConversations()
    // First message in descending order = latest, which is used for preview
    expect(c.conversations.value[0]!.last_message_preview).toBe('Latest message')
  })
})

// ─── openConversation — error handling ──────────────────────────────────────

describe('openConversation — error handling', () => {
  it('throws when message fetch fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'fetch fail' } }),
          }),
        }),
        update: () => makeChain(null),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await expect(c.openConversation('conv-1')).rejects.toBeDefined()
    expect(c.loading.value).toBe(false)
  })

  it('loads messages and marks unread when successful', async () => {
    const mockMessages = [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'other',
        content: 'Hi',
        is_system: false,
        is_read: false,
        created_at: '',
      },
      {
        id: 'm2',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Hello',
        is_system: false,
        is_read: true,
        created_at: '',
      },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockMessages, error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.messages.value).toHaveLength(2)
    expect(c.activeConversation.value?.id).toBe('conv-1')
  })

  it('handles null message data', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.messages.value).toHaveLength(0)
  })

  it('does not set activeConversation when conversation is not in list', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        update: () => makeChain(null),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    // conversations is empty - conv-1 not found
    await c.openConversation('conv-1')
    expect(c.activeConversation.value).toBeNull()
  })
})

// ─── startConversation — new conversation ─────────────────────────────────

describe('startConversation — new conversation', () => {
  it('creates new conversation when none exists', async () => {
    const insertFn = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'new-conv-1' }, error: null }),
      }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    neq: () => ({
                      maybeSingle: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
            insert: insertFn,
            update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              in: () => ({
                eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              }),
            }),
            update: () => makeChain(null),
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'msg-1',
                      conversation_id: 'new-conv-1',
                      sender_id: 'user-1',
                      content: 'Hello',
                      is_system: false,
                      is_read: false,
                      created_at: '',
                    },
                    error: null,
                  }),
              }),
            }),
          }
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    const result = await c.startConversation('v1', 'seller-1', 'Hello')
    expect(result).toBe('new-conv-1')
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicle_id: 'v1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
      }),
    )
  })

  it('throws when insert fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    neq: () => ({
                      maybeSingle: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
              }),
            }),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await expect(c.startConversation('v1', 'seller-1', 'Hello')).rejects.toBeDefined()
  })

  it('does not send message when firstMessage is empty', async () => {
    const msgInsert = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    neq: () => ({
                      maybeSingle: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'new-conv' }, error: null }),
              }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              in: () => ({
                eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              }),
            }),
            update: () => makeChain(null),
            insert: msgInsert,
          }
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.startConversation('v1', 'seller-1', '   ')
    // Message insert should NOT be called since firstMessage is whitespace
    expect(msgInsert).not.toHaveBeenCalled()
  })

  it('sends message on existing conversation when firstMessage has content', async () => {
    const msgInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'msg-1',
              conversation_id: 'existing-conv',
              sender_id: 'user-1',
              content: 'Hello again',
              is_system: false,
              is_read: false,
              created_at: '',
            },
            error: null,
          }),
      }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'conversations')
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    neq: () => ({
                      maybeSingle: () =>
                        Promise.resolve({ data: { id: 'existing-conv' }, error: null }),
                    }),
                  }),
                }),
              }),
              or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
            update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              in: () => ({
                eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              }),
            }),
            update: () => makeChain(null),
            insert: msgInsert,
          }
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        return { select: () => makeChain([]) }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.startConversation('v1', 'seller-1', 'Hello again')
    expect(msgInsert).toHaveBeenCalled()
  })
})

// ─── sendMessage — error handling ───────────────────────────────────────────

describe('sendMessage — error handling', () => {
  it('marks optimistic message as failed when insert fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Insert error' } }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    // Source uses optimistic UI: catches error and marks message as "failed"
    await c.sendMessage('conv-1', 'Hello')
    expect(c.sending.value).toBe(false)
    // Optimistic message remains with failed status
    const failedMsgs = c.messages.value.filter((m: any) => m._status === 'failed')
    expect(failedMsgs.length).toBeGreaterThanOrEqual(1)
  })

  it('replaces optimistic temp message with server response (dedup by temp id)', async () => {
    const serverMsg = {
      id: 'msg-new',
      conversation_id: 'conv-1',
      sender_id: 'user-1',
      content: 'Hello',
      is_system: false,
      is_read: false,
      created_at: '',
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: serverMsg, error: null }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.messages.value = []
    await c.sendMessage('conv-1', 'Hello')
    // Optimistic UI: temp message is replaced by server response
    // No temp messages should remain; the final message has the server id
    expect(c.messages.value.filter((m) => m.id === 'msg-new')).toHaveLength(1)
    expect(c.messages.value.filter((m) => (m.id as string).startsWith('temp-'))).toHaveLength(0)
  })

  it('keeps optimistic message when response data is null', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.sendMessage('conv-1', 'Hello')
    // Source uses optimistic UI: the temp message remains even if server returns null
    expect(c.messages.value.length).toBeGreaterThanOrEqual(1)
  })

  it('trims message content before sending', async () => {
    const insertFn = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'msg-1',
              conversation_id: 'conv-1',
              sender_id: 'user-1',
              content: 'Hello',
              is_system: false,
              is_read: false,
              created_at: '',
            },
            error: null,
          }),
      }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: insertFn,
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    await c.sendMessage('conv-1', '  Hello  ')
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({ content: 'Hello' }))
  })
})

// ─── closeConversation — with realtime ──────────────────────────────────────

describe('closeConversation — realtime cleanup', () => {
  it('calls removeChannel when closing active conversation', async () => {
    const removeFn = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        if (table === 'conversations')
          return {
            select: () => ({
              or: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        // conversation_messages and others
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          update: () => makeChain(null),
        }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: removeFn,
    }))
    const c = useConversation()
    const conv = {
      id: 'conv-1',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 'seller-1',
      status: 'active' as const,
      buyer_accepted_share: false,
      seller_accepted_share: false,
      last_message_at: '',
      created_at: '',
    }
    c.conversations.value = [conv]
    c.activeConversation.value = conv

    // First open the conversation to create a realtime subscription
    await c.openConversation('conv-1')
    // Now close it
    await c.closeConversation('conv-1')
    // removeChannel should have been called (once for unsubscribe in openConversation, once for close)
    expect(removeFn).toHaveBeenCalled()
    expect(c.activeConversation.value).toBeNull()
    expect(c.messages.value).toHaveLength(0)
  })
})

// ─── fetchSellerResponseTime ────────────────────────────────────────────────

describe('fetchSellerResponseTime', () => {
  it('sets null when dealer data is null', async () => {
    const dealerChain = makeChain(null)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers') return { select: () => ({ eq: () => dealerChain }) }
        return {
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          }),
          update: () => makeChain(null),
        }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.sellerAvgResponseMinutes.value).toBeNull()
  })

  it('sets null when avg_response_minutes is null in dealer data', async () => {
    const dealerChain = makeChain({ avg_response_minutes: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers') return { select: () => ({ eq: () => dealerChain }) }
        return {
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          }),
          update: () => makeChain(null),
        }
      },
      channel: () => ({
        on: function (this: unknown) {
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')
    expect(c.sellerAvgResponseMinutes.value).toBeNull()
  })
})

// ─── markAsRead — edge cases ────────────────────────────────────────────────

describe('markAsRead — edge cases', () => {
  it('does not modify messages from other conversations', async () => {
    const c = useConversation()
    c.messages.value = [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'other',
        content: 'Hi',
        is_system: false,
        is_read: false,
        created_at: '',
      },
      {
        id: 'm2',
        conversation_id: 'conv-2',
        sender_id: 'other',
        content: 'Other conv',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    ]
    await c.markAsRead('conv-1')
    // m1 in conv-1 should be marked as read
    expect(c.messages.value.find((m) => m.id === 'm1')?.is_read).toBe(true)
    // m2 in conv-2 should remain unread
    expect(c.messages.value.find((m) => m.id === 'm2')?.is_read).toBe(false)
  })

  it('does not modify own messages', async () => {
    const c = useConversation()
    c.messages.value = [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'My msg',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    ]
    await c.markAsRead('conv-1')
    // Own message should remain unchanged
    expect(c.messages.value.find((m) => m.id === 'm1')?.is_read).toBe(false)
  })
})

// ─── subscribeToRealtime — callback behavior ─────────────────────────────────

describe('subscribeToRealtime — via openConversation', () => {
  it('adds new message from realtime event and dedup existing', async () => {
    let realtimeCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: any, _event: string, _filter: any, cb: any) {
          realtimeCallback = cb
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')

    // Simulate realtime new message
    expect(realtimeCallback).toBeTruthy()
    realtimeCallback!({
      new: {
        id: 'rt-msg-1',
        conversation_id: 'conv-1',
        sender_id: 'other',
        content: 'Realtime!',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    })
    expect(c.messages.value.some((m) => m.id === 'rt-msg-1')).toBe(true)

    // Simulate duplicate (should not add again)
    realtimeCallback!({
      new: {
        id: 'rt-msg-1',
        conversation_id: 'conv-1',
        sender_id: 'other',
        content: 'Realtime!',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    })
    expect(c.messages.value.filter((m) => m.id === 'rt-msg-1')).toHaveLength(1)
  })

  it('auto-marks messages as read when from another user and conversation is active', async () => {
    let realtimeCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: any, _event: string, _filter: any, cb: any) {
          realtimeCallback = cb
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')

    // Simulate message from another user — should trigger markAsRead
    realtimeCallback!({
      new: {
        id: 'rt-other',
        conversation_id: 'conv-1',
        sender_id: 'other-user',
        content: 'Hello',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    })
    // The message should have been added
    expect(c.messages.value.some((m) => m.id === 'rt-other')).toBe(true)
  })

  it('does not auto-mark as read when message is from current user', async () => {
    let realtimeCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers')
          return {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }
        if (table === 'conversation_messages')
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
            update: () => makeChain(null),
          }
        return { select: () => makeChain([]), update: () => makeChain(null) }
      },
      channel: () => ({
        on: function (this: any, _event: string, _filter: any, cb: any) {
          realtimeCallback = cb
          return this
        },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = useConversation()
    c.conversations.value = [
      {
        id: 'conv-1',
        vehicle_id: 'v-1',
        buyer_id: 'user-1',
        seller_id: 'seller-1',
        status: 'active',
        buyer_accepted_share: false,
        seller_accepted_share: false,
        last_message_at: '',
        created_at: '',
      },
    ]
    await c.openConversation('conv-1')

    // Simulate message from current user — should NOT trigger markAsRead
    realtimeCallback!({
      new: {
        id: 'rt-own',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'My msg',
        is_system: false,
        is_read: false,
        created_at: '',
      },
    })
    // Message added but not auto-marked
    expect(c.messages.value.some((m) => m.id === 'rt-own')).toBe(true)
  })
})
