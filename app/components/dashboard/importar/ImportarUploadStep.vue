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
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  text-align: center;
  padding: 1.25rem;
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
  min-height: 2.75rem;
  padding: 0.75rem 1.5rem;
  border: 0.125rem dashed var(--color-gray-200);
  border-radius: var(--border-radius);
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
  padding: 0.75rem 1rem;
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  width: 100%;
  max-width: 31.25rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
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
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}
</style>
