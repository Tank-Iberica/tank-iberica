<script setup lang="ts">
defineProps<{
  previewUrl: string
  iframeWidth: string
  theme: 'light' | 'dark'
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card preview-card">
    <h2 class="card-title">{{ t('dashboard.widget.preview') }}</h2>
    <div class="preview-container" :class="{ 'dark-preview': theme === 'dark' }">
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        :width="iframeWidth"
        height="400"
        frameborder="0"
        :title="t('dashboard.widget.iframeTitle')"
        class="preview-iframe"
      />
      <div v-else class="preview-placeholder">
        <p>{{ t('dashboard.widget.previewPlaceholder') }}</p>
      </div>
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

.preview-container {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  min-height: 18.75rem;
}

.preview-container.dark-preview {
  border-color: var(--color-slate-700);
}

.preview-iframe {
  display: block;
  width: 100%;
  border: none;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12.5rem;
  color: var(--text-disabled);
  text-align: center;
  padding: 1.25rem;
}

.preview-placeholder p {
  margin: 0;
}
</style>
