<script setup lang="ts">
import type { BannerLang } from '~/composables/admin/useAdminBanner'

const props = defineProps<{
  previewHtml: string
  previewLang: BannerLang
}>()

const emit = defineEmits<{
  'update-lang': [lang: BannerLang]
}>()

const { sanitize } = useSanitize()
</script>

<template>
  <div class="preview-panel">
    <div class="preview-header">
      <h4>Vista previa</h4>
      <div class="preview-lang-toggle">
        <button :class="{ active: props.previewLang === 'es' }" @click="emit('update-lang', 'es')">
          ES
        </button>
        <button :class="{ active: props.previewLang === 'en' }" @click="emit('update-lang', 'en')">
          EN
        </button>
      </div>
    </div>
    <div class="preview-content">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="props.previewHtml" class="banner-preview" v-html="sanitize(props.previewHtml)" />
      <div v-else class="preview-empty">Sin texto configurado para este idioma</div>
    </div>
  </div>
</template>

<style scoped>
.preview-panel {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
  max-width: 43.75rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.preview-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-gray-700);
}

.preview-lang-toggle {
  display: flex;
  gap: var(--spacing-1);
}

.preview-lang-toggle button {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  padding: 0.375rem var(--spacing-3);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.preview-lang-toggle button:hover {
  background: var(--bg-tertiary);
}

.preview-lang-toggle button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.preview-content {
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.banner-preview {
  background: var(--color-amber-400);
  color: var(--text-primary);
  padding: var(--spacing-3) var(--spacing-5);
  text-align: center;
  font-size: var(--font-size-sm);
}

.banner-preview :deep(a) {
  color: var(--color-primary-darker);
  font-weight: 600;
  text-decoration: underline;
}

.preview-empty {
  padding: var(--spacing-6);
  text-align: center;
  color: var(--text-disabled);
  font-style: italic;
}
</style>
