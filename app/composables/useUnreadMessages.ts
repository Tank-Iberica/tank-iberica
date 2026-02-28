/**
 * Global unread message count for the current user.
 * Shared singleton — all components read the same count.
 */
import type { RealtimeChannel } from '@supabase/supabase-js'

// Module-level state (shared across all uses of this composable)
const unreadCount = ref(0)
let channel: RealtimeChannel | null = null
let initialized = false

export function useUnreadMessages() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  async function refresh(): Promise<void> {
    if (!user.value) {
      unreadCount.value = 0
      return
    }

    const userId = user.value.id

    // Step 1: get all conversation IDs the user participates in
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .neq('status', 'closed')

    const convIds = (convs ?? []).map((c: { id: string }) => c.id)
    if (convIds.length === 0) {
      unreadCount.value = 0
      return
    }

    // Step 2: count unread messages sent by the other party
    const { count } = await supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', userId)

    unreadCount.value = count ?? 0
  }

  function subscribe(): void {
    if (!user.value || initialized) return
    initialized = true

    channel = supabase
      .channel('global-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_messages',
        },
        () => {
          refresh()
        },
      )
      .subscribe()
  }

  function unsubscribe(): void {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
      initialized = false
    }
  }

  // Auto-refresh when user logs in/out
  watch(
    () => user.value?.id,
    (id) => {
      if (id) {
        refresh()
        subscribe()
      } else {
        unreadCount.value = 0
        unsubscribe()
      }
    },
    { immediate: true },
  )

  return {
    unreadCount: readonly(unreadCount),
    refresh,
  }
}
