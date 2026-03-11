import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePushNotifications } from '../../app/composables/usePushNotifications'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'select', 'delete'].forEach((m) => { chain[m] = () => chain })
  chain.single = () => Promise.resolve({ data, error })
  chain.upsert = () => Promise.resolve({ data: null, error })
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
  }))
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { vapidPublicKey: 'test-vapid-key' },
  }))
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return fn() },
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('isSubscribed starts as false', () => {
    const c = usePushNotifications()
    expect(c.isSubscribed.value).toBe(false)
  })

  it('loading starts as false', () => {
    const c = usePushNotifications()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = usePushNotifications()
    expect(c.error.value).toBeNull()
  })
})

// ─── isSupported ──────────────────────────────────────────────────────────────

describe('isSupported', () => {
  it('returns false when globalThis.window is undefined', () => {
    // In test env, window might not be defined
    const originalWindow = globalThis.window
    // @ts-expect-error testing undefined window
    delete globalThis.window
    const c = usePushNotifications()
    expect(c.isSupported.value).toBe(false)
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow
    }
  })

  it('returns false when PushManager not in globalThis', () => {
    // In jsdom test env, PushManager is not available
    const c = usePushNotifications()
    // PushManager is typically not available in vitest jsdom
    expect(c.isSupported.value).toBe(false)
  })
})

// ─── subscribe ────────────────────────────────────────────────────────────────

describe('subscribe', () => {
  it('returns false when push not supported', async () => {
    // PushManager not in test env → isSupported = false
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(false)
  })

  it('sets error when push not supported', async () => {
    const c = usePushNotifications()
    await c.subscribe()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── unsubscribe ──────────────────────────────────────────────────────────────

describe('unsubscribe', () => {
  it('returns false when push not supported', async () => {
    const c = usePushNotifications()
    const result = await c.unsubscribe()
    expect(result).toBe(false)
  })
})

// ─── checkSubscription ────────────────────────────────────────────────────────

describe('checkSubscription', () => {
  it('sets isSubscribed to false when push not supported', async () => {
    const c = usePushNotifications()
    await c.checkSubscription()
    expect(c.isSubscribed.value).toBe(false)
  })

  it('sets isSubscribed to false when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = usePushNotifications()
    await c.checkSubscription()
    expect(c.isSubscribed.value).toBe(false)
  })
})

// ─── requestPermission ────────────────────────────────────────────────────────

describe('requestPermission', () => {
  it('throws when push not supported', async () => {
    const c = usePushNotifications()
    await expect(c.requestPermission()).rejects.toThrow()
  })
})

// ─── subscribe — user not logged in ──────────────────────────────────────────

describe('subscribe — user checks', () => {
  it('returns false and sets error when user is null', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    // Make isSupported return true for this test
    vi.stubGlobal('navigator', { serviceWorker: {} })
    vi.stubGlobal('PushManager', {})
    vi.stubGlobal('Notification', { requestPermission: vi.fn() })
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('returns false when vapid key is empty', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { vapidPublicKey: '' },
    }))
    vi.stubGlobal('navigator', { serviceWorker: {} })
    vi.stubGlobal('PushManager', {})
    vi.stubGlobal('Notification', { requestPermission: vi.fn() })
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })
})

// ─── unsubscribe — user not logged in ────────────────────────────────────────

describe('unsubscribe — user checks', () => {
  it('returns false when user is null', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = usePushNotifications()
    const result = await c.unsubscribe()
    expect(result).toBe(false)
  })
})

// ─── onMounted callback ─────────────────────────────────────────────────────

describe('onMounted callback', () => {
  it('calls onMounted during initialization', () => {
    const mountedFn = vi.fn()
    vi.stubGlobal('onMounted', mountedFn)
    usePushNotifications()
    expect(mountedFn).toHaveBeenCalledTimes(1)
  })

  it('executes mounted callback when user exists', () => {
    let mountedCb: (() => void) | null = null
    vi.stubGlobal('onMounted', (cb: () => void) => { mountedCb = cb })
    usePushNotifications()
    // The mounted callback calls checkSubscription which sets isSubscribed=false (since not supported)
    expect(mountedCb).toBeTruthy()
    if (mountedCb) (mountedCb as () => void)()
    // Should not throw
  })
})

// ─── watch callback ──────────────────────────────────────────────────────────

describe('watch callback', () => {
  it('registers watch on user', () => {
    const watchFn = vi.fn()
    vi.stubGlobal('watch', watchFn)
    usePushNotifications()
    expect(watchFn).toHaveBeenCalledTimes(1)
  })

  it('watch callback sets isSubscribed=false when user becomes null', () => {
    let watchCb: ((newUser: unknown) => void) | null = null
    vi.stubGlobal('watch', (_source: unknown, cb: (newUser: unknown) => void) => { watchCb = cb })
    const c = usePushNotifications()
    if (watchCb) (watchCb as (u: unknown) => void)(null)
    expect(c.isSubscribed.value).toBe(false)
  })
})

// ─── Full service worker mocks ──────────────────────────────────────────────

function makeSupportedEnv() {
  vi.stubGlobal('PushManager', {})
  vi.stubGlobal('Notification', {
    requestPermission: vi.fn().mockResolvedValue('granted'),
  })
  const mockSubscription = {
    endpoint: 'https://push.example.com/endpoint',
    toJSON: () => ({
      endpoint: 'https://push.example.com/endpoint',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
  const mockPushManager = {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue(mockSubscription),
  }
  const mockRegistration = { pushManager: mockPushManager }
  vi.stubGlobal('navigator', {
    serviceWorker: {
      ready: Promise.resolve(mockRegistration),
    },
  })
  return { mockSubscription, mockPushManager, mockRegistration }
}

// ─── subscribe — full success path ──────────────────────────────────────────

describe('subscribe — success with service worker', () => {
  it('returns true and sets isSubscribed on success', async () => {
    const { mockPushManager } = makeSupportedEnv()
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(true)
    expect(c.isSubscribed.value).toBe(true)
    expect(c.loading.value).toBe(false)
    expect(mockPushManager.subscribe).toHaveBeenCalled()
  })

  it('uses existing subscription if one exists', async () => {
    const existingSub = {
      endpoint: 'https://push.example.com/existing',
      toJSON: () => ({ endpoint: 'https://push.example.com/existing', keys: { p256dh: 'key1', auth: 'key2' } }),
      unsubscribe: vi.fn(),
    }
    makeSupportedEnv()
    const mockPM = {
      getSubscription: vi.fn().mockResolvedValue(existingSub),
      subscribe: vi.fn(),
    }
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve({ pushManager: mockPM }) },
    })
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(true)
    expect(mockPM.subscribe).not.toHaveBeenCalled() // did not create new
  })

  it('returns false when permission is denied', async () => {
    makeSupportedEnv()
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockResolvedValue('denied'),
    })
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(false)
    expect(c.error.value).toContain('denied')
    expect(c.loading.value).toBe(false)
  })

  it('returns false and sets error on supabase upsert failure', async () => {
    makeSupportedEnv()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Upsert failed' } }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('catches exceptions in subscribe and sets error', async () => {
    makeSupportedEnv()
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockRejectedValue(new Error('Permission API failed')),
    })
    const c = usePushNotifications()
    const result = await c.subscribe()
    expect(result).toBe(false)
    expect(c.error.value).toBe('Permission API failed')
    expect(c.loading.value).toBe(false)
  })
})

// ─── unsubscribe — full success path ────────────────────────────────────────

describe('unsubscribe — success with service worker', () => {
  it('returns true and sets isSubscribed=false on success', async () => {
    const { mockSubscription, mockPushManager } = makeSupportedEnv()
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription)
    const c = usePushNotifications()
    const result = await c.unsubscribe()
    expect(result).toBe(true)
    expect(c.isSubscribed.value).toBe(false)
    expect(c.loading.value).toBe(false)
    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
  })

  it('returns true when no existing subscription', async () => {
    makeSupportedEnv() // getSubscription returns null by default
    const c = usePushNotifications()
    const result = await c.unsubscribe()
    expect(result).toBe(true)
    expect(c.isSubscribed.value).toBe(false)
    expect(c.loading.value).toBe(false)
  })

  it('returns false and sets error on supabase delete failure', async () => {
    const { mockSubscription, mockPushManager } = makeSupportedEnv()
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        upsert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: null, error: { message: 'Delete failed' } }),
          }),
        }),
      }),
    }))
    const c = usePushNotifications()
    const result = await c.unsubscribe()
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('catches exceptions in unsubscribe', async () => {
    makeSupportedEnv()
    // Make serviceWorker.ready reject
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.reject(new Error('SW error')) },
    })
    const c = usePushNotifications()
    const result = await c.unsubscribe()
    expect(result).toBe(false)
    expect(c.error.value).toBe('SW error')
    expect(c.loading.value).toBe(false)
  })
})

// ─── checkSubscription — with service worker ────────────────────────────────

describe('checkSubscription — with service worker', () => {
  it('sets isSubscribed=true when subscription exists in DB', async () => {
    const { mockSubscription, mockPushManager } = makeSupportedEnv()
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain({ id: 'sub-1' }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = usePushNotifications()
    await c.checkSubscription()
    expect(c.isSubscribed.value).toBe(true)
  })

  it('sets isSubscribed=false when subscription not in DB', async () => {
    const { mockSubscription, mockPushManager } = makeSupportedEnv()
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription)
    // makeChain with null data means not found
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null),
        upsert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = usePushNotifications()
    await c.checkSubscription()
    expect(c.isSubscribed.value).toBe(false)
  })

  it('sets isSubscribed=false when no browser subscription', async () => {
    makeSupportedEnv() // getSubscription returns null
    const c = usePushNotifications()
    await c.checkSubscription()
    expect(c.isSubscribed.value).toBe(false)
  })

  it('sets isSubscribed=false on error', async () => {
    makeSupportedEnv()
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.reject(new Error('SW failure')) },
    })
    const c = usePushNotifications()
    await c.checkSubscription()
    expect(c.isSubscribed.value).toBe(false)
  })
})

// ─── requestPermission — success ────────────────────────────────────────────

describe('requestPermission — success', () => {
  it('returns the permission result', async () => {
    makeSupportedEnv()
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockResolvedValue('granted'),
    })
    const c = usePushNotifications()
    const result = await c.requestPermission()
    expect(result).toBe('granted')
  })

  it('returns denied when user denies', async () => {
    makeSupportedEnv()
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockResolvedValue('denied'),
    })
    const c = usePushNotifications()
    const result = await c.requestPermission()
    expect(result).toBe('denied')
  })
})
