import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserChat } from '../../app/composables/useUserChat'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'or', 'order', 'select', 'filter'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient({ data = [] as unknown[], insertError = null as unknown, updateError = null as unknown } = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(data),
      insert: () => Promise.resolve({ data: null, error: insertError }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: updateError }),
        }),
      }),
    }),
    channel: () => ({
      on: function (this: unknown) { return this },
      subscribe: () => ({}),
    }),
    removeChannel: vi.fn(),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('messages starts as empty array', () => {
    const c = useUserChat()
    expect(c.messages.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useUserChat()
    expect(c.loading.value).toBe(false)
  })

  it('sending starts as false', () => {
    const c = useUserChat()
    expect(c.sending.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useUserChat()
    expect(c.error.value).toBeNull()
  })

  it('unreadCount starts as 0', () => {
    const c = useUserChat()
    expect(c.unreadCount.value).toBe(0)
  })
})

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('returns time string for today', () => {
    const now = new Date()
    const c = useUserChat()
    const result = c.formatTime(now.toISOString())
    expect(result).toMatch(/\d+:\d+/)
  })

  it('returns Ayer for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const c = useUserChat()
    const result = c.formatTime(yesterday.toISOString())
    expect(result).toBe('Ayer')
  })

  it('returns weekday for 3 days ago', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const c = useUserChat()
    const result = c.formatTime(threeDaysAgo.toISOString())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns dd/mm for old dates', () => {
    const old = new Date('2025-01-15T12:00:00Z')
    const c = useUserChat()
    const result = c.formatTime(old.toISOString())
    expect(result).toContain('/')
  })
})

// ─── fetchMessages ────────────────────────────────────────────────────────────

describe('fetchMessages', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useUserChat()
    await c.fetchMessages()
    expect(c.loading.value).toBe(false)
  })

  it('sets messages from DB', async () => {
    stubClient({ data: [{ id: 'm1', direction: 'user_to_admin', is_read: true }] })
    const c = useUserChat()
    await c.fetchMessages()
    expect(c.messages.value).toHaveLength(1)
  })

  it('counts unread admin messages', async () => {
    stubClient({ data: [
      { id: 'm1', direction: 'admin_to_user', is_read: false },
      { id: 'm2', direction: 'admin_to_user', is_read: true },
      { id: 'm3', direction: 'user_to_admin', is_read: false },
    ]})
    const c = useUserChat()
    await c.fetchMessages()
    expect(c.unreadCount.value).toBe(1)
  })

  it('sets loading to false after success', async () => {
    const c = useUserChat()
    await c.fetchMessages()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useUserChat()
    await c.fetchMessages()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── sendMessage ──────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useUserChat()
    await c.sendMessage('Hello')
    expect(c.sending.value).toBe(false)
  })

  it('does nothing when message is empty', async () => {
    const c = useUserChat()
    await c.sendMessage('   ')
    expect(c.sending.value).toBe(false)
  })

  it('sets sending to false after success', async () => {
    const c = useUserChat()
    await c.sendMessage('Hello')
    expect(c.sending.value).toBe(false)
  })

  it('sets error on insert failure', async () => {
    stubClient({ insertError: new Error('Insert failed') })
    const c = useUserChat()
    await c.sendMessage('Hello')
    expect(c.error.value).toBeTruthy()
  })
})
