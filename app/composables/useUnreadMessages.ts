/**
 * Global unread message count for the current user.
 * Shared singleton — all components read the same count.
 * State is lazily initialized on first call to avoid import side effects.
 */
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '~~/types/supabase'

// Lazy-initialized module state (no side effects on import)
let _unreadCount: Ref<number> | null = null
let _channel: RealtimeChannel | null = null
let _initialized = false

function getUnreadCount(): Ref<number> {
  if (!_unreadCount) _unreadCount = ref(0)
  return _unreadCount
}

export function useUnreadMessages() {
  const unreadCount = getUnreadCount()
  const supabase = useSupabaseClient<Database>()
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
    if (!user.value || _initialized) return
    _initialized = true

    _channel = supabase
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
    if (_channel) {
      supabase.removeChannel(_channel)
      _channel = null
      _initialized = false
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
