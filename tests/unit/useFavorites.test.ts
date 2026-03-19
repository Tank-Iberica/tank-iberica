import { describe, it, expect, vi, beforeEach } from 'vitest'

// useFavorites has module-level singletons (favoriteIds, favoritesOnly, loaded, synced).
// `loaded` is a plain `let` var not exposed in the return value.
// We use vi.resetModules() per test so each test gets a fresh module with `loaded = false`.

// ─── localStorage stub ────────────────────────────────────────────────────────

const localStorageStore = new Map<string, string>()

const localStorageMock = {
  getItem: (key: string) => localStorageStore.get(key) ?? null,
  setItem: (key: string, val: string) => localStorageStore.set(key, val),
  removeItem: (key: string) => localStorageStore.delete(key),
  clear: () => localStorageStore.clear(),
}

// ─── Supabase + user stubs ────────────────────────────────────────────────────

function setupGlobals({
  userId = null as string | null,
  supabaseRows = [] as { vehicle_id: string }[],
  supabaseError = null as unknown,
} = {}) {
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('import', { meta: { client: true, server: false } })
  vi.stubGlobal('useSupabaseUser', () => ({
    value: userId ? { id: userId } : null,
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve(
            supabaseError
              ? { data: null, error: supabaseError }
              : { data: supabaseRows, error: null },
          ),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }))
}

// ─── Fresh-module helper ──────────────────────────────────────────────────────

async function getFavorites(opts: Parameters<typeof setupGlobals>[0] = {}) {
  setupGlobals(opts)
  const mod = await import('../../app/composables/useFavorites')
  return mod.useFavorites()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  localStorageStore.clear()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('count returns 0 when no favorites', async () => {
    const c = await getFavorites()
    expect(c.count()).toBe(0)
  })

  it('favoritesOnly starts as false', async () => {
    const c = await getFavorites()
    expect(c.favoritesOnly.value).toBe(false)
  })

  it('isFavorite returns false for any vehicle when empty', async () => {
    const c = await getFavorites()
    expect(c.isFavorite('vehicle-1')).toBe(false)
  })
})

// ─── loadFromStorage ──────────────────────────────────────────────────────────
// Note: import.meta.client is undefined in the Vitest environment (no Nuxt Vite
// plugin), so localStorage read/write paths are skipped. These tests verify the
// guard logic without relying on actual localStorage I/O.

describe('loadFromStorage (import.meta.client guard)', () => {
  it('starts with empty set (no localStorage loaded in test env)', async () => {
    const c = await getFavorites()
    expect(c.count()).toBe(0)
  })

  it('does not throw when localStorage has corrupt data', async () => {
    // Even if localStorage had data, the guard prevents access in test env.
    // This test verifies the composable always initializes without errors.
    localStorageStore.set('userFavorites', 'not-json{{{')
    const c = await getFavorites()
    expect(c.count()).toBe(0)
  })

  it('loads favorites from localStorage when data exists', async () => {
    localStorageStore.set('userFavorites', JSON.stringify(['a', 'b']))
    const c = await getFavorites()
    // import.meta.client → (true) via vitest transform, so localStorage is read
    expect(c.count()).toBe(2)
  })
})

// ─── toggle ───────────────────────────────────────────────────────────────────

describe('toggle', () => {
  it('adds a vehicle to favorites', async () => {
    const c = await getFavorites()
    c.toggle('vehicle-1')
    expect(c.isFavorite('vehicle-1')).toBe(true)
  })

  it('removes a vehicle that is already favorited', async () => {
    const c = await getFavorites()
    c.toggle('vehicle-1')
    c.toggle('vehicle-1')
    expect(c.isFavorite('vehicle-1')).toBe(false)
  })

  it('count increases when adding a vehicle', async () => {
    const c = await getFavorites()
    c.toggle('vehicle-1')
    expect(c.count()).toBe(1)
  })

  it('count decreases when removing a vehicle', async () => {
    const c = await getFavorites()
    c.toggle('vehicle-1')
    c.toggle('vehicle-2')
    c.toggle('vehicle-1')
    expect(c.count()).toBe(1)
  })

  it('in-memory set contains toggled vehicle even though localStorage is skipped', async () => {
    const c = await getFavorites()
    c.toggle('vehicle-1')
    // favoriteIds Set is updated in-memory regardless of localStorage guard
    expect(c.isFavorite('vehicle-1')).toBe(true)
  })

  it('in-memory set removes vehicle on second toggle', async () => {
    const c = await getFavorites()
    c.toggle('vehicle-1')
    c.toggle('vehicle-2')
    c.toggle('vehicle-1')
    // vehicle-1 removed, vehicle-2 stays
    expect(c.isFavorite('vehicle-1')).toBe(false)
    expect(c.isFavorite('vehicle-2')).toBe(true)
  })

  it('two composable instances share the same favoriteIds', async () => {
    setupGlobals()
    const mod = await import('../../app/composables/useFavorites')
    const c1 = mod.useFavorites()
    c1.toggle('shared-vehicle')
    const c2 = mod.useFavorites()
    expect(c2.isFavorite('shared-vehicle')).toBe(true)
  })

  it('does NOT call Supabase when no user is logged in', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: mockInsert,
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const mod = await import('../../app/composables/useFavorites')
    const c = mod.useFavorites()
    c.toggle('vehicle-1')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('calls Supabase insert when adding a vehicle and user is logged in', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: mockInsert,
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const mod = await import('../../app/composables/useFavorites')
    const c = mod.useFavorites()
    c.toggle('vehicle-1')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('calls Supabase delete when removing a vehicle and user is logged in', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    })
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        delete: mockDelete,
      }),
    }))
    const mod = await import('../../app/composables/useFavorites')
    const c = mod.useFavorites()
    // Add first, then remove
    c.toggle('vehicle-1')
    c.toggle('vehicle-1')
    expect(mockDelete).toHaveBeenCalled()
  })
})

// ─── isFavorite ───────────────────────────────────────────────────────────────

describe('isFavorite', () => {
  it('returns false for an unknown vehicle', async () => {
    const c = await getFavorites()
    expect(c.isFavorite('unknown')).toBe(false)
  })

  it('returns true after toggle-add', async () => {
    const c = await getFavorites()
    c.toggle('v1')
    expect(c.isFavorite('v1')).toBe(true)
  })

  it('returns false after double-toggle (add then remove)', async () => {
    const c = await getFavorites()
    c.toggle('v1')
    c.toggle('v1')
    expect(c.isFavorite('v1')).toBe(false)
  })

  it('returns true for a vehicle added via toggle', async () => {
    const c = await getFavorites()
    c.toggle('toggled-vehicle')
    expect(c.isFavorite('toggled-vehicle')).toBe(true)
  })
})

// ─── toggleFilter ─────────────────────────────────────────────────────────────

describe('toggleFilter', () => {
  it('sets favoritesOnly to true when it was false', async () => {
    const c = await getFavorites()
    c.toggleFilter()
    expect(c.favoritesOnly.value).toBe(true)
  })

  it('sets favoritesOnly back to false when it was true', async () => {
    const c = await getFavorites()
    c.toggleFilter()
    c.toggleFilter()
    expect(c.favoritesOnly.value).toBe(false)
  })

  it('shared state — toggleFilter visible across composable instances', async () => {
    setupGlobals()
    const mod = await import('../../app/composables/useFavorites')
    const c1 = mod.useFavorites()
    c1.toggleFilter()
    const c2 = mod.useFavorites()
    expect(c2.favoritesOnly.value).toBe(true)
  })
})

// ─── count ────────────────────────────────────────────────────────────────────

describe('count', () => {
  it('returns 0 initially', async () => {
    const c = await getFavorites()
    expect(c.count()).toBe(0)
  })

  it('returns correct count after multiple toggles', async () => {
    const c = await getFavorites()
    c.toggle('v1')
    c.toggle('v2')
    c.toggle('v3')
    expect(c.count()).toBe(3)
  })

  it('reflects removal correctly', async () => {
    const c = await getFavorites()
    c.toggle('v1')
    c.toggle('v2')
    c.toggle('v1')
    expect(c.count()).toBe(1)
  })

  it('returns correct count after toggling multiple vehicles', async () => {
    const c = await getFavorites()
    c.toggle('a')
    c.toggle('b')
    c.toggle('c')
    expect(c.count()).toBe(3)
  })
})

// ─── syncWithSupabase ─────────────────────────────────────────────────────────

describe('syncWithSupabase', () => {
  it('does not sync when user is not logged in', async () => {
    const c = await getFavorites({ userId: null })
    await new Promise((r) => setTimeout(r, 0))
    expect(c.count()).toBe(0)
  })

  it('merges Supabase favorites into local set', async () => {
    const c = await getFavorites({
      userId: 'user-1',
      supabaseRows: [{ vehicle_id: 'supabase-v1' }, { vehicle_id: 'supabase-v2' }],
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(c.isFavorite('supabase-v1')).toBe(true)
    expect(c.isFavorite('supabase-v2')).toBe(true)
  })

  it('keeps manually-added favorites after merge with Supabase', async () => {
    // Since localStorage is not readable in test env (import.meta.client guard),
    // we simulate a "local-only" favorite by calling toggle() before sync completes.
    setupGlobals({
      userId: 'user-1',
      supabaseRows: [{ vehicle_id: 'supabase-v1' }],
    })
    const mod = await import('../../app/composables/useFavorites')
    const c = mod.useFavorites()
    // toggle adds to in-memory set synchronously
    c.toggle('local-v1')
    // Let syncWithSupabase resolve — merged = union(supabase + in-memory)
    await new Promise((r) => setTimeout(r, 0))
    expect(c.isFavorite('local-v1')).toBe(true)
    expect(c.isFavorite('supabase-v1')).toBe(true)
  })

  it('handles Supabase error silently (localStorage fallback)', async () => {
    const c = await getFavorites({
      userId: 'user-1',
      supabaseError: { message: 'DB error' },
    })
    await new Promise((r) => setTimeout(r, 0))
    // Should not throw; count stays at 0
    expect(c.count()).toBe(0)
  })

  it('reverts optimistic add when Supabase insert fails', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const mod = await import('../../app/composables/useFavorites')
    const c = mod.useFavorites()
    c.toggle('vehicle-revert')
    // Immediately after toggle, it's added optimistically
    expect(c.isFavorite('vehicle-revert')).toBe(true)
    // Wait for Supabase promise to resolve and trigger revert
    await new Promise((r) => setTimeout(r, 10))
    expect(c.isFavorite('vehicle-revert')).toBe(false)
  })

  it('reverts optimistic remove when Supabase delete fails', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: null, error: { message: 'Delete failed' } }),
          }),
        }),
      }),
    }))
    const mod = await import('../../app/composables/useFavorites')
    const c = mod.useFavorites()
    // First toggle: add (insert succeeds)
    c.toggle('vehicle-x')
    await new Promise((r) => setTimeout(r, 10))
    expect(c.isFavorite('vehicle-x')).toBe(true)
    // Second toggle: remove (delete fails → should revert to added)
    c.toggle('vehicle-x')
    expect(c.isFavorite('vehicle-x')).toBe(false) // optimistic
    await new Promise((r) => setTimeout(r, 10))
    expect(c.isFavorite('vehicle-x')).toBe(true) // reverted
  })

  it('does not sync a second time once synced', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: mockEq }),
        insert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const mod = await import('../../app/composables/useFavorites')
    // First useFavorites call — triggers sync
    const c1 = mod.useFavorites()
    await new Promise((r) => setTimeout(r, 0))
    // Second useFavorites call — sync already done
    mod.useFavorites()
    await new Promise((r) => setTimeout(r, 0))
    // eq (the Supabase query) should have been called only once
    expect(mockEq).toHaveBeenCalledTimes(1)
  })
})
