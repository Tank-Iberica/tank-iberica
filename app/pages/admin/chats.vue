<script setup lang="ts">
import { useAdminChat, type ChatMessage } from '~/composables/admin/useAdminChat'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  loading,
  sending,
  error,
  conversationList: _conversationList,
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

// Search state
const searchQuery = ref('')
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// Filtered conversations
const filteredConversations = computed(() => {
  return searchConversations(searchQuery.value)
})

// Mobile view state
const showConversationList = ref(true)

// Load data and subscribe to realtime
onMounted(async () => {
  await fetchConversations()
  subscribeToRealtime()
})

// Scroll to bottom when messages change
watch(
  () => activeConversation.value?.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
)

// Scroll to bottom of messages
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
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

// Handle enter key
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

// Group messages by date
function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = []
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
</script>

<template>
  <div class="admin-chat">
    <!-- Header -->
    <div class="section-header">
      <h2>Chats</h2>
      <div v-if="totalUnreadCount > 0" class="unread-badge-header">
        {{ totalUnreadCount }} sin leer
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      Cargando conversaciones...
    </div>

    <!-- Chat container -->
    <div v-else class="chat-container">
      <!-- Conversation List -->
      <div
        class="conversation-list"
        :class="{ 'mobile-hidden': !showConversationList && activeUserId }"
      >
        <!-- Search -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar conversaciones..."
          >
        </div>

        <!-- Empty state -->
        <div v-if="filteredConversations.length === 0" class="empty-list">
          <div class="empty-icon">
            💬
          </div>
          <p v-if="searchQuery">
            No hay resultados para "{{ searchQuery }}"
          </p>
          <p v-else>
            No hay conversaciones aún
          </p>
        </div>

        <!-- Conversations -->
        <div class="conversations">
          <button
            v-for="conv in filteredConversations"
            :key="conv.user.id"
            class="conversation-item"
            :class="{ active: activeUserId === conv.user.id }"
            @click="selectConversation(conv.user.id)"
          >
            <!-- Avatar -->
            <div class="avatar">
              <img
                v-if="conv.user.avatar_url"
                :src="conv.user.avatar_url"
                :alt="getUserDisplayName(conv.user)"
              >
              <span v-else class="avatar-initials">
                {{ getUserInitials(conv.user) }}
              </span>
              <span v-if="conv.unreadCount > 0" class="unread-dot" />
            </div>

            <!-- Info -->
            <div class="conversation-info">
              <div class="conversation-header">
                <span class="conversation-name">
                  {{ getUserDisplayName(conv.user) }}
                </span>
                <span v-if="conv.lastMessage" class="conversation-time">
                  {{ formatMessageTime(conv.lastMessage.created_at) }}
                </span>
              </div>
              <div class="conversation-preview">
                <span v-if="conv.lastMessage" class="preview-text">
                  <span
                    v-if="conv.lastMessage.direction === 'admin_to_user'"
                    class="preview-you"
                  >Tú: </span>
                  {{ conv.lastMessage.content }}
                </span>
                <span v-else class="preview-empty">Sin mensajes</span>
                <span v-if="conv.unreadCount > 0" class="unread-badge">
                  {{ conv.unreadCount }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Chat Panel -->
      <div
        class="chat-panel"
        :class="{ 'mobile-visible': !showConversationList || !activeUserId }"
      >
        <!-- No conversation selected -->
        <div v-if="!activeConversation" class="no-conversation">
          <div class="no-conversation-icon">
            💬
          </div>
          <h3>Selecciona una conversación</h3>
          <p>Elige un chat de la lista para ver los mensajes</p>
        </div>

        <!-- Active conversation -->
        <template v-else>
          <!-- Chat header -->
          <div class="chat-header">
            <button class="btn-back" @click="goBackToList">
              ←
            </button>
            <div class="chat-user-info">
              <div class="avatar small">
                <img
                  v-if="activeConversation.user.avatar_url"
                  :src="activeConversation.user.avatar_url"
                  :alt="getUserDisplayName(activeConversation.user)"
                >
                <span v-else class="avatar-initials">
                  {{ getUserInitials(activeConversation.user) }}
                </span>
              </div>
              <div class="chat-user-details">
                <span class="chat-user-name">
                  {{ getUserDisplayName(activeConversation.user) }}
                </span>
                <span class="chat-user-email">
                  {{ activeConversation.user.email }}
                </span>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div ref="messagesContainer" class="messages-container">
            <template v-for="group in groupMessagesByDate(activeConversation.messages)" :key="group.date">
              <!-- Date separator -->
              <div class="date-separator">
                <span>{{ group.date }}</span>
              </div>

              <!-- Messages -->
              <div
                v-for="msg in group.messages"
                :key="msg.id"
                class="message"
                :class="{
                  'message-sent': msg.direction === 'admin_to_user',
                  'message-received': msg.direction === 'user_to_admin',
                }"
                :title="formatFullDate(msg.created_at)"
              >
                <div class="message-content">
                  {{ msg.content }}
                </div>
                <div class="message-meta">
                  <span class="message-time">
                    {{ formatMessageTime(msg.created_at) }}
                  </span>
                  <span
                    v-if="msg.direction === 'admin_to_user'"
                    class="message-status"
                  >
                    {{ msg.is_read ? '✓✓' : '✓' }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Empty messages -->
            <div v-if="activeConversation.messages.length === 0" class="no-messages">
              <p>No hay mensajes en esta conversación</p>
              <p class="hint">Envía el primer mensaje</p>
            </div>
          </div>

          <!-- Input area -->
          <div class="message-input-area">
            <textarea
              v-model="messageInput"
              placeholder="Escribe un mensaje..."
              rows="1"
              :disabled="sending"
              @keydown="handleKeyDown"
            />
            <button
              class="btn-send"
              :disabled="!messageInput.trim() || sending"
              @click="handleSendMessage"
            >
              <span v-if="sending" class="sending-spinner" />
              <span v-else>➤</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-chat {
  padding: 0;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.unread-badge-header {
  background: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #6b7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-primary, #23424A);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Chat container */
.chat-container {
  flex: 1;
  display: flex;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 0;
}

/* Conversation list */
.conversation-list {
  width: 340px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.search-box {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.search-box input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
  background: #f9fafb;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
  background: white;
}

.conversations {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f3f4f6;
}

.conversation-item:hover {
  background: #f9fafb;
}

.conversation-item.active {
  background: #eff6ff;
}

.avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar.small {
  width: 40px;
  height: 40px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 1.1rem;
  font-weight: 600;
  color: #6b7280;
}

.avatar.small .avatar-initials {
  font-size: 0.9rem;
}

.unread-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid white;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.conversation-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.conversation-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-text {
  flex: 1;
  font-size: 0.85rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-you {
  color: #9ca3af;
}

.preview-empty {
  font-size: 0.85rem;
  color: #9ca3af;
  font-style: italic;
}

.unread-badge {
  background: #22c55e;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-list p {
  margin: 0;
}

/* Chat panel */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.no-conversation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  padding: 40px;
}

.no-conversation-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.no-conversation h3 {
  margin: 0 0 8px;
  color: #6b7280;
}

.no-conversation p {
  margin: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.btn-back {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 50%;
}

.btn-back:hover {
  background: #e5e7eb;
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-user-details {
  display: flex;
  flex-direction: column;
}

.chat-user-name {
  font-weight: 600;
  color: #1f2937;
}

.chat-user-email {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 0;
}

.date-separator span {
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #6b7280;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
}

.message-sent {
  align-self: flex-end;
  background: #dcf8c6;
  border-bottom-right-radius: 4px;
}

.message-received {
  align-self: flex-start;
  background: white;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

.message-content {
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.4;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.message-time {
  font-size: 0.7rem;
  color: #8696a0;
}

.message-status {
  font-size: 0.8rem;
  color: #53bdeb;
}

.no-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  text-align: center;
}

.no-messages p {
  margin: 0;
}

.no-messages .hint {
  font-size: 0.85rem;
  margin-top: 4px;
}

/* Input area */
.message-input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f2f5;
  border-top: 1px solid #e5e7eb;
}

.message-input-area textarea {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 20px;
  font-size: 0.95rem;
  resize: none;
  max-height: 120px;
  line-height: 1.4;
}

.message-input-area textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.2);
}

.btn-send {
  width: 44px;
  height: 44px;
  border: none;
  background: var(--color-primary, #23424A);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  background: var(--color-primary-dark, #1a3238);
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sending-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .admin-chat {
    height: calc(100vh - 80px);
  }

  .chat-container {
    flex-direction: column;
  }

  .conversation-list {
    width: 100%;
    border-right: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 10;
  }

  .conversation-list.mobile-hidden {
    display: none;
  }

  .chat-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
  }

  .chat-panel.mobile-visible {
    display: none;
  }

  .chat-container {
    position: relative;
  }

  .btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message {
    max-width: 85%;
  }

  .avatar {
    width: 44px;
    height: 44px;
  }
}

/* Scrollbar styling */
.conversations::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.conversations::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.conversations::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.conversations::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
