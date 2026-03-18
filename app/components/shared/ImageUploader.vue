<script setup lang="ts">
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'

const props = defineProps<{
  modelValue: string
  label: string
  folder: string
  recommendations: string[]
  /** CSS class applied to the preview box: logo-preview | logo-dark-preview | favicon-preview | cover-preview | og-preview */
  previewClass?: string
  /** Show "Eliminar fondo" button after upload (uses Cloudinary e_background_removal) */
  enableBgRemoval?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()
const { upload, uploading, progress, error: uploadError } = useCloudinaryUpload()
const localError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const bgRemoving = ref(false)

const currentUrl = computed(() => props.modelValue)

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  localError.value = null

  const result = await upload(file, props.folder)
  if (result) {
    emit('update:modelValue', result.secure_url)
  } else {
    localError.value = uploadError.value
  }
  if (fileInput.value) fileInput.value.value = ''
}

function removeImage() {
  emit('update:modelValue', '')
}

/**
 * Apply Cloudinary e_background_removal transformation.
 * Inserts the transformation after /upload/ in the URL.
 * Requires the Background Removal add-on enabled on the Cloudinary account.
 */
async function removeBg() {
  if (!currentUrl.value) return
  bgRemoving.value = true
  localError.value = null

  try {
    const transformedUrl = currentUrl.value.replace('/upload/', '/upload/e_background_removal/')
    // Pre-fetch so Cloudinary processes the transformation before we save
    const res = await fetch(transformedUrl, { method: 'HEAD' })
    if (!res.ok)
      throw new Error(t('shared.imageUploader.bgRemovalUnavailable'))
    emit('update:modelValue', transformedUrl)
  } catch (err: unknown) {
    localError.value = err instanceof Error ? err.message : t('shared.imageUploader.bgRemovalError')
  } finally {
    bgRemoving.value = false
  }
}
</script>

<template>
  <div class="image-uploader">
    <label class="uploader-label">{{ label }}</label>

    <!-- Recommendations -->
    <ul class="recommendations">
      <li v-for="rec in recommendations" :key="rec">{{ rec }}</li>
    </ul>

    <!-- Current image preview -->
    <div v-if="currentUrl" class="preview-wrapper">
      <div class="preview-box" :class="previewClass">
        <img :src="currentUrl" :alt="label" class="preview-img" >
      </div>
      <div class="preview-actions">
        <button
          v-if="enableBgRemoval"
          type="button"
          class="btn-bg-removal"
          :disabled="bgRemoving"
          @click="removeBg"
        >
          {{ bgRemoving ? t('shared.imageUploader.processing') : t('shared.imageUploader.removeBg') }}
        </button>
        <button type="button" class="btn-remove" @click="removeImage">{{ t('shared.imageUploader.removeImage') }}</button>
      </div>
    </div>

    <!-- Upload zone -->
    <div class="upload-zone" :class="{ uploading }" @click="fileInput?.click()">
      <span v-if="uploading" class="upload-status">
        <span class="upload-progress-bar">
          <span class="upload-progress-fill" :style="{ width: `${progress}%` }" />
        </span>
        {{ t('shared.imageUploader.uploading', { n: progress }) }}
      </span>
      <span v-else class="upload-cta">
        {{ currentUrl ? t('shared.imageUploader.changeImage') : t('shared.imageUploader.uploadImage') }}
        <span class="upload-hint">{{ t('shared.imageUploader.hint') }}</span>
      </span>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input-hidden"
      @change="onFileChange"
    >

    <p v-if="localError" class="uploader-error" role="alert" aria-live="assertive">{{ localError }}</p>
  </div>
</template>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.uploader-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-700, var(--color-gray-700));
}

.recommendations {
  margin: 0;
  padding: 0.625rem 0.75rem;
  background: var(--color-sky-50);
  border: 1px solid var(--color-sky-200);
  border-radius: var(--border-radius);
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recommendations li {
  font-size: var(--font-size-sm);
  color: var(--color-sky-700);
  padding-left: 0.875rem;
  position: relative;
}

.recommendations li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--color-sky-400);
}

.preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-box {
  padding: 0.75rem;
  border: 1px dashed var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 5rem;
}

/* Dark logo preview uses dark bg */
.preview-box.logo-dark-preview {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
  min-height: 5rem;
}

.preview-box.favicon-preview {
  min-height: 3.5rem;
}

.preview-box.cover-preview,
.preview-box.og-preview {
  min-height: 8.75rem;
}

.preview-img {
  max-width: 100%;
  object-fit: contain;
}

.preview-box.logo-preview .preview-img,
.preview-box.logo-dark-preview .preview-img {
  max-height: 3.5rem;
}

.preview-box.favicon-preview .preview-img {
  max-height: 2rem;
  max-width: 2rem;
}

.preview-box.cover-preview .preview-img,
.preview-box.og-preview .preview-img {
  max-height: 8.75rem;
  width: 100%;
  object-fit: cover;
  border-radius: var(--border-radius);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-bg-removal {
  background: none;
  border: 1px solid var(--color-purple-600);
  color: var(--color-purple-600);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  transition:
    background 0.15s,
    color 0.15s;
  min-height: 2rem;
}

.btn-bg-removal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (hover: hover) {
  .btn-bg-removal:not(:disabled):hover {
    background: var(--color-purple-600);
    color: white;
  }
}

.btn-remove {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

@media (hover: hover) {
  .btn-remove:hover {
    color: var(--color-error);
  }
}

.upload-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.125rem dashed var(--color-gray-300);
  border-radius: var(--border-radius);
  padding: 1rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  min-height: 4rem;
  text-align: center;
}

.upload-zone:not(.uploading):focus,
.upload-zone:not(.uploading):active {
  border-color: var(--color-primary);
  background: var(--color-success-bg, var(--color-success-bg));
}

@media (hover: hover) {
  .upload-zone:not(.uploading):hover {
    border-color: var(--color-primary);
    background: var(--color-success-bg, var(--color-success-bg));
  }
}

.upload-zone.uploading {
  cursor: default;
  border-color: var(--color-blue-300);
  background: var(--color-blue-50);
}

.upload-cta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
}

.upload-hint {
  font-size: var(--font-size-xs);
  font-weight: 400;
  color: var(--text-disabled);
}

.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-sm);
  color: var(--color-info);
  width: 100%;
}

.upload-progress-bar {
  width: 100%;
  max-width: 12.5rem;
  height: 0.375rem;
  background: var(--color-info-bg, var(--color-info-bg));
  border-radius: 6.1875rem;
  overflow: hidden;
}

.upload-progress-fill {
  display: block;
  height: 100%;
  background: var(--color-info);
  border-radius: 6.1875rem;
  transition: width 0.2s;
}

.file-input-hidden {
  display: none;
}

.uploader-error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-error);
}
</style>
