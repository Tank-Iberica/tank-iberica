/**
 * Composable for managing user email notification preferences.
 * Fetches, checks, toggles, and bulk-updates rows in the email_preferences table.
 * Defaults to enabled (true) when no row exists for a given email type.
 */

interface EmailPreferenceRow {
  id: string
  user_id: string
  email_type: string
  enabled: boolean
  created_at: string
  updated_at: string
}

/** Email types that cannot be disabled by the user */
const ALWAYS_ON_TYPES: ReadonlySet<string> = new Set(['confirm_email', 'suspicious_activity'])

export function useEmailPreferences() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  const preferences = ref<Map<string, boolean>>(new Map())
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all email_preferences rows for the current user.
   * Populates the reactive `preferences` map.
   */
  async function loadPreferences(): Promise<void> {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchErr } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.value.id)

      if (fetchErr) throw fetchErr

      const map = new Map<string, boolean>()
      for (const row of (data || []) as EmailPreferenceRow[]) {
        map.set(row.email_type, row.enabled)
      }
      preferences.value = map
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading preferences'
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a specific email type is enabled.
   * Always-on types return true regardless of stored value.
   * Types without a stored row default to true (opt-out model).
   */
  function isEnabled(emailType: string): boolean {
    if (ALWAYS_ON_TYPES.has(emailType)) return true

    const stored = preferences.value.get(emailType)
    // Default to true if no row exists (opt-out model)
    return stored === undefined ? true : stored
  }

  /**
   * Check if a given email type is always on (cannot be disabled).
   */
  function isAlwaysOn(emailType: string): boolean {
    return ALWAYS_ON_TYPES.has(emailType)
  }

  /**
   * Upsert a single email_preferences row.
   * Updates the local reactive map optimistically.
   */
  async function togglePreference(emailType: string, enabled: boolean): Promise<boolean> {
    if (!user.value) return false
    if (ALWAYS_ON_TYPES.has(emailType)) return false

    // Optimistic update
    const previous = preferences.value.get(emailType)
    preferences.value = new Map(preferences.value).set(emailType, enabled)

    saving.value = true
    error.value = null

    try {
      const { error: upsertErr } = await supabase.from('email_preferences').upsert(
        {
          user_id: user.value.id,
          email_type: emailType,
          enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,email_type' },
      )

      if (upsertErr) throw upsertErr

      return true
    } catch (err: unknown) {
      // Rollback optimistic update
      const rollbackMap = new Map(preferences.value)
      if (previous === undefined) {
        rollbackMap.delete(emailType)
      } else {
        rollbackMap.set(emailType, previous)
      }
      preferences.value = rollbackMap

      error.value = err instanceof Error ? err.message : 'Error updating preference'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Update multiple preferences at once.
   * Skips always-on types silently.
   */
  async function bulkUpdate(prefs: Record<string, boolean>): Promise<boolean> {
    if (!user.value) return false

    const rows = Object.entries(prefs)
      .filter(([emailType]) => !ALWAYS_ON_TYPES.has(emailType))
      .map(([emailType, enabled]) => ({
        user_id: user.value!.id,
        email_type: emailType,
        enabled,
        updated_at: new Date().toISOString(),
      }))

    if (rows.length === 0) return true

    // Optimistic update
    const previousMap = new Map(preferences.value)
    const updatedMap = new Map(preferences.value)
    for (const row of rows) {
      updatedMap.set(row.email_type, row.enabled)
    }
    preferences.value = updatedMap

    saving.value = true
    error.value = null

    try {
      const { error: upsertErr } = await supabase
        .from('email_preferences')
        .upsert(rows, { onConflict: 'user_id,email_type' })

      if (upsertErr) throw upsertErr

      return true
    } catch (err: unknown) {
      // Rollback
      preferences.value = previousMap
      error.value = err instanceof Error ? err.message : 'Error updating preferences'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    /** Reactive map of email_type -> enabled */
    preferences: readonly(preferences),
    /** Whether preferences are being loaded */
    loading: readonly(loading),
    /** Whether a save/toggle operation is in progress */
    saving: readonly(saving),
    /** Last error message, or null */
    error: readonly(error),
    /** Fetch all preferences from Supabase */
    loadPreferences,
    /** Check if a specific email type is enabled */
    isEnabled,
    /** Check if an email type is always on */
    isAlwaysOn,
    /** Toggle a single preference */
    togglePreference,
    /** Bulk update multiple preferences */
    bulkUpdate,
  }
}
