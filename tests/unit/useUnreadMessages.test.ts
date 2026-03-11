import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Dynamic import (module-level singleton state) ────────────────────────────

function makeChain(data: unknown = [], count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'or', 'in', 'order', 'select'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error: null, count }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient({ convs = [] as unknown[], count = 0 } = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => ({
      select: () => makeChain(table === 'conversations' ? convs : [], count),
    }),
    channel: () => ({
      on: function (this: unknown) { return this },
      subscribe: () => ({}),
    }),
    removeChannel: vi.fn(),
  }))
}

async function getUnreadMessages() {
  const mod = await import('../../app/composables/useUnreadMessages')
  return mod.useUnreadMessages()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
  vi.stubGlobal('watch', (_getter: unknown, _fn: unknown, _opts?: unknown) => {})
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('unreadCount starts at 0', async () => {
    const c = await getUnreadMessages()
    expect(c.unreadCount.value).toBe(0)
  })
})

// ─── refresh ──────────────────────────────────────────────────────────────────

describe('refresh', () => {
  it('sets unreadCount to 0 when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = await getUnreadMessages()
    await c.refresh()
    expect(c.unreadCount.value).toBe(0)
  })

  it('sets unreadCount to 0 when user has no conversations', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    stubClient({ convs: [] })
    const c = await getUnreadMessages()
    await c.refresh()
    expect(c.unreadCount.value).toBe(0)
  })

  it('sets unreadCount from DB count when user has conversations', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    // Conversations query returns 1 conversation
    let callCount = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          callCount++
          // First call: conversations query
          if (callCount === 1) return makeChain([{ id: 'c1' }], 0)
          // Second call: messages count query
          return makeChain([], 3)
        },
      }),
      channel: () => ({
        on: function (this: unknown) { return this },
        subscribe: () => ({}),
      }),
      removeChannel: vi.fn(),
    }))
    const c = await getUnreadMessages()
    await c.refresh()
    expect(c.unreadCount.value).toBe(3)
  })
})

// ─── Module isolation ─────────────────────────────────────────────────────────

describe('module isolation', () => {
  it('each test gets fresh unreadCount (resetModules works)', async () => {
    const c1 = await getUnreadMessages()
    c1.unreadCount.value  // access to ensure it's readable

    vi.resetModules()
    const c2 = await getUnreadMessages()
    // Should start fresh at 0
    expect(c2.unreadCount.value).toBe(0)
  })
})
