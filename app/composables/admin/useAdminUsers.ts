/**
 * Admin Users Composable
 * Full CRUD operations for user management in admin panel
 */

export type UserRole = 'visitor' | 'user' | 'admin'

export interface AdminUser {
  id: string
  email: string
  pseudonimo: string | null
  name: string | null
  apellidos: string | null
  avatar_url: string | null
  provider: string
  role: UserRole
  phone: string | null
  lang: string
  created_at: string
}

export interface UserFilters {
  role?: UserRole | null
  search?: string
}

export const USER_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'visitor', label: 'Visitante', color: '#9ca3af' },
  { value: 'user', label: 'Usuario', color: '#3b82f6' },
  { value: 'admin', label: 'Admin', color: '#8b5cf6' },
]

const PAGE_SIZE = 100

export function useAdminUsers() {
  const supabase = useSupabaseClient()

  const users = ref<AdminUser[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // Stats
  const stats = computed(() => {
    const all = users.value
    return {
      total: total.value,
      visitors: all.filter((u) => u.role === 'visitor').length,
      users: all.filter((u) => u.role === 'user').length,
      admins: all.filter((u) => u.role === 'admin').length,
    }
  })

  /**
   * Fetch all users with filters
   */
  async function fetchUsers(filters: UserFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('users')
        .select(
          'id, email, pseudonimo, name, apellidos, avatar_url, provider, role, phone, lang, created_at',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })

      if (filters.role) {
        query = query.eq('role', filters.role)
      }

      if (filters.search) {
        query = query.or(
          `email.ilike.%${filters.search}%,pseudonimo.ilike.%${filters.search}%,name.ilike.%${filters.search}%,apellidos.ilike.%${filters.search}%`,
        )
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      users.value = (data as unknown as AdminUser[]) || []
      total.value = count || 0
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching users'
      users.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user role
   */
  async function updateRole(id: string, role: UserRole): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('users')
        .update({ role } as never)
        .eq('id', id)

      if (err) throw err

      // Update local list
      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index]!.role = role
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating role'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete user
   */
  async function deleteUser(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('users').delete().eq('id', id)

      if (err) throw err

      // Remove from local list
      users.value = users.value.filter((u) => u.id !== id)
      total.value--

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting user'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Export users as CSV download
   */
  function exportCSV(userList: AdminUser[]) {
    if (userList.length === 0) return

    const headers = [
      'Email',
      'Pseudónimo',
      'Nombre',
      'Apellidos',
      'Teléfono',
      'Proveedor',
      'Rol',
      'Idioma',
      'Fecha registro',
    ]
    const rows = userList.map((u) => [
      u.email,
      u.pseudonimo || '',
      u.name || '',
      u.apellidos || '',
      u.phone || '',
      u.provider,
      u.role,
      u.lang,
      new Date(u.created_at).toLocaleDateString('es-ES'),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    stats,
    fetchUsers,
    updateRole,
    deleteUser,
    exportCSV,
  }
}
