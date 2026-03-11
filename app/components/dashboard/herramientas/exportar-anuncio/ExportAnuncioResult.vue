<script setup lang="ts">
const props = defineProps<{
  generatedText: string
  charCount: number
  maxChars: number
  charCountClass: string
  copySuccess: boolean
}>()

const emit = defineEmits<{
  (e: 'update:text', value: string): void
  (e: 'copy'): void
}>()

const { t } = useI18n()

function onTextareaInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('update:text', target.value)
}
</script>

<template>
  <section class="card">
    <h2 class="card-title">{{ t('dashboard.adExport.result') }}</h2>

    <textarea
      :value="props.generatedText"
      class="generated-textarea"
      rows="12"
      @input="onTextareaInput"
    />

    <div class="textarea-footer">
      <span class="char-counter" :class="props.charCountClass">
        {{ props.charCount }}/{{ props.maxChars }}
      </span>
      <button class="btn-copy" :class="{ success: props.copySuccess }" @click="emit('copy')">
        {{ props.copySuccess ? t('dashboard.adExport.copied') : t('dashboard.adExport.copy') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}

.card-title {
  margin: 0 0 1rem 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.generated-textarea {
  width: 100%;
  min-height: 12.5rem;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text-primary);
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}

.generated-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring-strong);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  gap: 0.75rem;
}

.char-counter {
  font-size: 0.85rem;
  font-weight: 500;
}

.count-ok {
  color: var(--text-auxiliary);
}

.count-warning {
  color: var(--color-warning);
}

.count-over {
  color: var(--color-error);
  font-weight: 700;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-copy:hover {
  background: var(--color-primary-dark);
}

.btn-copy.success {
  background: var(--color-success);
}
</style>
