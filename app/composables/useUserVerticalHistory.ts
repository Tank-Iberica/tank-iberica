/**
 * Composable for cross-vertical buyer tracking (#46).
 *
 * Queries analytics_events to determine which verticals a user
 * has interacted with, enabling cross-vertical insights.
 */

export interface VerticalActivity {
  vertical: string
  event_count: number
  first_seen: string
  last_seen: string
}

export interface UserVerticalHistory {
  verticals: VerticalActivity[]
  isMultiVertical: boolean
  primaryVertical: string | null
  totalEvents: number
}

export function useUserVerticalHistory() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const history = ref<UserVerticalHistory | null>(null)

  /**
   * Fetch vertical activity for the current user from analytics_events.
   * Groups events by vertical and returns activity summary.
   */
  async function fetchHistory(): Promise<UserVerticalHistory | null> {
    if (!user.value?.id) return null

    loading.value = true
    error.value = null

    try {
      // Query analytics_events grouped by vertical for this user
      // Using RPC or raw query isn't possible from client — use multiple queries per vertical
      // Instead, fetch events with vertical info and aggregate client-side
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('analytics_events')
        .select('vertical, created_at')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: true })

      if (err) throw err

      if (!data || (data as unknown[]).length === 0) {
        const emptyResult: UserVerticalHistory = {
          verticals: [],
          isMultiVertical: false,
          primaryVertical: null,
          totalEvents: 0,
        }
        history.value = emptyResult
        return emptyResult
      }

      // Aggregate by vertical
      const verticalMap = new Map<string, { count: number; first: string; last: string }>()

      for (const event of data as Array<Record<string, unknown>>) {
        const v = event.vertical as string
        const ts = event.created_at as string
        const existing = verticalMap.get(v)

        if (existing) {
          existing.count++
          if (ts < existing.first) existing.first = ts
          if (ts > existing.last) existing.last = ts
        } else {
          verticalMap.set(v, { count: 1, first: ts, last: ts })
        }
      }

      const verticals: VerticalActivity[] = []
      let maxCount = 0
      let primaryVertical: string | null = null

      for (const [vertical, stats] of verticalMap) {
        verticals.push({
          vertical,
          event_count: stats.count,
          first_seen: stats.first,
          last_seen: stats.last,
        })

        if (stats.count > maxCount) {
          maxCount = stats.count
          primaryVertical = vertical
        }
      }

      // Sort by event_count descending
      verticals.sort((a, b) => b.event_count - a.event_count)

      const result: UserVerticalHistory = {
        verticals,
        isMultiVertical: verticals.length > 1,
        primaryVertical,
        totalEvents: data.length,
      }

      history.value = result
      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching vertical history'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a user has activity in a specific vertical.
   */
  function hasVerticalActivity(vertical: string): boolean {
    if (!history.value) return false
    return history.value.verticals.some((v) => v.vertical === vertical)
  }

  /**
   * Get leads with their source vertical for cross-vertical analysis.
   */
  async function fetchLeadsWithVertical(): Promise<Array<{
    id: string
    source_vertical: string | null
    created_at: string
  }> | null> {
    if (!user.value?.id) return null

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('leads')
        .select('id, source_vertical, created_at')
        .eq('buyer_user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (err) throw err
      return (data ?? []) as unknown as Array<{
        id: string
        source_vertical: string | null
        created_at: string
      }>
    } catch {
      return null
    }
  }

  return {
    loading: readonly(loading),
    error,
    history: readonly(history),
    fetchHistory,
    hasVerticalActivity,
    fetchLeadsWithVertical,
  }
}
