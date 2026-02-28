/**
 * Page-level composable for admin/usuarios.vue
 * Orchestrates state, filters, modals, and helpers for the users management page.
 */
import {
  useAdminUsers,
  USER_ROLES,
  type AdminUser,
  type UserRole,
  type UserFilters,
} from '~/composables/admin/useAdminUsers'

// ── Re-export types needed by subcomponents ──────────────────────────
export type { AdminUser, UserRole, UserFilters }
export { USER_ROLES }

// ── Interfaces for modal state ───────────────────────────────────────
export interface DeleteModalState {
  show: boolean
  user: AdminUser | null
}

export interface DetailModalState {
  show: boolean
  user: AdminUser | null
  selectedRole: UserRole | ''
}

export interface UserStats {
  total: number
  visitors: number
  users: number
  admins: number
}

export interface RoleConfig {
  value: UserRole
  label: string
  color: string
}

// ── Pure helper functions (importable by subcomponents) ──────────────

export function getRoleConfig(role: UserRole): RoleConfig {
  return USER_ROLES.find((r) => r.value === role) || USER_ROLES[0]!
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getDisplayName(user: AdminUser): string {
  if (user.name || user.apellidos) {
    return [user.name, user.apellidos].filter(Boolean).join(' ')
  }
  return '-'
}

export function getInitials(user: AdminUser): string {
  if (user.name) return user.name.charAt(0).toUpperCase()
  if (user.pseudonimo) return user.pseudonimo.charAt(0).toUpperCase()
  return user.email.charAt(0).toUpperCase()
}

export function getProviderLabel(provider: string): string {
  const map: Record<string, string> = { email: 'Email', google: 'Google' }
  return map[provider] || provider
}

// ── Composable ───────────────────────────────────────────────────────

export function useAdminUsuariosPage() {
  const {
    users,
    loading,
    saving,
    error,
    total,
    stats,
    fetchUsers,
    updateRole,
    deleteUser,
    exportCSV,
  } = useAdminUsers()

  // ── Filters ──
  const filters = ref<UserFilters>({
    role: null,
    search: '',
  })

  // ── Delete modal state ──
  const deleteModal = ref<DeleteModalState>({
    show: false,
    user: null,
  })

  // ── Detail modal state ──
  const detailModal = ref<DetailModalState>({
    show: false,
    user: null,
    selectedRole: '',
  })

  // ── Watchers ──
  watch(
    filters,
    () => {
      fetchUsers(filters.value)
    },
    { deep: true },
  )

  // ── Filter actions ──
  function setFilterRole(role: UserRole | null) {
    filters.value.role = role
  }

  function setFilterSearch(search: string) {
    filters.value.search = search
  }

  // ── Detail modal actions ──
  function openDetail(user: AdminUser) {
    detailModal.value = {
      show: true,
      user,
      selectedRole: user.role,
    }
  }

  function closeDetail() {
    detailModal.value = { show: false, user: null, selectedRole: '' }
  }

  function setDetailSelectedRole(role: UserRole | '') {
    detailModal.value.selectedRole = role
  }

  async function saveRole() {
    if (!detailModal.value.user || !detailModal.value.selectedRole) return
    const success = await updateRole(
      detailModal.value.user.id,
      detailModal.value.selectedRole as UserRole,
    )
    if (success) {
      closeDetail()
      await fetchUsers(filters.value)
    }
  }

  // ── Delete modal actions ──
  function confirmDelete(user: AdminUser) {
    deleteModal.value = { show: true, user }
  }

  function closeDeleteModal() {
    deleteModal.value = { show: false, user: null }
  }

  async function executeDelete() {
    if (!deleteModal.value.user) return
    const success = await deleteUser(deleteModal.value.user.id)
    if (success) {
      closeDeleteModal()
    }
  }

  // ── Quick role change (from table) ──
  async function handleRoleChange(user: AdminUser, newRole: UserRole) {
    await updateRole(user.id, newRole)
  }

  // ── Export ──
  function handleExport() {
    exportCSV([...users.value])
  }

  // ── Init (replaces onMounted) ──
  async function init() {
    await fetchUsers()
  }

  return {
    // State
    users,
    loading,
    saving,
    error,
    total,
    stats,
    filters: readonly(filters),

    // Delete modal
    deleteModal: readonly(deleteModal),

    // Detail modal
    detailModal: readonly(detailModal),

    // Filter actions
    setFilterRole,
    setFilterSearch,

    // Detail modal actions
    openDetail,
    closeDetail,
    setDetailSelectedRole,
    saveRole,

    // Delete modal actions
    confirmDelete,
    closeDeleteModal,
    executeDelete,

    // Table actions
    handleRoleChange,

    // Export
    handleExport,

    // Init
    init,
  }
}
