import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminUsuariosPage,
  getRoleConfig,
  formatDate,
  getDisplayName,
  getInitials,
  getProviderLabel,
} from '../../app/composables/admin/useAdminUsuariosPage'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  mockFetchUsers,
  mockUpdateRole,
  mockDeleteUser,
  mockExportCSV,
  usersRef,
} = vi.hoisted(() => ({
  mockFetchUsers: vi.fn().mockResolvedValue(undefined),
  mockUpdateRole: vi.fn().mockResolvedValue(true),
  mockDeleteUser: vi.fn().mockResolvedValue(true),
  mockExportCSV: vi.fn(),
  usersRef: { value: [] as unknown[] },
}))

// ─── Mock useAdminUsers ───────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminUsers', () => ({
  USER_ROLES: [
    { value: 'visitor', label: 'Visitante', color: '#9ca3af' },
    { value: 'user', label: 'Usuario', color: '#3b82f6' },
    { value: 'admin', label: 'Admin', color: '#8b5cf6' },
  ],
  useAdminUsers: () => ({
    users: usersRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    total: { value: 0 },
    stats: { value: null },
    fetchUsers: mockFetchUsers,
    updateRole: mockUpdateRole,
    deleteUser: mockDeleteUser,
    exportCSV: mockExportCSV,
  }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u-1',
    email: 'test@example.com',
    pseudonimo: null,
    name: null,
    apellidos: null,
    avatar_url: null,
    provider: 'email',
    role: 'user' as const,
    phone: null,
    lang: 'es',
    created_at: '2026-01-01T10:00:00Z',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  usersRef.value = []
})

// ─── Pure exported helpers ────────────────────────────────────────────────

describe('getRoleConfig', () => {
  it('returns config for "visitor"', () => {
    const cfg = getRoleConfig('visitor')
    expect(cfg.label).toBe('Visitante')
    expect(cfg.color).toBe('#9ca3af')
  })

  it('returns config for "admin"', () => {
    const cfg = getRoleConfig('admin')
    expect(cfg.label).toBe('Admin')
  })

  it('falls back to first role for unknown', () => {
    const cfg = getRoleConfig('unknown' as never)
    expect(cfg).toBeDefined()
  })
})

describe('formatDate', () => {
  it('returns formatted date string in dd/mm/yyyy', () => {
    const result = formatDate('2026-06-15T00:00:00Z')
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(result).toContain('2026')
  })
})

describe('getDisplayName', () => {
  it('returns "name apellidos" when both present', () => {
    const user = makeUser({ name: 'Juan', apellidos: 'García' })
    expect(getDisplayName(user as never)).toBe('Juan García')
  })

  it('returns name only when apellidos is null', () => {
    const user = makeUser({ name: 'Juan', apellidos: null })
    expect(getDisplayName(user as never)).toBe('Juan')
  })

  it('returns apellidos only when name is null', () => {
    const user = makeUser({ name: null, apellidos: 'García' })
    expect(getDisplayName(user as never)).toBe('García')
  })

  it('returns "-" when both name and apellidos are null', () => {
    const user = makeUser({ name: null, apellidos: null })
    expect(getDisplayName(user as never)).toBe('-')
  })
})

describe('getInitials', () => {
  it('returns first letter of name (uppercase)', () => {
    const user = makeUser({ name: 'juan' })
    expect(getInitials(user as never)).toBe('J')
  })

  it('falls back to pseudonimo when name is null', () => {
    const user = makeUser({ name: null, pseudonimo: 'trucker99' })
    expect(getInitials(user as never)).toBe('T')
  })

  it('falls back to email when name and pseudonimo are null', () => {
    const user = makeUser({ name: null, pseudonimo: null, email: 'admin@test.com' })
    expect(getInitials(user as never)).toBe('A')
  })
})

describe('getProviderLabel', () => {
  it('returns "Email" for "email"', () => {
    expect(getProviderLabel('email')).toBe('Email')
  })

  it('returns "Google" for "google"', () => {
    expect(getProviderLabel('google')).toBe('Google')
  })

  it('returns the raw value for unknown provider', () => {
    expect(getProviderLabel('github')).toBe('github')
  })
})

// ─── Initial composable state ─────────────────────────────────────────────

describe('initial state', () => {
  it('filters.role starts as null', () => {
    const c = useAdminUsuariosPage()
    expect(c.filters.value.role).toBeNull()
  })

  it('filters.search starts as empty string', () => {
    const c = useAdminUsuariosPage()
    expect(c.filters.value.search).toBe('')
  })

  it('deleteModal.show starts as false', () => {
    const c = useAdminUsuariosPage()
    expect(c.deleteModal.value.show).toBe(false)
  })

  it('detailModal.show starts as false', () => {
    const c = useAdminUsuariosPage()
    expect(c.detailModal.value.show).toBe(false)
  })
})

// ─── Filter actions ───────────────────────────────────────────────────────

describe('setFilterRole', () => {
  it('updates filters.role', () => {
    const c = useAdminUsuariosPage()
    c.setFilterRole('admin')
    expect(c.filters.value.role).toBe('admin')
  })

  it('can set to null', () => {
    const c = useAdminUsuariosPage()
    c.setFilterRole('admin')
    c.setFilterRole(null)
    expect(c.filters.value.role).toBeNull()
  })
})

describe('setFilterSearch', () => {
  it('updates filters.search', () => {
    const c = useAdminUsuariosPage()
    c.setFilterSearch('juan')
    expect(c.filters.value.search).toBe('juan')
  })
})

// ─── Detail modal ─────────────────────────────────────────────────────────

describe('openDetail', () => {
  it('sets detailModal.show to true', () => {
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser({ role: 'user' }) as never)
    expect(c.detailModal.value.show).toBe(true)
  })

  it('sets detailModal.user to the given user', () => {
    const c = useAdminUsuariosPage()
    const user = makeUser({ id: 'u-99' })
    c.openDetail(user as never)
    expect(c.detailModal.value.user?.id).toBe('u-99')
  })

  it('sets selectedRole to user.role', () => {
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser({ role: 'admin' }) as never)
    expect(c.detailModal.value.selectedRole).toBe('admin')
  })
})

describe('closeDetail', () => {
  it('resets detailModal to closed state', () => {
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser() as never)
    c.closeDetail()
    expect(c.detailModal.value.show).toBe(false)
    expect(c.detailModal.value.user).toBeNull()
    expect(c.detailModal.value.selectedRole).toBe('')
  })
})

describe('setDetailSelectedRole', () => {
  it('updates selectedRole in detailModal', () => {
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser() as never)
    c.setDetailSelectedRole('admin')
    expect(c.detailModal.value.selectedRole).toBe('admin')
  })
})

describe('saveRole', () => {
  it('does nothing when user is null', async () => {
    const c = useAdminUsuariosPage()
    await c.saveRole()
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('does nothing when selectedRole is empty', async () => {
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser() as never)
    c.setDetailSelectedRole('')
    await c.saveRole()
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('calls updateRole with user id and new role', async () => {
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser({ id: 'u-5' }) as never)
    c.setDetailSelectedRole('admin')
    await c.saveRole()
    expect(mockUpdateRole).toHaveBeenCalledWith('u-5', 'admin')
  })

  it('closes detail modal on success', async () => {
    mockUpdateRole.mockResolvedValueOnce(true)
    const c = useAdminUsuariosPage()
    c.openDetail(makeUser() as never)
    c.setDetailSelectedRole('admin')
    await c.saveRole()
    expect(c.detailModal.value.show).toBe(false)
  })
})

// ─── Delete modal ─────────────────────────────────────────────────────────

describe('confirmDelete', () => {
  it('opens deleteModal with the user', () => {
    const c = useAdminUsuariosPage()
    c.confirmDelete(makeUser({ id: 'u-7' }) as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.user?.id).toBe('u-7')
  })
})

describe('closeDeleteModal', () => {
  it('resets deleteModal', () => {
    const c = useAdminUsuariosPage()
    c.confirmDelete(makeUser() as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.user).toBeNull()
  })
})

describe('executeDelete', () => {
  it('does nothing when user is null', async () => {
    const c = useAdminUsuariosPage()
    await c.executeDelete()
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('calls deleteUser with user id', async () => {
    const c = useAdminUsuariosPage()
    c.confirmDelete(makeUser({ id: 'u-8' }) as never)
    await c.executeDelete()
    expect(mockDeleteUser).toHaveBeenCalledWith('u-8')
  })

  it('closes deleteModal on success', async () => {
    mockDeleteUser.mockResolvedValueOnce(true)
    const c = useAdminUsuariosPage()
    c.confirmDelete(makeUser() as never)
    await c.executeDelete()
    expect(c.deleteModal.value.show).toBe(false)
  })
})

// ─── handleRoleChange ─────────────────────────────────────────────────────

describe('handleRoleChange', () => {
  it('calls updateRole with user id and new role', async () => {
    const c = useAdminUsuariosPage()
    await c.handleRoleChange(makeUser({ id: 'u-3' }) as never, 'visitor')
    expect(mockUpdateRole).toHaveBeenCalledWith('u-3', 'visitor')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchUsers', async () => {
    const c = useAdminUsuariosPage()
    await c.init()
    expect(mockFetchUsers).toHaveBeenCalled()
  })
})
