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
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-gray-100);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.input {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
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
  border-radius: 6px;
  overflow: hidden;
}

.slug-prefix {
  padding: 8px 0 8px 12px;
  color: var(--text-disabled);
  font-size: 0.85rem;
  white-space: nowrap;
  background: var(--bg-secondary);
}

.slug-field {
  border: none !important;
  border-radius: 0 !important;
  padding-left: 4px !important;
}

.slug-field:focus {
  border: none !important;
  box-shadow: none !important;
}
</style>
