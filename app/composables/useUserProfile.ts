/**
 * Composable for buyer profile management.
 * Provides CRUD operations, account deletion, and GDPR data export.
 */

interface ProfileFields {
  name?: string
  phone?: string
  lang?: string
  preferred_country?: string | null
  preferred_location_level?: string | null
  avatar_url?: string
}

interface ExportedData {
  profile: Record<string, unknown> | null
  favorites: Record<string, unknown>[]
  leads: Record<string, unknown>[]
  views: Record<string, unknown>[]
}

export function useUserProfile() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch the current user's profile row from the `users` table.
   */
  async function loadProfile() {
    if (!user.value?.id) return null

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (err) throw err
      return data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading profile'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update the current user's profile fields.
   */
  async function updateProfile(fields: ProfileFields): Promise<boolean> {
    if (!user.value?.id) return false

    loading.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('users').update(fields).eq('id', user.value.id)

      if (err) throw err
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating profile'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete the current user's account via Supabase RPC.
   * Falls back to signing out if RPC is not available.
   */
  async function deleteAccount(): Promise<boolean> {
    if (!user.value?.id) return false

    loading.value = true
    error.value = null

    try {
      // Attempt RPC-based account deletion (server-side function)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcErr } = await (supabase.rpc as any)('delete_own_account')

      if (rpcErr) throw rpcErr

      // Sign out after deletion
      await supabase.auth.signOut()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting account'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Export all user data as JSON (GDPR compliance).
   * Includes profile, favorites, leads, and vehicle views.
   */
  async function exportData(): Promise<ExportedData | null> {
    if (!user.value?.id) return null

    loading.value = true
    error.value = null

    try {
      const userId = user.value.id

      const [profileRes, favoritesRes, leadsRes, viewsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('favorites').select('*').eq('user_id', userId),
        supabase.from('leads').select('*').eq('buyer_user_id', userId),
        supabase.from('user_vehicle_views').select('*').eq('user_id', userId),
      ])

      return {
        profile: (profileRes.data as Record<string, unknown> | null) ?? null,
        favorites: (favoritesRes.data as Record<string, unknown>[]) ?? [],
        leads: (leadsRes.data as Record<string, unknown>[]) ?? [],
        views: (viewsRes.data as Record<string, unknown>[]) ?? [],
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error exporting data'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error,
    loadProfile,
    updateProfile,
    deleteAccount,
    exportData,
  }
}
