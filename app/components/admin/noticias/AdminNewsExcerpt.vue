<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  excerptEs: string | null
  excerptLengthClass: string
}>()

defineEmits<{
  'update:excerptEs': [value: string | null]
}>()

function getExcerptLengthLabel(len: number): string {
  if (len >= 120 && len <= 200) return t('admin.newsForm.excerptIdealLength')
  if (len < 120) return t('admin.newsForm.excerptTooShort')
  return t('admin.newsForm.excerptTooLong')
}
</script>

<template>
  <div class="section">
    <div class="section-title">{{ t('admin.newsForm.excerpt') }}</div>
    <p class="section-hint">
      {{ t('admin.newsForm.excerptHint') }}
    </p>
    <div class="field">
      <label>{{ t('admin.newsForm.excerptEs') }}</label>
      <textarea
        rows="3"
        class="input textarea"
        maxlength="300"
        :placeholder="t('admin.newsForm.excerptPlaceholder')"
        :value="excerptEs || ''"
        @input="$emit('update:excerptEs', ($event.target as HTMLTextAreaElement).value || null)"
      />
      <div class="count-row">
        <span class="char-count" :class="excerptLengthClass">
          {{ (excerptEs || '').length }}/300 {{ t('admin.newsForm.characters') }}
        </span>
        <span v-if="(excerptEs || '').length" class="char-count" :class="excerptLengthClass">
          {{ getExcerptLengthLabel((excerptEs || '').length) }}
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

.section-hint {
  font-size: 0.8rem;
  color: var(--text-disabled);
  margin: -0.5rem 0 0.75rem;
  line-height: 1.4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
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
