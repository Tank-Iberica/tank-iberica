<script setup lang="ts">
const props = defineProps<{
  value: string
  sending: boolean
  /** Show quick reply chips (dealers only) */
  showQuickReplies?: boolean
}>()

const emit = defineEmits<{
  (e: 'input', value: string): void
  (e: 'send'): void
}>()

const { t } = useI18n()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const QUICK_REPLIES = computed(() => [
  t('messages.quickReplyAvailable'),
  t('messages.quickReplyNegotiable'),
  t('messages.quickReplySold'),
  t('messages.quickReplyVisit'),
])

function onTextareaInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('input', target.value)
}

function useQuickReply(text: string): void {
  emit('input', text)
  nextTick(() => {
    textareaRef.value?.focus()
  })
}
</script>

<template>
  <div class="message-input-wrapper">
    <!-- Quick reply chips — shown only for dealers -->
    <div
      v-if="props.showQuickReplies"
      class="quick-replies"
      :aria-label="$t('messages.quickReplies')"
    >
      <button
        v-for="reply in QUICK_REPLIES"
        :key="reply"
        class="quick-reply-chip"
        type="button"
        @click="useQuickReply(reply)"
      >
        {{ reply }}
      </button>
    </div>

    <div class="message-input-area">
      <textarea
        ref="textareaRef"
        class="message-input"
        :value="value"
        :placeholder="$t('messages.inputPlaceholder')"
        rows="1"
        maxlength="5000"
        @input="onTextareaInput"
        @keydown.enter.exact.prevent="emit('send')"
      />
      <UiCharCounter v-if="value.length > 4000" :current="value.length" :max="5000" />
      <button class="message-send-btn" :disabled="sending || !value.trim()" @click="emit('send')">
        <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path
            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
          />
        </svg>
        <span class="sr-only">{{ $t('messages.send') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.message-input-wrapper {
  display: flex;
  flex-direction: column;
}

/* Quick replies */
.quick-replies {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  overflow-x: auto;
  scrollbar-width: none;
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-primary);
}

.quick-replies::-webkit-scrollbar {
  display: none;
}

.quick-reply-chip {
  padding: 0.25rem 0.875rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-full);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  min-height: 1.875rem;
  transition: background var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.quick-reply-chip:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.sr-only {
  position: absolute;
  width: 0.0625rem;
  height: 0.0625rem;
  padding: 0;
  margin: -0.0625rem;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.message-input-area {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-primary);
}

.message-input {
  flex: 1;
  resize: none;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background: var(--bg-primary);
  min-height: 2.75rem;
  max-height: 7.5rem;
  font-family: inherit;
  line-height: var(--line-height-normal);
}

.message-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.message-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.message-send-btn:hover {
  background: var(--color-primary-dark);
}

.message-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
