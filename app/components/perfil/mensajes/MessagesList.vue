<script setup lang="ts">
import type { ConversationMessage } from '~/composables/useConversation'
import { formatMessageTime } from '~/composables/usePerfilMensajes'

defineProps<{
  messages: ConversationMessage[]
  currentUserId: string
  isDataShared: boolean
  maskContactData: (text: string, isShared: boolean) => string
}>()

const { t } = useI18n()

const messagesEndRef = ref<HTMLDivElement | null>(null)

function isOwnMessage(senderId: string, userId: string): boolean {
  return senderId === userId
}

function getDisplayContent(
  content: string,
  isSystem: boolean,
  isShared: boolean,
  mask: (text: string, shared: boolean) => string,
): string {
  if (isSystem) {
    if (content === 'both_parties_shared_data') {
      return t('messages.systemDataShared')
    }
    return content
  }
  return mask(content, isShared)
}

function scrollToBottom(): void {
  if (messagesEndRef.value) {
    messagesEndRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}

defineExpose({ scrollToBottom })
</script>

<template>
  <div class="messages-list">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="message-bubble-wrap"
      :class="{
        'message-bubble-wrap--own': isOwnMessage(msg.sender_id, currentUserId),
        'message-bubble-wrap--other': !isOwnMessage(msg.sender_id, currentUserId),
        'message-bubble-wrap--system': msg.is_system,
      }"
    >
      <!-- System message -->
      <div v-if="msg.is_system" class="message-system">
        {{ getDisplayContent(msg.content, true, isDataShared, maskContactData) }}
      </div>

      <!-- Regular message -->
      <div v-else class="message-bubble">
        <p class="message-text">
          {{ getDisplayContent(msg.content, false, isDataShared, maskContactData) }}
        </p>
        <span class="message-time">{{ formatMessageTime(msg.created_at) }}</span>
      </div>
    </div>

    <div ref="messagesEndRef" />
  </div>
</template>

<style scoped>
.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.message-bubble-wrap {
  display: flex;
  max-width: 85%;
}

.message-bubble-wrap--own {
  align-self: flex-end;
}

.message-bubble-wrap--other {
  align-self: flex-start;
}

.message-bubble-wrap--system {
  align-self: center;
  max-width: 100%;
}

.message-system {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
  font-style: italic;
}

.message-bubble {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  max-width: 100%;
  word-break: break-word;
}

.message-bubble-wrap--own .message-bubble {
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-bottom-right-radius: var(--border-radius-sm);
}

.message-bubble-wrap--other .message-bubble {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: var(--border-radius-sm);
}

.message-text {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-1);
}

.message-time {
  display: block;
  font-size: 10px;
  text-align: right;
}

.message-bubble-wrap--own .message-time {
  color: var(--text-on-dark-auxiliary);
}

.message-bubble-wrap--other .message-time {
  color: var(--text-auxiliary);
}

@media (min-width: 1024px) {
  .message-bubble-wrap {
    max-width: 65%;
  }
}
</style>
