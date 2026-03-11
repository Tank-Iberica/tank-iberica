<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  contentEs: string
  contentWordCount: number
  wordCountClass: string
}>()

defineEmits<{
  'update:contentEs': [value: string]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">{{ t('admin.newsForm.contentEs') }} *</div>
    <div class="field">
      <textarea
        rows="14"
        class="input textarea"
        :placeholder="t('admin.newsForm.contentPlaceholder')"
        :value="contentEs"
        @input="$emit('update:contentEs', ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="count-row">
        <span class="char-count"> {{ contentEs.length }} {{ t('admin.newsForm.characters') }} </span>
        <span class="char-count word-count" :class="wordCountClass">
          {{ contentWordCount }} {{ t('admin.newsForm.words') }}
          <span v-if="contentWordCount > 0 && contentWordCount < 300" class="word-target"
            >/ 300 {{ t('admin.newsForm.recommended') }}</span
          >
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}

.count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.char-count {
  font-size: 0.7rem;
  color: var(--text-disabled);
  text-align: right;
}

.word-count {
  font-weight: 500;
}

.word-target {
  color: var(--text-disabled);
  font-weight: 400;
}

.count-good {
  color: var(--color-success);
}
.count-warning {
  color: var(--color-warning);
}
.count-bad {
  color: var(--color-error);
}
</style>
