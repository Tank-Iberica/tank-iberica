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
  messages: Record<string, unknown>[]
  search_alerts: Record<string, unknown>[]
  reservations: Record<string, unknown>[]
  transactions: Record<string, unknown>[]
  email_preferences: Record<string, unknown>[]
}

/** Composable for user profile. */
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
        .select(
          'id, email, name, phone, avatar_url, role, dealer_id, locale, created_at, subscription_tier, trust_score, company_name',
        )
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
   * NOTE: Explicit columns listed per GDPR data minimization. Review when adding new PII columns.
   */
  async function exportData(): Promise<ExportedData | null> {
    if (!user.value?.id) return null

    loading.value = true
    error.value = null

    try {
      const userId = user.value.id

      const [
        profileRes,
        favoritesRes,
        leadsRes,
        viewsRes,
        messagesRes,
        alertsRes,
        reservationsRes,
        transactionsRes,
        emailPrefsRes,
      ] = await Promise.all([
        supabase
          .from('users')
          .select(
            'id, email, pseudonimo, name, apellidos, avatar_url, provider, role, phone, lang, created_at',
          )
          .eq('id', userId)
          .single(),
        supabase
          .from('favorites')
          .select('id, user_id, vehicle_id, created_at')
          .eq('user_id', userId),
        supabase
          .from('leads')
          .select('id, email, quarter, locale, created_at')
          .eq('buyer_user_id', userId),
        supabase
          .from('user_vehicle_views')
          .select('user_id, vehicle_id, viewed_at, view_count')
          .eq('user_id', userId),
        supabase
          .from('messages' as never)
          .select('id, user_id, content, direction, is_read, created_at')
          .eq('sender_id', userId),
        supabase
          .from('search_alerts' as never)
          .select('id, user_id, vertical, filters, frequency, active, last_sent_at, created_at')
          .eq('user_id', userId),
        supabase
          .from('reservations' as never)
          .select(
            'id, vehicle_id, buyer_id, seller_id, deposit_cents, status, expires_at, created_at',
          )
          .eq('buyer_id', userId),
        supabase
          .from('transactions' as never)
          .select('id, user_id, type, credits, balance_after, reference, description, created_at')
          .eq('user_id', userId),
        supabase
          .from('email_preferences' as never)
          .select('id, user_id, email_type, enabled, updated_at')
          .eq('user_id', userId),
      ])

      return {
        profile: (profileRes.data as Record<string, unknown> | null) ?? null,
        favorites: (favoritesRes.data as Record<string, unknown>[]) ?? [],
        leads: (leadsRes.data ?? []) as unknown as Record<string, unknown>[],
        views: (viewsRes.data as Record<string, unknown>[]) ?? [],
        messages: (messagesRes.data as Record<string, unknown>[]) ?? [],
        search_alerts: (alertsRes.data as Record<string, unknown>[]) ?? [],
        reservations: (reservationsRes.data as Record<string, unknown>[]) ?? [],
        transactions: (transactionsRes.data as Record<string, unknown>[]) ?? [],
        email_preferences: (emailPrefsRes.data as Record<string, unknown>[]) ?? [],
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
