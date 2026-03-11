import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminSidebar } from '../../app/composables/admin/useAdminSidebar'

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useRoute', () => ({ params: {}, query: {}, path: '/admin/productos' }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        is: () => ({ in: () => Promise.resolve({ count: 0 }) }),
        eq: () => ({ in: () => Promise.resolve({ count: 0 }) }),
        in: () => Promise.resolve({ count: 0 }),
      }),
    }),
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('showDropdown starts as false', () => {
    const c = useAdminSidebar()
    expect(c.showDropdown.value).toBe(false)
  })

  it('openGroups.catalog starts as true', () => {
    const c = useAdminSidebar()
    expect(c.openGroups.value.catalog).toBe(true)
  })

  it('openGroups.config starts as false', () => {
    const c = useAdminSidebar()
    expect(c.openGroups.value.config).toBe(false)
  })

  it('openGroups.finance starts as false', () => {
    const c = useAdminSidebar()
    expect(c.openGroups.value.finance).toBe(false)
  })

  it('popover.show starts as false', () => {
    const c = useAdminSidebar()
    expect(c.popover.value.show).toBe(false)
  })

  it('infraAlertCount starts as 0', () => {
    const c = useAdminSidebar()
    expect(c.infraAlertCount.value).toBe(0)
  })
})

// ─── toggleDropdown ───────────────────────────────────────────────────────

describe('toggleDropdown', () => {
  it('sets showDropdown to true on first call', () => {
    const c = useAdminSidebar()
    c.toggleDropdown()
    expect(c.showDropdown.value).toBe(true)
  })

  it('toggles back to false on second call', () => {
    const c = useAdminSidebar()
    c.toggleDropdown()
    c.toggleDropdown()
    expect(c.showDropdown.value).toBe(false)
  })
})

// ─── toggleGroup ──────────────────────────────────────────────────────────

describe('toggleGroup', () => {
  it('opens a closed group', () => {
    const c = useAdminSidebar()
    c.toggleGroup('config')
    expect(c.openGroups.value.config).toBe(true)
  })

  it('closes an open group', () => {
    const c = useAdminSidebar()
    c.toggleGroup('catalog') // starts true
    expect(c.openGroups.value.catalog).toBe(false)
  })

  it('does not affect other groups', () => {
    const c = useAdminSidebar()
    c.toggleGroup('config')
    expect(c.openGroups.value.finance).toBe(false)
  })
})

// ─── isActive ─────────────────────────────────────────────────────────────

describe('isActive', () => {
  it('returns true when route.path starts with path (non-exact)', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/productos/123', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActive('/admin/productos')).toBe(true)
  })

  it('returns false when route.path does not start with path (non-exact)', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/balance', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActive('/admin/productos')).toBe(false)
  })

  it('returns true when exact match', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/productos', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActive('/admin/productos', true)).toBe(true)
  })

  it('returns false for non-exact match when exact=true', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/productos/123', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActive('/admin/productos', true)).toBe(false)
  })
})

// ─── isActiveGroup ────────────────────────────────────────────────────────

describe('isActiveGroup', () => {
  it('returns true when route.path starts with a catalog path', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/anunciantes', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActiveGroup('catalog')).toBe(true)
  })

  it('returns false when route.path is not in group', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/balance', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActiveGroup('catalog')).toBe(false)
  })

  it('returns true for finance group when on /admin/balance', () => {
    vi.stubGlobal('useRoute', () => ({ path: '/admin/balance', params: {}, query: {} }))
    const c = useAdminSidebar()
    expect(c.isActiveGroup('finance')).toBe(true)
  })

  it('returns false for unknown group', () => {
    const c = useAdminSidebar()
    expect(c.isActiveGroup('nonexistent')).toBe(false)
  })
})

// ─── configItems / financeItems (static arrays) ───────────────────────────

describe('configItems', () => {
  it('has 10 entries', () => {
    const c = useAdminSidebar()
    expect(c.configItems).toHaveLength(10)
  })

  it('contains Identidad entry', () => {
    const c = useAdminSidebar()
    expect(c.configItems.some((i) => i.label === 'Identidad')).toBe(true)
  })
})

describe('financeItems', () => {
  it('has 4 entries', () => {
    const c = useAdminSidebar()
    expect(c.financeItems).toHaveLength(4)
  })
})

// ─── closePopover ─────────────────────────────────────────────────────────

describe('closePopover', () => {
  it('sets popover.show to false', () => {
    const c = useAdminSidebar()
    c.popover.value.show = true
    c.closePopover()
    expect(c.popover.value.show).toBe(false)
  })
})

// ─── openPopover ──────────────────────────────────────────────────────────

describe('openPopover', () => {
  it('sets popover.show to true for known group', () => {
    const c = useAdminSidebar()
    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent
    c.openPopover('config', mockEvent)
    expect(c.popover.value.show).toBe(true)
  })

  it('sets popover title for config group', () => {
    const c = useAdminSidebar()
    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent
    c.openPopover('config', mockEvent)
    expect(c.popover.value.title).toBe('admin.sidebar.config')
  })

  it('does nothing for unknown group', () => {
    const c = useAdminSidebar()
    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent
    c.openPopover('unknown', mockEvent)
    expect(c.popover.value.show).toBe(false)
  })
})
