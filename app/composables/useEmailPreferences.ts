/**
 * Composable for managing user email notification preferences.
 * Fetches, checks, toggles, and bulk-updates rows in the email_preferences table.
 * Defaults to enabled (true) when no row exists for a given email type.
 */

import type { Database } from '~~/types/supabase'

interface EmailPreferenceRow {
  id: string
  user_id: string
  email_type: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export type DigestFrequency = 'daily' | 'weekly' | 'never'
export const DIGEST_FREQUENCY_OPTIONS: DigestFrequency[] = ['daily', 'weekly', 'never']

/** Email types that cannot be disabled by the user */
const ALWAYS_ON_TYPES: ReadonlySet<string> = new Set(['confirm_email', 'suspicious_activity'])

function isAlwaysOn(emailType: string): boolean {
  return ALWAYS_ON_TYPES.has(emailType)
}

/** Composable for email preferences. */
export function useEmailPreferences() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const preferences = ref<Map<string, boolean>>(new Map())
  const digestFrequency = ref<DigestFrequency>('weekly')
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
      // Schema pending: email_preferences.created_at, users.digest_frequency
      const sb = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
      const [prefsRes, userRes] = await Promise.all([
        sb
          .from('email_preferences')
          .select('id, user_id, email_type, enabled, created_at, updated_at')
          .eq('user_id', user.value.id),
        sb.from('users').select('digest_frequency').eq('id', user.value.id).single(),
      ])

      if (prefsRes.error) throw prefsRes.error

      const map = new Map<string, boolean>()
      for (const row of (prefsRes.data || []) as EmailPreferenceRow[]) {
        map.set(row.email_type, row.enabled)
      }
      preferences.value = map

      const freq = (userRes.data as { digest_frequency?: string } | null)?.digest_frequency
      if (freq === 'daily' || freq === 'weekly' || freq === 'never') {
        digestFrequency.value = freq
      }
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
    return stored ?? true
  }

  /**
   * Check if a given email type is always on (cannot be disabled).
   */
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

  /**
   * Update the user's digest frequency preference.
   * Optimistically updates the local reactive value.
   */
  async function setDigestFrequency(freq: DigestFrequency): Promise<boolean> {
    if (!user.value) return false

    const previous = digestFrequency.value
    digestFrequency.value = freq

    saving.value = true
    error.value = null

    try {
      // Schema pending: users.digest_frequency
      const { error: updateErr } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('users')
        .update({ digest_frequency: freq, updated_at: new Date().toISOString() })
        .eq('id', user.value.id)

      if (updateErr) throw updateErr

      return true
    } catch (err: unknown) {
      digestFrequency.value = previous
      error.value = err instanceof Error ? err.message : 'Error updating digest frequency'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    /** Reactive map of email_type -> enabled */
    preferences: readonly(preferences),
    /** Current digest frequency (daily/weekly/never) */
    digestFrequency: readonly(digestFrequency),
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
    /** Set digest frequency (daily/weekly/never) */
    setDigestFrequency,
  }
}
