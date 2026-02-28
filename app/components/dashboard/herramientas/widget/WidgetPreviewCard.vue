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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.preview-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.preview-container.dark-preview {
  border-color: #334155;
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
  min-height: 200px;
  color: #94a3b8;
  text-align: center;
  padding: 20px;
}

.preview-placeholder p {
  margin: 0;
}
</style>
