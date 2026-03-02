<script setup lang="ts">
/**
 * ImportarUploadStep — Step 1: file selection, template download, error display.
 */
const { t } = useI18n()

defineProps<{
  file: File | null
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'file-upload', event: Event): void
  (e: 'parse' | 'download-template'): void
}>()
</script>

<template>
  <section class="step-section">
    <div class="upload-area">
      <h2>{{ t('dashboard.import.uploadFile') }}</h2>
      <p class="hint">{{ t('dashboard.import.supportedFormats') }}</p>

      <input
        id="file-upload"
        type="file"
        accept=".csv"
        class="file-input"
        @change="emit('file-upload', $event)"
      >
      <label for="file-upload" class="file-label">
        <span v-if="!file">{{ t('dashboard.import.chooseFile') }}</span>
        <span v-else class="file-name">{{ file.name }}</span>
      </label>

      <button type="button" class="btn-secondary" @click="emit('download-template')">
        {{ t('dashboard.import.downloadTemplate') }}
      </button>

      <div v-if="error" class="alert-error">{{ error }}</div>

      <button v-if="file" type="button" class="btn-primary" @click="emit('parse')">
        {{ t('dashboard.import.preview') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.step-section {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.upload-area h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.hint {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: 0.85rem;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 24px;
  border: 2px dashed var(--color-gray-200);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.file-label:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

.file-name {
  color: var(--color-primary);
  font-weight: 600;
}

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  width: 100%;
  max-width: 500px;
}

.btn-primary {
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
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}
</style>
