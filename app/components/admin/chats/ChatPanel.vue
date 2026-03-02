<script setup lang="ts">
import type {
  Conversation,
  ChatMessage,
  ChatUser,
  MessageDateGroup,
} from '~/composables/admin/useAdminChats'

const props = defineProps<{
  activeConversation: Conversation | null
  activeUserId: string | null
  sending: boolean
  messageInput: string
  showConversationList: boolean
  messagesContainerRef: HTMLElement | null
  getUserDisplayName: (user: ChatUser) => string
  getUserInitials: (user: ChatUser) => string
  formatMessageTime: (dateStr: string) => string
  formatFullDate: (dateStr: string) => string
  groupMessagesByDate: (messages: ChatMessage[]) => MessageDateGroup[]
}>()

const emit = defineEmits<{
  (e: 'go-back' | 'send-message'): void
  (e: 'update:messageInput', value: string): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'update:messagesContainerRef', el: HTMLElement | null): void
}>()

const internalMessagesRef = ref<HTMLElement | null>(null)

// Sync internal ref with parent via emit
watch(internalMessagesRef, (el) => {
  emit('update:messagesContainerRef', el)
})

onMounted(() => {
  if (internalMessagesRef.value) {
    emit('update:messagesContainerRef', internalMessagesRef.value)
  }
})

function onTextareaInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:messageInput', target.value)
}

function onTextareaKeydown(event: KeyboardEvent) {
  emit('keydown', event)
}
</script>

<template>
  <div class="chat-panel" :class="{ 'mobile-visible': !showConversationList || !activeUserId }">
    <!-- No conversation selected -->
    <div v-if="!activeConversation" class="no-conversation">
      <div class="no-conversation-icon">\uD83D\uDCAC</div>
      <h3>Selecciona una conversaci\u00F3n</h3>
      <p>Elige un chat de la lista para ver los mensajes</p>
    </div>

    <!-- Active conversation -->
    <template v-else>
      <!-- Chat header -->
      <div class="chat-header">
        <button class="btn-back" @click="emit('go-back')">\u2190</button>
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
      <div ref="internalMessagesRef" class="messages-container">
        <template
          v-for="group in groupMessagesByDate(activeConversation.messages)"
          :key="group.date"
        >
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
              <span v-if="msg.direction === 'admin_to_user'" class="message-status">
                {{ msg.is_read ? '\u2713\u2713' : '\u2713' }}
              </span>
            </div>
          </div>
        </template>

        <!-- Empty messages -->
        <div v-if="activeConversation.messages.length === 0" class="no-messages">
          <p>No hay mensajes en esta conversaci\u00F3n</p>
          <p class="hint">Env\u00EDa el primer mensaje</p>
        </div>
      </div>

      <!-- Input area -->
      <div class="message-input-area">
        <textarea
          :value="props.messageInput"
          placeholder="Escribe un mensaje..."
          rows="1"
          :disabled="sending"
          @input="onTextareaInput"
          @keydown="onTextareaKeydown"
        />
        <button
          class="btn-send"
          :disabled="!messageInput.trim() || sending"
          @click="emit('send-message')"
        >
          <span v-if="sending" class="sending-spinner" />
          <span v-else>\u27A4</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
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
  color: var(--text-disabled);
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
  background: var(--bg-tertiary);
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-tertiary);
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
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
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
  background: var(--bg-primary);
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
  color: var(--text-disabled);
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
  background: var(--color-primary);
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
  background: var(--color-primary-dark);
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chat-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
  }

  .chat-panel.mobile-visible {
    display: none;
  }

  .btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message {
    max-width: 85%;
  }
}
</style>
