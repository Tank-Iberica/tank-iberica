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
  padding: var(--spacing-10);
}

.no-conversation-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
}

.no-conversation h3 {
  margin: 0 0 var(--spacing-2);
  color: var(--color-gray-500);
}

.no-conversation p {
  margin: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.btn-back {
  display: none;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-gray-500);
  border-radius: 50%;
}

.btn-back:hover {
  background: var(--bg-tertiary);
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.avatar {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar.small {
  width: 2.5rem;
  height: 2.5rem;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-gray-500);
}

.chat-user-details {
  display: flex;
  flex-direction: column;
}

.chat-user-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.chat-user-email {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  background: var(--color-ui-gray);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.75rem 0;
}

.date-separator span {
  background: rgba(255, 255, 255, 0.9);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  color: var(--color-gray-500);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message {
  max-width: 70%;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-md);
  position: relative;
}

.message-sent {
  align-self: flex-end;
  background: var(--color-whatsapp-bg);
  border-bottom-right-radius: 0.25rem;
}

.message-received {
  align-self: flex-start;
  background: var(--bg-primary);
  border-bottom-left-radius: 0.25rem;
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
  gap: var(--spacing-1);
  margin-top: var(--spacing-1);
}

.message-time {
  font-size: 0.7rem;
  color: var(--color-chat-text-secondary);
}

.message-status {
  font-size: 0.8rem;
  color: var(--color-chat-link);
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
  margin-top: var(--spacing-1);
}

/* Input area */
.message-input-area {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-ui-gray);
  border-top: 1px solid var(--color-gray-200);
}

.message-input-area textarea {
  flex: 1;
  padding: 0.625rem var(--spacing-4);
  border: none;
  border-radius: var(--border-radius-full);
  font-size: 0.95rem;
  resize: none;
  max-height: 7.5rem;
  line-height: 1.4;
}

.message-input-area textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.2);
}

.btn-send {
  width: 2.75rem;
  height: 2.75rem;
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
  width: 1.25rem;
  height: 1.25rem;
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
  width: 0.375rem;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--border-radius-sm);
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* Mobile responsive */
@media (max-width: 48em) {
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
