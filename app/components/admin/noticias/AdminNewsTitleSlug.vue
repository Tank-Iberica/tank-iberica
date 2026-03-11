<script setup lang="ts">
defineProps<{
  titleEs: string
  slug: string
  titleLengthClass: string
}>()

defineEmits<{
  'update:titleEs': [value: string]
  'update:slug': [value: string]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Titulo y URL</div>
    <div class="field">
      <label>Titulo (ES) *</label>
      <input
        type="text"
        class="input"
        placeholder="Titulo de la noticia..."
        :value="titleEs"
        @input="$emit('update:titleEs', ($event.target as HTMLInputElement).value)"
      >
      <span class="char-count" :class="titleLengthClass"> {{ titleEs.length }}/60 caracteres </span>
    </div>
    <div class="field">
      <label>URL (slug)</label>
      <div class="slug-input-wrapper">
        <span class="slug-prefix">/noticias/</span>
        <input
          type="text"
          class="input slug-field"
          placeholder="url-de-la-noticia"
          :value="slug"
          @input="$emit('update:slug', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
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

/* Slug input */
.slug-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.slug-prefix {
  padding: 0.5rem 0 0.5rem 0.75rem;
  color: var(--text-disabled);
  font-size: 0.85rem;
  white-space: nowrap;
  background: var(--bg-secondary);
}

.slug-field {
  border: none !important;
  border-radius: 0 !important;
  padding-left: var(--spacing-1) !important;
}

.slug-field:focus {
  border: none !important;
  box-shadow: none !important;
}
</style>
