<script setup lang="ts">
import type { ChatMessage } from '~/composables/useUserChat'

const props = defineProps<{
  messages: ChatMessage[]
  loading: boolean
  sending: boolean
  sendMessage: (text: string) => Promise<boolean>
  formatTime: (date: string) => string
}>()

const { t } = useI18n()

const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function handleSend() {
  if (!chatInput.value.trim()) return
  const text = chatInput.value
  chatInput.value = ''
  const success = await props.sendMessage(text)
  if (!success) chatInput.value = text
  nextTick(scrollToBottom)
}

watch(
  () => props.messages,
  () => nextTick(scrollToBottom),
  { deep: true },
)
</script>

<template>
  <div>
    <div ref="chatContainer" class="chat-messages">
      <div v-if="loading" class="chat-loading">{{ t('common.loading') }}...</div>
      <div v-else-if="messages.length === 0" class="chat-empty">
        {{ t('user.noMessages') }}
      </div>
      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['chat-message', msg.direction === 'user_to_admin' ? 'sent' : 'received']"
        >
          <div class="message-content">{{ msg.content }}</div>
          <div class="message-time">{{ formatTime(msg.created_at) }}</div>
        </div>
      </template>
    </div>

    <div class="chat-input-area">
      <textarea
        v-model="chatInput"
        :placeholder="t('user.writeMessage')"
        rows="2"
        @keydown.enter.prevent="handleSend"
      />
      <button class="btn-send" :disabled="sending || !chatInput.trim()" @click="handleSend">
        {{ sending ? '...' : t('user.send') }}
      </button>
    </div>

    <p class="chat-info">{{ t('user.chatInfo') }}</p>
  </div>
</template>

<style scoped>
.chat-messages {
  height: 200px;
  overflow-y: auto;
  background: #f0f2f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-loading,
.chat-empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 0.9rem;
}

.chat-message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
}

.chat-message.sent {
  align-self: flex-end;
  background: #dcf8c6;
  border-bottom-right-radius: 4px;
}

.chat-message.received {
  align-self: flex-start;
  background: var(--bg-primary);
  border-bottom-left-radius: 4px;
}

.message-content {
  font-size: 0.9rem;
  word-break: break-word;
}

.message-time {
  font-size: 0.7rem;
  color: #888;
  text-align: right;
  margin-top: 4px;
}

.chat-input-area {
  display: flex;
  gap: 8px;
}

.chat-input-area textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-size: 0.9rem;
}

.btn-send {
  padding: 10px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-info {
  margin-top: 12px;
  font-size: 0.75rem;
  color: #888;
  text-align: center;
}
</style>
