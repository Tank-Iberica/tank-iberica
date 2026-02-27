/**
 * Page-level composable for admin/chats.vue
 * Wraps useAdminChat and adds UI state + handlers
 */

import {
  useAdminChat,
  type ChatMessage,
  type ChatUser,
  type Conversation,
} from '~/composables/admin/useAdminChat'

export type { ChatMessage, ChatUser, Conversation }

export interface MessageDateGroup {
  date: string
  messages: ChatMessage[]
}

export function useAdminChats() {
  const {
    loading,
    sending,
    error,
    activeConversation,
    activeUserId,
    totalUnreadCount,
    fetchConversations,
    setActiveConversation,
    sendMessage,
    searchConversations,
    subscribeToRealtime,
    formatMessageTime,
    formatFullDate,
    getUserDisplayName,
    getUserInitials,
  } = useAdminChat()

  // Local page state
  const searchQuery = ref('')
  const messageInput = ref('')
  const messagesContainer = ref<HTMLElement | null>(null)
  const showConversationList = ref(true)

  // Filtered conversations
  const filteredConversations = computed(() => {
    return searchConversations(searchQuery.value)
  })

  // Scroll to bottom of messages
  function scrollToBottom() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

  // Watch for new messages to auto-scroll
  watch(
    () => activeConversation.value?.messages.length,
    () => {
      nextTick(() => {
        scrollToBottom()
      })
    },
  )

  // Initialize: fetch data + subscribe to realtime
  async function init() {
    await fetchConversations()
    subscribeToRealtime()
  }

  // Handle send message
  async function handleSendMessage() {
    if (!activeUserId.value || !messageInput.value.trim()) return

    const success = await sendMessage(activeUserId.value, messageInput.value)
    if (success) {
      messageInput.value = ''
      nextTick(() => scrollToBottom())
    }
  }

  // Handle conversation select
  function selectConversation(userId: string) {
    setActiveConversation(userId)
    showConversationList.value = false
    nextTick(() => scrollToBottom())
  }

  // Go back to list (mobile)
  function goBackToList() {
    setActiveConversation(null)
    showConversationList.value = true
  }

  // Handle enter key in message input
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Group messages by date for display
  function groupMessagesByDate(messages: ChatMessage[]): MessageDateGroup[] {
    const groups: MessageDateGroup[] = []
    let currentDate = ''

    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [] })
      }

      const lastGroup = groups[groups.length - 1]
      if (lastGroup) {
        lastGroup.messages.push(msg)
      }
    }

    return groups
  }

  return {
    // State from useAdminChat
    loading,
    sending,
    error,
    activeConversation,
    activeUserId,
    totalUnreadCount,

    // Local page state
    searchQuery,
    messageInput,
    messagesContainer,
    showConversationList,

    // Computed
    filteredConversations,

    // Actions
    init,
    handleSendMessage,
    selectConversation,
    goBackToList,
    handleKeyDown,
    groupMessagesByDate,

    // Helpers (re-exported from useAdminChat)
    formatMessageTime,
    formatFullDate,
    getUserDisplayName,
    getUserInitials,
  }
}
