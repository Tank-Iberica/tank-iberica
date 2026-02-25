<template>
  <div class="conversation-panel">
    <!-- Header -->
    <div class="panel-header">
      <div v-if="activeConversation" class="header-info">
        <img
          v-if="activeConversation.vehicle_image"
          :src="activeConversation.vehicle_image"
          :alt="activeConversation.vehicle_title || ''"
          class="header-vehicle-img"
          loading="lazy"
        >
        <div class="header-text">
          <h3 class="header-title">
            {{ activeConversation.vehicle_title || $t('conversation.vehicle') }}
          </h3>
          <span class="header-party">{{
            activeConversation.other_party_name || $t('conversation.otherParty')
          }}</span>
          <span class="header-status" :class="`status--${activeConversation.status}`">
            {{ $t(`conversation.status.${activeConversation.status}`) }}
          </span>
        </div>
      </div>
      <div v-else class="header-loading">
        <span class="spinner" />
      </div>
    </div>

    <!-- Data sharing banner -->
    <div v-if="activeConversation && !isDataShared && !hasAcceptedShare" class="share-banner">
      <p class="share-banner-text">{{ $t('conversation.shareDataPrompt') }}</p>
      <button class="share-banner-btn" @click="onAcceptShare">
        {{ $t('conversation.shareData') }}
      </button>
    </div>

    <!-- Waiting for other party banner -->
    <div
      v-if="activeConversation && !isDataShared && hasAcceptedShare"
      class="share-banner share-banner--pending"
    >
      <p class="share-banner-text">{{ $t('conversation.shareDataPending') }}</p>
    </div>

    <!-- Messages area -->
    <div ref="messagesContainer" class="messages-area">
      <div v-if="loading" class="messages-loading">
        <span class="spinner" />
        <span>{{ $t('common.loading') }}</span>
      </div>

      <template v-else>
        <div v-if="messages.length === 0" class="messages-empty">
          <p>{{ $t('conversation.noMessages') }}</p>
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-wrapper"
          :class="{
            'message-wrapper--own': isOwnMessage(msg.sender_id),
            'message-wrapper--system': msg.is_system,
          }"
        >
          <!-- System message -->
          <div v-if="msg.is_system" class="message-system">
            <span>{{ $t(`conversation.systemMessages.${msg.content}`, msg.content) }}</span>
          </div>

          <!-- Regular message bubble -->
          <div v-else class="message-bubble">
            <p class="message-content">{{ displayContent(msg.content) }}</p>
            <span class="message-timestamp">{{ formatTimestamp(msg.created_at) }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <textarea
        ref="textareaRef"
        v-model="newMessage"
        class="input-textarea"
        :placeholder="$t('conversation.typePlaceholder')"
        rows="1"
        :disabled="sending"
        @input="autoGrowTextarea"
        @keydown.enter.exact.prevent="onSend"
      />
      <button
        class="input-send-btn"
        :disabled="!canSend"
        :aria-label="$t('conversation.send')"
        @click="onSend"
      >
        <span v-if="sending" class="spinner spinner--small" />
        <svg
          v-else
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConversation } from '~/composables/useConversation'

const props = defineProps<{
  conversationId: string
}>()

const user = useSupabaseUser()

const {
  activeConversation,
  messages,
  loading,
  sending,
  isDataShared,
  hasAcceptedShare,
  openConversation,
  sendMessage,
  acceptDataShare,
  maskContactData,
} = useConversation()

const newMessage = ref('')
const messagesContainer = ref<HTMLDivElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => newMessage.value.trim().length > 0 && !sending.value)

// Open conversation on mount
onMounted(async () => {
  await openConversation(props.conversationId)
  scrollToBottom()
})

// Auto-scroll when new messages arrive
watch(
  () => messages.value.length,
  () => {
    nextTick(() => scrollToBottom())
  },
)

function isOwnMessage(senderId: string): boolean {
  return user.value?.id === senderId
}

function displayContent(content: string): string {
  return maskContactData(content, isDataShared.value)
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) return time

  const day = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  })

  return `${day} ${time}`
}

function scrollToBottom(): void {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function autoGrowTextarea(): void {
  const el = textareaRef.value
  if (!el) return

  el.style.height = 'auto'
  const maxHeight = 3 * 24 // ~3 lines at default line-height
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

async function onSend(): Promise<void> {
  const content = newMessage.value.trim()
  if (!content || sending.value) return

  newMessage.value = ''

  // Reset textarea height
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  await sendMessage(props.conversationId, content)
  scrollToBottom()
}

async function onAcceptShare(): Promise<void> {
  await acceptDataShare(props.conversationId)
}
</script>

<style scoped>
.conversation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

/* Header */
.panel-header {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
  background: var(--bg-primary);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.header-vehicle-img {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.header-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-party {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.header-status {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.status--active {
  color: var(--color-success);
}

.status--data_shared {
  color: var(--color-info);
}

.status--closed {
  color: var(--text-auxiliary);
}

.status--reported {
  color: var(--color-error);
}

.header-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2);
}

/* Data sharing banner */
.share-banner {
  padding: var(--spacing-3) var(--spacing-4);
  background: rgba(59, 130, 246, 0.08);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.share-banner--pending {
  background: rgba(245, 158, 11, 0.08);
  border-bottom-color: rgba(245, 158, 11, 0.2);
}

.share-banner-text {
  flex: 1;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
  min-width: 140px;
}

.share-banner-btn {
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-info);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  min-height: 36px;
  white-space: nowrap;
  transition: background var(--transition-fast);
}

.share-banner-btn:hover {
  background: #2563eb;
}

/* Messages area */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  min-height: 200px;
}

.messages-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-8);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.messages-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.messages-empty p {
  margin: 0;
}

/* Message bubbles */
.message-wrapper {
  display: flex;
  justify-content: flex-start;
  max-width: 85%;
}

.message-wrapper--own {
  justify-content: flex-end;
  align-self: flex-end;
  max-width: 85%;
  margin-left: auto;
}

.message-wrapper--system {
  justify-content: center;
  align-self: center;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.message-bubble {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius) var(--border-radius) var(--border-radius)
    var(--border-radius-sm);
  background: var(--bg-secondary);
  max-width: 100%;
}

.message-wrapper--own .message-bubble {
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-radius: var(--border-radius) var(--border-radius) var(--border-radius-sm)
    var(--border-radius);
}

.message-content {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-timestamp {
  display: block;
  font-size: 10px;
  color: var(--text-auxiliary);
  margin-top: 2px;
  text-align: right;
}

.message-wrapper--own .message-timestamp {
  color: var(--text-on-dark-auxiliary);
}

/* System messages */
.message-system {
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
}

/* Input area */
.input-area {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-primary);
  flex-shrink: 0;
}

.input-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 72px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  color: var(--text-primary);
  background: var(--bg-primary);
  resize: none;
  line-height: var(--line-height-normal);
  transition: border-color var(--transition-fast);
}

.input-textarea::placeholder {
  color: var(--text-auxiliary);
}

.input-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.input-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-send-btn {
  min-width: 44px;
  min-height: 44px;
  padding: var(--spacing-2);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.input-send-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.input-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner--small {
  width: 14px;
  height: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Desktop */
@media (min-width: 768px) {
  .conversation-panel {
    max-height: 600px;
  }

  .message-wrapper {
    max-width: 70%;
  }

  .message-wrapper--own {
    max-width: 70%;
  }
}
</style>
