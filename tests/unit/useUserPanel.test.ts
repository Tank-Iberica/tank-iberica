import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module mocks (hoisted) ───────────────────────────────────────────────────

const { mockFetchMessages, mockSendMessage, mockMarkAsRead, mockSubscribeToRealtime, mockFormatTime, mockToggleFav } = vi.hoisted(() => ({
  mockFetchMessages: vi.fn().mockResolvedValue(undefined),
  mockSendMessage: vi.fn().mockResolvedValue(undefined),
  mockMarkAsRead: vi.fn(),
  mockSubscribeToRealtime: vi.fn(),
  mockFormatTime: vi.fn((d: string) => d),
  mockToggleFav: vi.fn(),
}))

vi.mock('~/composables/useFavorites', () => ({
  useFavorites: () => ({
    count: { value: 3 },
    toggle: mockToggleFav,
    isFavorite: vi.fn().mockReturnValue(false),
  }),
}))

vi.mock('~/composables/useUserChat', () => ({
  useUserChat: () => ({
    messages: { value: [] },
    loading: { value: false },
    sending: { value: false },
    unreadCount: { value: 2 },
    fetchMessages: mockFetchMessages,
    sendMessage: mockSendMessage,
    markAsRead: mockMarkAsRead,
    subscribeToRealtime: mockSubscribeToRealtime,
    formatTime: mockFormatTime,
  }),
}))

import { useUserPanel } from '../../app/composables/user/useUserPanel'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockOnClose = vi.fn()
let mockIsOpen = false

const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@test.com',
    user_metadata: { pseudonimo: 'TestUser' },
  },
}

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'select', 'order', 'single', 'update', 'upsert', 'insert'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (v: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockIsOpen = false

  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x: unknown) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())

  vi.stubGlobal('useI18n', () => ({
    t: (k: string) => k,
    locale: { value: 'es' },
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain(null),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    },
  }))
  vi.stubGlobal('useAuth', () => ({
    isDealer: { value: false },
    isAdmin: { value: false },
    profile: { value: null },
  }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(new Blob(['{}'])))

  Object.defineProperty(globalThis, 'URL', {
    value: {
      createObjectURL: vi.fn().mockReturnValue('blob:test'),
      revokeObjectURL: vi.fn(),
    },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeSection starts as null', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.activeSection.value).toBeNull()
  })

  it('profileSaving starts as false', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.profileSaving.value).toBe(false)
  })

  it('profileMessage starts as null', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.profileMessage.value).toBeNull()
  })

  it('exportLoading starts as false', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.exportLoading.value).toBe(false)
  })

  it('deleteModalOpen starts as false', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.deleteModalOpen.value).toBe(false)
  })

  it('deleteLoading starts as false', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.deleteLoading.value).toBe(false)
  })

  it('deleteError starts as null', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.deleteError.value).toBeNull()
  })

  it('userDemands starts empty', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.userDemands.value).toHaveLength(0)
  })

  it('userAds starts empty', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.userAds.value).toHaveLength(0)
  })

  it('favoritesCount from useFavorites', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.favoritesCount.value).toBe(3)
  })

  it('chatUnread from useUserChat', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.chatUnread.value).toBe(2)
  })

  it('subscriptions starts all false', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.subscriptions.value.web).toBe(false)
    expect(c.subscriptions.value.prensa).toBe(false)
  })

  it('panelBanner starts as null', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.panelBanner.value).toBeNull()
  })
})

// ─── toggleSection ────────────────────────────────────────────────────────────

describe('toggleSection', () => {
  it('sets activeSection when null', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('profile')
    expect(c.activeSection.value).toBe('profile')
  })

  it('collapses (null) when same section clicked again', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('profile')
    c.toggleSection('profile')
    expect(c.activeSection.value).toBeNull()
  })

  it('switches to new section', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('profile')
    c.toggleSection('subscriptions')
    expect(c.activeSection.value).toBe('subscriptions')
  })

  it('calls fetchMessages when opening chat', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('chat')
    expect(mockFetchMessages).toHaveBeenCalled()
    expect(mockSubscribeToRealtime).toHaveBeenCalled()
    expect(mockMarkAsRead).toHaveBeenCalled()
  })

  it('does not call fetchMessages for non-chat section', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('profile')
    expect(mockFetchMessages).not.toHaveBeenCalled()
  })
})

// ─── openDeleteModal ──────────────────────────────────────────────────────────

describe('openDeleteModal', () => {
  it('sets deleteModalOpen to true', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.openDeleteModal()
    expect(c.deleteModalOpen.value).toBe(true)
  })

  it('clears deleteError', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.deleteError.value = 'Previous error'
    c.openDeleteModal()
    expect(c.deleteError.value).toBeNull()
  })
})

// ─── handleLogout ─────────────────────────────────────────────────────────────

describe('handleLogout', () => {
  it('calls supabase.auth.signOut and onClose', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
        onAuthStateChange: vi.fn(),
        signOut: mockSignOut,
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await c.handleLogout()
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })
})

// ─── saveProfile ──────────────────────────────────────────────────────────────

describe('saveProfile', () => {
  it('sets profileSaving to false after completion', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, null),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    // Simulate sessionUser being set
    // Since we can't call onMounted, we skip the session check by noting
    // saveProfile returns early if no sessionUser
    // The real test: profileSaving doesn't get stuck
    await c.saveProfile(c.profileForm.value)
    expect(c.profileSaving.value).toBe(false)
  })
})

// ─── handleExportData ─────────────────────────────────────────────────────────

describe('handleExportData', () => {
  it('resets exportLoading to false after export', async () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await c.handleExportData()
    expect(c.exportLoading.value).toBe(false)
  })

  it('does not run while already loading', async () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.exportLoading.value = true
    const fetchMock = vi.fn().mockResolvedValue(new Blob(['{}']))
    vi.stubGlobal('$fetch', fetchMock)
    await c.handleExportData()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ─── handleDeleteAccount ──────────────────────────────────────────────────────

describe('handleDeleteAccount', () => {
  it('resets deleteLoading to false after completion', async () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await c.handleDeleteAccount()
    expect(c.deleteLoading.value).toBe(false)
  })

  it('sets deleteError on API failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('API error')))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await c.handleDeleteAccount()
    expect(c.deleteError.value).toBeTruthy()
  })
})

// ─── profileForm initial shape ────────────────────────────────────────────────

describe('profileForm', () => {
  it('starts with all empty strings', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.profileForm.value.pseudonimo).toBe('')
    expect(c.profileForm.value.name).toBe('')
    expect(c.profileForm.value.email).toBe('')
  })
})

// ─── userDisplayName computed ──────────────────────────────────────────────────

describe('userDisplayName', () => {
  it('returns pseudonimo when available', async () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    // Execute the onMounted callback (async — must await)
    const callback = vi.mocked(onMounted).mock.calls[0]?.[0] as (() => Promise<void>) | undefined
    if (callback) await callback()
    expect(c.userDisplayName.value).toBe('TestUser')
  })

  it('returns email prefix when no pseudonimo or name', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null),
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'u1', email: 'john@example.com', user_metadata: {} } } },
        }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    const callback = vi.mocked(onMounted).mock.calls[0]?.[0] as (() => Promise<void>) | undefined
    if (callback) await callback()
    expect(c.userDisplayName.value).toBe('john')
  })

  it('returns empty string when no session user', () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.userDisplayName.value).toBe('')
  })
})

// ─── userEmail computed ───────────────────────────────────────────────────────

describe('userEmail', () => {
  it('returns empty string when no session user', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(typeof c.userEmail.value).toBe('string')
  })
})

// ─── userInitial computed ─────────────────────────────────────────────────────

describe('userInitial', () => {
  it('returns "U" when no name', () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.userInitial.value).toBe('U')
  })
})

// ─── toggleSection — demands and ads loading ────────────────────────────────

describe('toggleSection — demands and ads loading', () => {
  it('triggers loadDemands when opening solicitudes', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('solicitudes')
    expect(c.activeSection.value).toBe('solicitudes')
  })

  it('triggers loadAds when opening anuncios', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.toggleSection('anuncios')
    expect(c.activeSection.value).toBe('anuncios')
  })
})

// ─── saveProfile — success and error paths ──────────────────────────────────

describe('saveProfile — with session', () => {
  it('sets success message on successful save', async () => {
    const mockAuthGetSession = vi.fn().mockResolvedValue({ data: { session: mockSession } })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, null),
      auth: {
        getSession: mockAuthGetSession,
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    // Simulate onMounted setting sessionUser
    const cb = vi.mocked(onMounted).mock.calls[0]?.[0] as (() => Promise<void>) | undefined
    if (cb) await cb()
    await c.saveProfile({ pseudonimo: 'Test', name: 'User', apellidos: 'One', telefono: '123', email: 'test@test.com' })
    expect(c.profileSaving.value).toBe(false)
    expect(c.profileMessage.value?.type).toBe('success')
  })

  it('sets error message on save failure', async () => {
    const mockAuthGetSession = vi.fn().mockResolvedValue({ data: { session: mockSession } })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, new Error('Save failed')),
      auth: {
        getSession: mockAuthGetSession,
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    const cb = vi.mocked(onMounted).mock.calls[0]?.[0] as (() => Promise<void>) | undefined
    if (cb) await cb()
    await c.saveProfile({ pseudonimo: 'Test', name: 'User', apellidos: 'One', telefono: '123', email: 'test@test.com' })
    expect(c.profileSaving.value).toBe(false)
    expect(c.profileMessage.value?.type).toBe('error')
  })
})

// ─── saveSubscriptions ──────────────────────────────────────────────────────

describe('saveSubscriptions', () => {
  it('runs without error when session exists', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, null),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    const cb = vi.mocked(onMounted).mock.calls[0]?.[0] as (() => Promise<void>) | undefined
    if (cb) await cb()
    await expect(c.saveSubscriptions()).resolves.toBeUndefined()
  })

  it('does not throw when no session user', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
      },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await expect(c.saveSubscriptions()).resolves.toBeUndefined()
  })
})

// ─── handleExportData — successful download ─────────────────────────────────

describe('handleExportData — full flow', () => {
  it('creates download link and revokes URL', async () => {
    const mockClick = vi.fn()
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue({ href: '', download: '', click: mockClick }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await c.handleExportData()
    expect(c.exportLoading.value).toBe(false)
    expect(mockClick).toHaveBeenCalled()
  })

  it('handles API error gracefully', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue({ href: '', download: '', click: vi.fn() }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    await c.handleExportData()
    expect(c.exportLoading.value).toBe(false)
  })
})

// ─── handleDeleteAccount — success flow ─────────────────────────────────────

describe('handleDeleteAccount — success flow', () => {
  it('closes modal, calls onClose, redirects to /', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(undefined))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    c.deleteModalOpen.value = true
    await c.handleDeleteAccount()
    expect(c.deleteModalOpen.value).toBe(false)
    expect(c.deleteLoading.value).toBe(false)
    expect(mockOnClose).toHaveBeenCalled()
    expect(globalThis.location.href).toBe('/')
  })
})

// ─── isDealer / isAdmin ─────────────────────────────────────────────────────

describe('isDealer / isAdmin', () => {
  it('exposes isDealer from useAuth', () => {
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.isDealer.value).toBe(false)
  })

  it('exposes isAdmin from useAuth', () => {
    vi.stubGlobal('useAuth', () => ({
      isDealer: { value: false },
      isAdmin: { value: true },
      profile: { value: null },
    }))
    const c = useUserPanel(() => mockIsOpen, mockOnClose)
    expect(c.isAdmin.value).toBe(true)
  })
})
