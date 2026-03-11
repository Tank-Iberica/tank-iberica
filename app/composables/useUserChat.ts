/**
 * User Chat Composable
 * Chat functionality for authenticated users (public side)
 * Messages go to admin via chat_messages table
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '~~/types/supabase'

export type MessageDirection = 'user_to_admin' | 'admin_to_user'

export interface ChatMessage {
  id: string
  user_id: string
  content: string
  direction: MessageDirection
  is_read: boolean
  created_at: string
}

export function useUserChat() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { t, locale } = useI18n()

  const localeMap: Record<string, string> = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', pt: 'pt-PT', de: 'de-DE' }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const intlLocale = localeMap[locale.value] ?? 'es-ES'

    if (diffDays === 0) {
      return date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return t('messages.yesterday')
    } else if (diffDays < 7) {
      return date.toLocaleDateString(intlLocale, { weekday: 'short' })
    } else {
      return date.toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit' })
    }
  }

  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)
  const unreadCount = ref(0)

  let realtimeChannel: RealtimeChannel | null = null

  /**
   * Fetch user's chat messages
   */
  async function fetchMessages() {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchErr } = await supabase
        .from('chat_messages')
        .select('id, user_id, content, direction, is_read, created_at')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: true })

      if (fetchErr) throw fetchErr

      messages.value = (data || []) as ChatMessage[]

      // Count unread messages from admin
      unreadCount.value = messages.value.filter(
        (m) => m.direction === 'admin_to_user' && !m.is_read,
      ).length
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading messages'
    } finally {
      loading.value = false
    }
  }

  /**
   * Send a message to admin
   */
  async function sendMessage(content: string): Promise<boolean> {
    if (!user.value || !content.trim()) return false

    sending.value = true
    error.value = null

    try {
      const { data, error: insertErr } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.value.id,
          content: content.trim(),
          direction: 'user_to_admin',
          is_read: false,
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      if (data) {
        messages.value.push(data as ChatMessage)
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error sending message'
      return false
    } finally {
      sending.value = false
    }
  }

  /**
   * Mark admin messages as read
   */
  async function markAsRead() {
    if (!user.value || unreadCount.value === 0) return

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', user.value.id)
        .eq('direction', 'admin_to_user')
        .eq('is_read', false)

      // Update local state
      for (const msg of messages.value) {
        if (msg.direction === 'admin_to_user') {
          msg.is_read = true
        }
      }
      unreadCount.value = 0
    } catch {
      // Silently handle — non-critical operation
    }
  }

  /**
   * Subscribe to realtime updates
   */
  function subscribeToRealtime() {
    if (!user.value || realtimeChannel) return

    const userId = user.value.id

    realtimeChannel = supabase
      .channel(`user_chat_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage

          // Avoid duplicates
          if (!messages.value.some((m) => m.id === newMessage.id)) {
            messages.value.push(newMessage)

            if (newMessage.direction === 'admin_to_user' && !newMessage.is_read) {
              unreadCount.value++
            }
          }
        },
      )
      .subscribe()
  }

  /**
   * Unsubscribe from realtime
   */
  function unsubscribeFromRealtime() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  /**
   * Format message time
   */
  // Cleanup
  onUnmounted(() => {
    unsubscribeFromRealtime()
  })

  return {
    messages: readonly(messages),
    loading: readonly(loading),
    sending: readonly(sending),
    error: readonly(error),
    unreadCount: readonly(unreadCount),
    fetchMessages,
    sendMessage,
    markAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    formatTime,
  }
}
