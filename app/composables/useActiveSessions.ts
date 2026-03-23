/**
 * Composable for active sessions/devices management (F41).
 *
 * Uses the user_fingerprints table to show devices that have
 * accessed the account. Provides listing and removal.
 */

export interface DeviceSession {
  id: string
  fp_hash: string
  ua_hint: string | null
  ip_hint: string | null
  first_seen: string
  last_seen: string
  request_count: number
  device_label: string
  is_current: boolean
}

/**
 * Parse a User-Agent hint to a human-readable device label.
 */
export function parseDeviceLabel(uaHint: string | null): string {
  if (!uaHint) return 'Unknown device'

  const ua = uaHint.toLowerCase()

  // Mobile detection
  if (ua.includes('iphone')) return 'iPhone'
  if (ua.includes('ipad')) return 'iPad'
  if (ua.includes('android') && ua.includes('mobile')) return 'Android Phone'
  if (ua.includes('android')) return 'Android Tablet'

  // Browser detection for desktop
  if (ua.includes('edg/') || ua.includes('edge/')) return 'Microsoft Edge'
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Google Chrome'
  if (ua.includes('firefox/')) return 'Mozilla Firefox'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'

  // OS fallback
  if (ua.includes('windows')) return 'Windows PC'
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac'
  if (ua.includes('linux')) return 'Linux PC'

  return 'Unknown device'
}

export function useActiveSessions() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const sessions = ref<DeviceSession[]>([])

  /**
   * Fetch all device fingerprints for the current user.
   */
  async function fetchSessions(): Promise<DeviceSession[]> {
    if (!user.value?.id) return []

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('user_fingerprints')
        .select('id, fp_hash, ua_hint, ip_hint, first_seen, last_seen, request_count')
        .eq('user_id', user.value.id)
        .order('last_seen', { ascending: false })

      if (err) throw err

      const result: DeviceSession[] = ((data ?? []) as Record<string, unknown>[]).map((fp) => ({
        id: fp.id as string,
        fp_hash: fp.fp_hash as string,
        ua_hint: (fp.ua_hint as string | null) ?? null,
        ip_hint: (fp.ip_hint as string | null) ?? null,
        first_seen: fp.first_seen as string,
        last_seen: fp.last_seen as string,
        request_count: (fp.request_count as number) ?? 0,
        device_label: parseDeviceLabel(fp.ua_hint as string | null),
        is_current: false, // Will be set by caller if possible
      }))

      sessions.value = result
      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading sessions'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove a device fingerprint record.
   * This cleans tracking data; the actual session token
   * remains valid until logoutAll is called.
   */
  async function removeSession(sessionId: string): Promise<boolean> {
    if (!user.value?.id) return false

    try {
      const { error: err } = await supabase
        .from('user_fingerprints')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.value.id)

      if (err) throw err

      // Remove from local list
      sessions.value = sessions.value.filter((s) => s.id !== sessionId)
      return true
    } catch {
      return false
    }
  }

  return {
    loading: readonly(loading),
    error,
    sessions: readonly(sessions),
    fetchSessions,
    removeSession,
  }
}
