import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Mock Supabase
const mockTrack = vi.fn().mockResolvedValue(undefined)
const mockUntrack = vi.fn().mockResolvedValue(undefined)
const mockPresenceState = vi.fn().mockReturnValue({})
const mockSubscribe = vi.fn()
const mockOn = vi.fn()
const mockRemoveChannel = vi.fn()

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
  track: mockTrack,
  untrack: mockUntrack,
  presenceState: mockPresenceState,
}

// Chain pattern: on() returns self
mockOn.mockReturnValue(mockChannel)

vi.stubGlobal('useSupabaseClient', () => ({
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: mockRemoveChannel,
}))
vi.stubGlobal('useSupabaseUser', () => ref({ id: 'user-123' }))
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', (fn: Function) => ({ value: fn() }))

describe('usePresence', () => {
  let usePresence: typeof import('../../app/composables/usePresence').usePresence

  beforeEach(async () => {
    vi.clearAllMocks()
    mockPresenceState.mockReturnValue({})
    mockOn.mockReturnValue(mockChannel)
    vi.resetModules()
    const mod = await import('../../app/composables/usePresence')
    usePresence = mod.usePresence
  })

  it('exports viewerCount, join, and leave', () => {
    const { viewerCount, join, leave } = usePresence('vehicle', 'v-1')
    expect(viewerCount).toBeDefined()
    expect(typeof join).toBe('function')
    expect(typeof leave).toBe('function')
  })

  it('initializes viewerCount to 0', () => {
    const { viewerCount } = usePresence('vehicle', 'v-1')
    expect(viewerCount.value).toBe(0)
  })

  it('join subscribes to a presence channel', async () => {
    const { join } = usePresence('vehicle', 'v-1')

    // Mock subscribe to invoke callback
    mockSubscribe.mockImplementation(async (cb: Function) => {
      await cb('SUBSCRIBED')
    })

    await join()

    expect(mockOn).toHaveBeenCalledTimes(3) // sync, join, leave
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockTrack).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-123' }))
  })

  it('join does nothing if already joined', async () => {
    const { join } = usePresence('vehicle', 'v-1')

    mockSubscribe.mockImplementation(async (cb: Function) => {
      await cb('SUBSCRIBED')
    })

    await join()
    await join() // second call

    // subscribe should only be called once
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
  })

  it('leave unsubscribes and resets viewerCount', () => {
    const { join, leave, viewerCount } = usePresence('vehicle', 'v-1')

    mockSubscribe.mockImplementation(async (cb: Function) => {
      await cb('SUBSCRIBED')
    })

    // Simulate join first
    void join()

    leave()

    expect(mockUntrack).toHaveBeenCalledTimes(1)
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1)
    expect(viewerCount.value).toBe(0)
  })

  it('leave is safe to call without join', () => {
    const { leave } = usePresence('vehicle', 'v-1')
    expect(() => leave()).not.toThrow()
  })
})
