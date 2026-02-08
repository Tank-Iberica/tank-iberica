/**
 * Admin Chat Composable
 * Manage chat conversations with users
 * Supports Supabase Realtime for live updates
 */

import type { RealtimeChannel } from '@supabase/supabase-js'

export type MessageDirection = 'user_to_admin' | 'admin_to_user'

export interface ChatMessage {
  id: string
  user_id: string
  content: string
  direction: MessageDirection
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface ChatUser {
  id: string
  email: string
  name: string | null
  apellidos: string | null
  avatar_url: string | null
}

export interface Conversation {
  user: ChatUser
  lastMessage: ChatMessage | null
  unreadCount: number
  messages: ChatMessage[]
}

// DB row types for explicit casting (until types are generated)
interface ChatMessageRow {
  id: string
  user_id: string
  content: string
  direction: MessageDirection
  is_read: boolean
  created_at: string
  updated_at: string
  users?: ChatUser
}

export function useAdminChat() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()

  // State
  const conversations = ref<Map<string, Conversation>>(new Map())
  const activeUserId = ref<string | null>(null)
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)

  // Realtime channel
  let realtimeChannel: RealtimeChannel | null = null

  /**
   * Fetch all conversations (grouped by user)
   */
  async function fetchConversations() {
    loading.value = true
    error.value = null

    try {
      // Fetch all messages with user info
      const { data: messages, error: msgErr } = await supabase
        .from('chat_messages')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name,
            apellidos,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })

      if (msgErr) throw msgErr

      // Group messages by user
      const convMap = new Map<string, Conversation>()
      const rows = (messages || []) as ChatMessageRow[]

      for (const msg of rows) {
        const user = msg.users
        if (!user) continue

        const userId = user.id

        if (!convMap.has(userId)) {
          convMap.set(userId, {
            user,
            lastMessage: null,
            unreadCount: 0,
            messages: [],
          })
        }

        const conv = convMap.get(userId)!
        const message: ChatMessage = {
          id: msg.id,
          user_id: msg.user_id,
          content: msg.content,
          direction: msg.direction,
          is_read: msg.is_read,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
        }

        conv.messages.push(message)
        conv.lastMessage = message

        // Count unread messages from user
        if (msg.direction === 'user_to_admin' && !msg.is_read) {
          conv.unreadCount++
        }
      }

      conversations.value = convMap
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching conversations'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get conversation list sorted by last message date
   */
  const conversationList = computed(() => {
    const list = Array.from(conversations.value.values())
    return list.sort((a, b) => {
      const aDate = a.lastMessage?.created_at || ''
      const bDate = b.lastMessage?.created_at || ''
      return bDate.localeCompare(aDate)
    })
  })

  /**
   * Get active conversation
   */
  const activeConversation = computed(() => {
    if (!activeUserId.value) return null
    return conversations.value.get(activeUserId.value) || null
  })

  /**
   * Total unread count across all conversations
   */
  const totalUnreadCount = computed(() => {
    let count = 0
    for (const conv of conversations.value.values()) {
      count += conv.unreadCount
    }
    return count
  })

  /**
   * Set active conversation
   */
  function setActiveConversation(userId: string | null) {
    activeUserId.value = userId
    if (userId) {
      markConversationAsRead(userId)
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async function markConversationAsRead(userId: string) {
    const conv = conversations.value.get(userId)
    if (!conv || conv.unreadCount === 0) return

    try {
      const { error: updateErr } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('direction', 'user_to_admin')
        .eq('is_read', false)

      if (updateErr) throw updateErr

      // Update local state
      conv.unreadCount = 0
      for (const msg of conv.messages) {
        if (msg.direction === 'user_to_admin') {
          msg.is_read = true
        }
      }
    }
    catch (err: unknown) {
      console.error('Error marking messages as read:', err)
    }
  }

  /**
   * Send a message to a user
   */
  async function sendMessage(userId: string, content: string): Promise<boolean> {
    if (!content.trim()) return false

    sending.value = true
    error.value = null

    try {
      const { data, error: insertErr } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          content: content.trim(),
          direction: 'admin_to_user',
          is_read: false,
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // Add to local state
      const conv = conversations.value.get(userId)
      const row = data as ChatMessageRow | null
      if (conv && row) {
        const newMessage: ChatMessage = {
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          direction: row.direction,
          is_read: row.is_read,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
        conv.messages.push(newMessage)
        conv.lastMessage = newMessage
      }

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error sending message'
      return false
    }
    finally {
      sending.value = false
    }
  }

  /**
   * Subscribe to realtime updates
   */
  function subscribeToRealtime() {
    if (realtimeChannel) return

    realtimeChannel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage

          // Fetch user info if this is a new conversation
          let conv = conversations.value.get(newMessage.user_id)

          if (!conv) {
            // Fetch user info
            const { data: userData } = await supabase
              .from('users')
              .select('id, email, name, apellidos, avatar_url')
              .eq('id', newMessage.user_id)
              .single()

            if (userData) {
              conv = {
                user: userData as ChatUser,
                lastMessage: null,
                unreadCount: 0,
                messages: [],
              }
              conversations.value.set(newMessage.user_id, conv)
            }
          }

          if (conv) {
            conv.messages.push(newMessage)
            conv.lastMessage = newMessage

            // Increment unread if from user and not currently active
            if (
              newMessage.direction === 'user_to_admin'
              && activeUserId.value !== newMessage.user_id
            ) {
              conv.unreadCount++
            }
            else if (
              newMessage.direction === 'user_to_admin'
              && activeUserId.value === newMessage.user_id
            ) {
              // Auto-mark as read if viewing this conversation
              markConversationAsRead(newMessage.user_id)
            }
          }
        },
      )
      .subscribe()
  }

  /**
   * Unsubscribe from realtime updates
   */
  function unsubscribeFromRealtime() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  /**
   * Search conversations by user name or email
   */
  function searchConversations(query: string) {
    if (!query.trim()) return conversationList.value

    const q = query.toLowerCase()
    return conversationList.value.filter((conv) => {
      const fullName = `${conv.user.name || ''} ${conv.user.apellidos || ''}`.toLowerCase()
      const email = conv.user.email.toLowerCase()
      return fullName.includes(q) || email.includes(q)
    })
  }

  /**
   * Format message time
   */
  function formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
    else if (diffDays === 1) {
      return 'Ayer'
    }
    else if (diffDays < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' })
    }
    else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    }
  }

  /**
   * Format full date for message tooltip
   */
  function formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Get user display name
   */
  function getUserDisplayName(user: ChatUser): string {
    if (user.name || user.apellidos) {
      return `${user.name || ''} ${user.apellidos || ''}`.trim()
    }
    return user.email?.split('@')[0] || 'Usuario'
  }

  /**
   * Get user initials for avatar
   */
  function getUserInitials(user: ChatUser): string {
    if (user.name) {
      const first = user.name.charAt(0).toUpperCase()
      const last = user.apellidos ? user.apellidos.charAt(0).toUpperCase() : ''
      return first + last
    }
    return user.email.charAt(0).toUpperCase()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeFromRealtime()
  })

  return {
    // State
    conversations: readonly(conversations),
    activeUserId: readonly(activeUserId),
    loading: readonly(loading),
    sending: readonly(sending),
    error: readonly(error),

    // Computed
    conversationList,
    activeConversation,
    totalUnreadCount,

    // Actions
    fetchConversations,
    setActiveConversation,
    markConversationAsRead,
    sendMessage,
    searchConversations,
    subscribeToRealtime,
    unsubscribeFromRealtime,

    // Helpers
    formatMessageTime,
    formatFullDate,
    getUserDisplayName,
    getUserInitials,
  }
}
