<script setup lang="ts">
import type { ConversationMessage } from '~/composables/useConversation'
import { formatMessageTime } from '~/composables/usePerfilMensajes'

defineProps<{
  messages: ConversationMessage[]
  currentUserId: string
  isDataShared: boolean
  maskContactData: (text: string, isShared: boolean) => string
}>()

const emit = defineEmits<{
  (e: 'retry' | 'discard', tempId: string): void
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
      <div
        v-else
        class="message-bubble"
        :class="{
          'message-bubble--sending': msg._status === 'sending',
          'message-bubble--failed': msg._status === 'failed',
        }"
      >
        <p class="message-text">
          {{ getDisplayContent(msg.content, false, isDataShared, maskContactData) }}
        </p>
        <span v-if="msg._status === 'sending'" class="message-status">
          {{ t('messages.sending') }}
        </span>
        <span v-else-if="msg._status === 'failed'" class="message-status message-status--failed">
          {{ t('messages.sendFailed') }}
          <button class="retry-btn" type="button" @click="emit('retry', msg.id)">
            {{ t('messages.retry') }}
          </button>
          <button class="discard-btn" type="button" @click="emit('discard', msg.id)">
            {{ t('messages.discard') }}
          </button>
        </span>
        <span v-else class="message-time">{{ formatMessageTime(msg.created_at) }}</span>
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
  font-size: 0.625rem;
  text-align: right;
}

.message-bubble-wrap--own .message-time {
  color: var(--text-on-dark-auxiliary);
}

.message-bubble-wrap--other .message-time {
  color: var(--text-auxiliary);
}

.message-bubble--sending {
  opacity: 0.6;
}

.message-bubble--failed {
  border: 1px solid var(--color-error);
}

.message-status {
  display: block;
  font-size: 0.625rem;
  text-align: right;
  color: var(--text-auxiliary);
  font-style: italic;
}

.message-status--failed {
  color: var(--color-error);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.retry-btn,
.discard-btn {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer;
  min-height: 1.5rem;
}

.retry-btn {
  color: var(--color-primary);
}

.discard-btn {
  color: var(--text-auxiliary);
}

@media (min-width: 64em) {
  .message-bubble-wrap {
    max-width: 65%;
  }
}
</style>
