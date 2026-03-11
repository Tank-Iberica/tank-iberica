/**
 * Shared type definitions for useConversation composable.
 */

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
  /** Optimistic UI status — only set on client-side temp messages */
  _status?: 'sending' | 'failed'
}
