<script setup lang="ts">
import type { BannerLang } from '~/composables/admin/useAdminBanner'

const props = defineProps<{
  previewHtml: string
  previewLang: BannerLang
}>()

const emit = defineEmits<{
  (e: 'update-lang', lang: BannerLang): void
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
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 700px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #374151;
}

.preview-lang-toggle {
  display: flex;
  gap: 4px;
}

.preview-lang-toggle button {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.preview-lang-toggle button:hover {
  background: #e5e7eb;
}

.preview-lang-toggle button.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.preview-content {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.banner-preview {
  background: #fbbf24;
  color: #1f2a2a;
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
}

.banner-preview :deep(a) {
  color: #0f2a2e;
  font-weight: 600;
  text-decoration: underline;
}

.preview-empty {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}
</style>
