/**
 * Tests for app/plugins/supabase-auth.client.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFetchProfile = vi.fn()

vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)
vi.stubGlobal('useSupabaseClient', () => ({
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
}))
vi.stubGlobal('useAuth', () => ({ fetchProfile: mockFetchProfile }))

// ── Dynamic import (after stubs) ──────────────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  pluginFn = (await import('../../app/plugins/supabase-auth.client')).default
})

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('supabase-auth plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockImplementation(() => {})
  })

  it('calls fetchProfile when session exists on startup', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
    pluginFn()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockFetchProfile).toHaveBeenCalled()
  })

  it('does not call fetchProfile when no session on startup', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    pluginFn()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockFetchProfile).not.toHaveBeenCalled()
  })

  it('registers onAuthStateChange listener', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    pluginFn()
    expect(mockOnAuthStateChange).toHaveBeenCalled()
  })

  it('calls fetchProfile when auth state changes with user session', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    // onAuthStateChange receives a callback (event, session) => void
    mockOnAuthStateChange.mockImplementation((callback: Function) => {
      callback('SIGNED_IN', { user: { id: 'user-2' } })
    })
    pluginFn()
    expect(mockFetchProfile).toHaveBeenCalled()
  })

  it('does not call fetchProfile when auth state changes with null session', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockImplementation((callback: Function) => {
      callback('SIGNED_OUT', null)
    })
    pluginFn()
    expect(mockFetchProfile).not.toHaveBeenCalled()
  })
})
