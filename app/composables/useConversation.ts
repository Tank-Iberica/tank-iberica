/**
 * Conversation Composable
 * Manages buyer-seller messaging with contact data masking.
 * Contact data (phone, email) is hidden until both parties accept sharing.
 */

import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Conversation {
  id: string
  vehicle_id: string
  buyer_id: string
  seller_id: string
  status: 'active' | 'data_shared' | 'closed' | 'reported'
  buyer_accepted_share: boolean
  seller_accepted_share: boolean
  last_message_at: string
  created_at: string
  vehicle_title?: string
  vehicle_image?: string
  other_party_name?: string
  last_message_preview?: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_system: boolean
  is_read: boolean
  created_at: string
}

export function useConversation() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  const conversations = ref<Conversation[]>([])
  const activeConversation = ref<Conversation | null>(null)
  const messages = ref<ConversationMessage[]>([])
  const loading = ref(false)
  const sending = ref(false)

  let realtimeChannel: RealtimeChannel | null = null

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const unreadCount = computed<number>(() => {
    if (!user.value) return 0
    const userId = user.value.id

    return messages.value.filter((m) => m.sender_id !== userId && !m.is_read).length
  })

  // ---------------------------------------------------------------------------
  // Data masking
  // ---------------------------------------------------------------------------

  /**
   * Masks phone numbers and email addresses when data sharing has not been accepted.
   */
  function maskContactData(text: string, isDataShared: boolean): string {
    if (isDataShared) return text
    return text
      .replace(/(\+?\d[\d\s\-().]{6,})/g, '[datos ocultos]')
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[datos ocultos]')
  }

  // ---------------------------------------------------------------------------
  // Fetch conversations
  // ---------------------------------------------------------------------------

  /**
   * Loads all conversations for the current user, enriched with vehicle and party info.
   */
  async function fetchConversations(): Promise<void> {
    if (!user.value) return

    loading.value = true

    try {
      const userId = user.value.id

      const { data, error: fetchErr } = await supabase
        .from('conversations')
        .select(
          `
          *,
          vehicles:vehicle_id ( title, images ),
          buyer:buyer_id ( name, apellidos, pseudonimo, company_name ),
          seller:seller_id ( name, apellidos, pseudonimo, company_name )
        `,
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (fetchErr) throw fetchErr

      interface UserRow {
        name: string | null
        apellidos: string | null
        pseudonimo: string | null
        company_name: string | null
      }

      interface ConversationRow {
        id: string
        vehicle_id: string
        buyer_id: string
        seller_id: string
        status: Conversation['status']
        buyer_accepted_share: boolean
        seller_accepted_share: boolean
        last_message_at: string
        created_at: string
        vehicles: { title: string; images: string[] } | null
        buyer: UserRow | null
        seller: UserRow | null
      }

      const mapped = ((data ?? []) as ConversationRow[]).map((row) => {
        const firstImage =
          row.vehicles?.images && row.vehicles.images.length > 0
            ? row.vehicles.images[0]
            : undefined

        const isBuyer = row.buyer_id === userId
        const otherParty = isBuyer ? row.seller : row.buyer
        const otherPartyName = resolveUserName(otherParty)

        return {
          id: row.id,
          vehicle_id: row.vehicle_id,
          buyer_id: row.buyer_id,
          seller_id: row.seller_id,
          status: row.status,
          buyer_accepted_share: row.buyer_accepted_share,
          seller_accepted_share: row.seller_accepted_share,
          last_message_at: row.last_message_at,
          created_at: row.created_at,
          vehicle_title: row.vehicles?.title,
          vehicle_image: firstImage,
          other_party_name: otherPartyName,
        } satisfies Conversation
      })

      // Fetch last message preview for each conversation
      if (mapped.length > 0) {
        const convIds = mapped.map((c) => c.id)
        const { data: lastMsgs } = await supabase
          .from('conversation_messages')
          .select('conversation_id, content, is_system')
          .in('conversation_id', convIds)
          .eq('is_system', false)
          .order('created_at', { ascending: false })

        const previewMap: Record<string, string> = {}
        if (lastMsgs) {
          for (const msg of lastMsgs as {
            conversation_id: string
            content: string
            is_system: boolean
          }[]) {
            if (!previewMap[msg.conversation_id]) {
              previewMap[msg.conversation_id] = msg.content.slice(0, 80)
            }
          }
        }
        conversations.value = mapped.map((c) => ({
          ...c,
          last_message_preview: previewMap[c.id],
        }))
      } else {
        conversations.value = mapped
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Resolves a display name from a user row.
   * Priority: pseudonimo > company_name > name + apellidos > first part of name
   */
  function resolveUserName(
    u: {
      name: string | null
      apellidos: string | null
      pseudonimo: string | null
      company_name: string | null
    } | null,
  ): string | undefined {
    if (!u) return undefined
    if (u.pseudonimo) return u.pseudonimo
    if (u.company_name) return u.company_name
    const parts = [u.name, u.apellidos].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : undefined
  }

  // ---------------------------------------------------------------------------
  // Open conversation (load messages)
  // ---------------------------------------------------------------------------

  async function openConversation(conversationId: string): Promise<void> {
    if (!user.value) return

    const conv = conversations.value.find((c) => c.id === conversationId)
    if (conv) activeConversation.value = conv

    loading.value = true
    try {
      const { data, error: fetchErr } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (fetchErr) throw fetchErr
      messages.value = (data ?? []) as ConversationMessage[]

      // Mark unread messages as read
      await markAsRead(conversationId)

      // Subscribe to realtime updates for this conversation
      subscribeToRealtime(conversationId)
    } finally {
      loading.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Start new conversation
  // ---------------------------------------------------------------------------

  async function startConversation(
    vehicleId: string,
    sellerId: string,
    firstMessage: string,
  ): Promise<string | null> {
    if (!user.value) return null

    const buyerId = user.value.id

    // Check if conversation already exists for this vehicle + buyer
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .neq('status', 'closed')
      .maybeSingle()

    if (existing) {
      await openConversation(existing.id)
      if (firstMessage.trim()) {
        await sendMessage(existing.id, firstMessage)
      }
      return existing.id
    }

    // Create new conversation
    const { data: conv, error: createErr } = await supabase
      .from('conversations')
      .insert({
        vehicle_id: vehicleId,
        buyer_id: buyerId,
        seller_id: sellerId,
      })
      .select('id')
      .single()

    if (createErr) throw createErr

    const conversationId = conv.id

    // Send first message
    if (firstMessage.trim()) {
      await sendMessage(conversationId, firstMessage)
    }

    // Refresh list and open
    await fetchConversations()
    await openConversation(conversationId)

    return conversationId
  }

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------

  async function sendMessage(conversationId: string, content: string): Promise<void> {
    if (!user.value || !content.trim()) return

    sending.value = true
    try {
      const { data: msg, error: sendErr } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.value.id,
          content: content.trim(),
        })
        .select('*')
        .single()

      if (sendErr) throw sendErr

      // Optimistic add (realtime will also deliver it, dedup by id)
      if (msg && !messages.value.some((m) => m.id === msg.id)) {
        messages.value.push(msg as ConversationMessage)
      }

      // Update last_message_at on conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)
    } finally {
      sending.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Mark as read
  // ---------------------------------------------------------------------------

  async function markAsRead(conversationId: string): Promise<void> {
    if (!user.value) return

    const userId = user.value.id

    await supabase
      .from('conversation_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false)

    // Update local state
    messages.value = messages.value.map((m) =>
      m.conversation_id === conversationId && m.sender_id !== userId ? { ...m, is_read: true } : m,
    )
  }

  // ---------------------------------------------------------------------------
  // Accept data sharing
  // ---------------------------------------------------------------------------

  async function acceptDataShare(conversationId: string): Promise<void> {
    if (!user.value) return

    const conv = conversations.value.find((c) => c.id === conversationId)
    if (!conv) return

    const isBuyer = conv.buyer_id === user.value.id
    const field = isBuyer ? 'buyer_accepted_share' : 'seller_accepted_share'

    const { error: updateErr } = await supabase
      .from('conversations')
      .update({ [field]: true })
      .eq('id', conversationId)

    if (updateErr) throw updateErr

    // Check if both parties accepted → update status
    const otherAccepted = isBuyer ? conv.seller_accepted_share : conv.buyer_accepted_share
    if (otherAccepted) {
      await supabase
        .from('conversations')
        .update({ status: 'data_shared' })
        .eq('id', conversationId)

      // Insert system message
      await supabase.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_id: user.value.id,
        content: 'both_parties_shared_data',
        is_system: true,
      })
    }

    // Refresh
    await fetchConversations()
    if (activeConversation.value?.id === conversationId) {
      activeConversation.value = conversations.value.find((c) => c.id === conversationId) ?? null
    }
  }

  // ---------------------------------------------------------------------------
  // Close conversation
  // ---------------------------------------------------------------------------

  async function closeConversation(conversationId: string): Promise<void> {
    if (!user.value) return

    await supabase.from('conversations').update({ status: 'closed' }).eq('id', conversationId)

    if (activeConversation.value?.id === conversationId) {
      unsubscribeRealtime()
      activeConversation.value = null
      messages.value = []
    }

    await fetchConversations()
  }

  // ---------------------------------------------------------------------------
  // Realtime subscription
  // ---------------------------------------------------------------------------

  function subscribeToRealtime(conversationId: string): void {
    unsubscribeRealtime()

    realtimeChannel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as ConversationMessage
          // Dedup: don't add if already present (optimistic insert)
          if (!messages.value.some((m) => m.id === newMsg.id)) {
            messages.value.push(newMsg)
          }
          // Auto-mark as read if we're viewing this conversation
          if (
            activeConversation.value?.id === conversationId &&
            newMsg.sender_id !== user.value?.id
          ) {
            markAsRead(conversationId)
          }
        },
      )
      .subscribe()
  }

  function unsubscribeRealtime(): void {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // ---------------------------------------------------------------------------
  // Computed helpers
  // ---------------------------------------------------------------------------

  const isDataShared = computed<boolean>(() => {
    if (!activeConversation.value) return false
    return activeConversation.value.status === 'data_shared'
  })

  const hasAcceptedShare = computed<boolean>(() => {
    if (!activeConversation.value || !user.value) return false
    const conv = activeConversation.value
    return conv.buyer_id === user.value.id ? conv.buyer_accepted_share : conv.seller_accepted_share
  })

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onUnmounted(() => {
    unsubscribeRealtime()
  })

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    sending,
    unreadCount,
    isDataShared,
    hasAcceptedShare,
    fetchConversations,
    openConversation,
    startConversation,
    sendMessage,
    markAsRead,
    acceptDataShare,
    closeConversation,
    maskContactData,
  }
}
