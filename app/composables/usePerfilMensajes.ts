// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

/** Interface for the MessagesList component's exposed methods */
export interface MessagesListExposed {
  scrollToBottom: () => void
}

// ---------------------------------------------------------------------------
// Standalone formatting helpers (importable by subcomponents)
// ---------------------------------------------------------------------------

type TFunction = (key: string) => string

export function formatTimestamp(dateStr: string, t: TFunction): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return t('messages.yesterday')
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function usePerfilMensajes() {
  const { t } = useI18n()
  const user = useSupabaseUser()
  const { getImageUrl } = useImageUrl()

  const {
    conversations,
    activeConversation,
    messages,
    loading,
    sending,
    unreadCount,
    isDataShared,
    hasAcceptedShare,
    sellerAvgResponseMinutes,
    fetchConversations,
    openConversation,
    sendMessage,
    acceptDataShare,
    closeConversation,
    maskContactData,
  } = useConversation()

  // --------------- Local state ---------------

  const messageInput = ref('')
  const mobileShowConversation = ref(false)
  const messagesListRef = ref<MessagesListExposed | null>(null)

  // --------------- Computed ---------------

  const sortedConversations = computed(() => {
    return [...conversations.value].sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
    )
  })

  const currentUserId = computed(() => user.value?.id ?? '')

  const otherPartyName = computed<string>(() => {
    if (!activeConversation.value) return ''
    return activeConversation.value.other_party_name || t('messages.unknownUser')
  })

  const conversationStatusLabel = computed<string>(() => {
    if (!activeConversation.value) return ''
    const status = activeConversation.value.status
    if (status === 'data_shared') return t('messages.statusDataShared')
    if (status === 'closed') return t('messages.statusClosed')
    if (status === 'reported') return t('messages.statusReported')
    return t('messages.statusActive')
  })

  const conversationStatusClass = computed<string>(() => {
    if (!activeConversation.value) return ''
    const status = activeConversation.value.status
    if (status === 'data_shared') return 'conv-status--shared'
    if (status === 'closed') return 'conv-status--closed'
    if (status === 'reported') return 'conv-status--reported'
    return 'conv-status--active'
  })

  const isConversationClosed = computed<boolean>(() => {
    if (!activeConversation.value) return true
    return (
      activeConversation.value.status === 'closed' || activeConversation.value.status === 'reported'
    )
  })

  const isBuyer = computed<boolean>(() => {
    if (!activeConversation.value || !user.value) return false
    return activeConversation.value.buyer_id === user.value.id
  })

  // --------------- Helpers ---------------

  function getLastMessagePreview(_conv: { id: string }): string {
    // We don't have per-conversation last message stored in list,
    // so just show timestamp-based preview
    return t('messages.tapToOpen')
  }

  function isOwnMessage(senderId: string): boolean {
    return senderId === currentUserId.value
  }

  function getDisplayContent(content: string, isSystem: boolean): string {
    if (isSystem) {
      if (content === 'both_parties_shared_data') {
        return t('messages.systemDataShared')
      }
      return content
    }

    if (!activeConversation.value) return content
    return maskContactData(content, isDataShared.value)
  }

  // --------------- Actions ---------------

  async function handleSelectConversation(convId: string): Promise<void> {
    await openConversation(convId)
    mobileShowConversation.value = true
    await nextTick()
    scrollToBottom()
  }

  function handleBackToList(): void {
    mobileShowConversation.value = false
  }

  async function handleSendMessage(): Promise<void> {
    if (!activeConversation.value || !messageInput.value.trim()) return

    const content = messageInput.value.trim()
    messageInput.value = ''

    await sendMessage(activeConversation.value.id, content)
    await nextTick()
    scrollToBottom()
  }

  async function handleAcceptDataShare(): Promise<void> {
    if (!activeConversation.value) return
    await acceptDataShare(activeConversation.value.id)
  }

  async function handleCloseConversation(): Promise<void> {
    if (!activeConversation.value) return
    await closeConversation(activeConversation.value.id)
    mobileShowConversation.value = false
  }

  function scrollToBottom(): void {
    messagesListRef.value?.scrollToBottom()
  }

  // --------------- Watch for new messages ---------------

  watch(
    () => messages.value.length,
    () => {
      nextTick(() => scrollToBottom())
    },
  )

  // --------------- Init (called from onMounted in page) ---------------

  async function init(): Promise<void> {
    await fetchConversations()
  }

  return {
    // State
    messageInput,
    mobileShowConversation,
    messagesListRef,

    // From useConversation
    conversations,
    activeConversation,
    messages,
    loading,
    sending,
    unreadCount,
    isDataShared,
    hasAcceptedShare,
    sellerAvgResponseMinutes,

    // Computed
    sortedConversations,
    currentUserId,
    otherPartyName,
    conversationStatusLabel,
    conversationStatusClass,
    isConversationClosed,
    isBuyer,

    // Helpers
    getLastMessagePreview,
    getImageUrl,
    isOwnMessage,
    getDisplayContent,
    maskContactData,

    // Actions
    handleSelectConversation,
    handleBackToList,
    handleSendMessage,
    handleAcceptDataShare,
    handleCloseConversation,

    // Lifecycle
    init,
  }
}
