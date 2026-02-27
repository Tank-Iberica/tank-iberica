<script setup lang="ts">
defineProps<{
  value: string
  sending: boolean
}>()

const emit = defineEmits<{
  (e: 'input', value: string): void
  (e: 'send'): void
}>()

function onTextareaInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('input', target.value)
}
</script>

<template>
  <div class="message-input-area">
    <textarea
      class="message-input"
      :value="value"
      :placeholder="$t('messages.inputPlaceholder')"
      rows="1"
      maxlength="5000"
      @input="onTextareaInput"
      @keydown.enter.exact.prevent="emit('send')"
    />
    <button class="message-send-btn" :disabled="sending || !value.trim()" @click="emit('send')">
      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
        <path
          d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
        />
      </svg>
      <span class="sr-only">{{ $t('messages.send') }}</span>
    </button>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
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
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  line-height: var(--line-height-normal);
}

.message-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.message-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
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
