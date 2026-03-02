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
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.generated-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
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
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 12px;
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
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
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
