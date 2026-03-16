/**
 * usePresence — Supabase Realtime presence for "X users viewing" indicator.
 *
 * Backlog #297 — Presence system: show how many users are viewing a vehicle.
 *
 * Usage:
 *   const { viewerCount, join, leave } = usePresence('vehicle', vehicleId)
 *   onMounted(() => join())
 *   onBeforeUnmount(() => leave())
 */
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
  user_id: string
  joined_at: string
}

export function usePresence(entityType: string, entityId: string) {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const viewerCount = ref(0)
  let channel: RealtimeChannel | null = null

  function countPresences(state: Record<string, PresenceState[]>): number {
    const seen = new Set<string>()
    for (const presences of Object.values(state)) {
      for (const p of presences) {
        seen.add(p.user_id)
      }
    }
    return seen.size
  }

  async function join(): Promise<void> {
    if (channel) return

    const channelName = `presence:${entityType}:${entityId}`
    const userId = user.value?.id ?? `anon-${Math.random().toString(36).slice(2, 10)}`

    channel = supabase.channel(channelName)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel!.presenceState<PresenceState>()
        viewerCount.value = countPresences(state)
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel!.presenceState<PresenceState>()
        viewerCount.value = countPresences(state)
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel!.presenceState<PresenceState>()
        viewerCount.value = countPresences(state)
      })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel!.track({
          user_id: userId,
          joined_at: new Date().toISOString(),
        })
      }
    })
  }

  function leave(): void {
    if (channel) {
      void channel.untrack()
      void supabase.removeChannel(channel)
      channel = null
      viewerCount.value = 0
    }
  }

  return {
    viewerCount: readonly(viewerCount),
    join,
    leave,
  }
}
