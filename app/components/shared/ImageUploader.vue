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
      throw new Error('La eliminación de fondo no está disponible en tu cuenta de Cloudinary')
    emit('update:modelValue', transformedUrl)
  } catch (err: unknown) {
    localError.value = err instanceof Error ? err.message : 'Error eliminando fondo'
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
          {{ bgRemoving ? 'Procesando...' : '✦ Eliminar fondo' }}
        </button>
        <button type="button" class="btn-remove" @click="removeImage">Eliminar imagen</button>
      </div>
    </div>

    <!-- Upload zone -->
    <div class="upload-zone" :class="{ uploading }" @click="fileInput?.click()">
      <span v-if="uploading" class="upload-status">
        <span class="upload-progress-bar">
          <span class="upload-progress-fill" :style="{ width: `${progress}%` }" />
        </span>
        Subiendo... {{ progress }}%
      </span>
      <span v-else class="upload-cta">
        {{ currentUrl ? 'Cambiar imagen' : 'Subir imagen' }}
        <span class="upload-hint">PNG, JPG o WebP · Máx. 10 MB</span>
      </span>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input-hidden"
      @change="onFileChange"
    >

    <p v-if="localError" class="uploader-error">{{ localError }}</p>
  </div>
</template>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uploader-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700, #374151);
}

.recommendations {
  margin: 0;
  padding: 10px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recommendations li {
  font-size: 0.8rem;
  color: #0369a1;
  padding-left: 14px;
  position: relative;
}

.recommendations li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #38bdf8;
}

.preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-box {
  padding: 12px;
  border: 1px dashed var(--color-gray-200);
  border-radius: 8px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

/* Dark logo preview uses dark bg */
.preview-box.logo-dark-preview {
  background: #1f2937;
  border-color: #374151;
  min-height: 80px;
}

.preview-box.favicon-preview {
  min-height: 56px;
}

.preview-box.cover-preview,
.preview-box.og-preview {
  min-height: 140px;
}

.preview-img {
  max-width: 100%;
  object-fit: contain;
}

.preview-box.logo-preview .preview-img,
.preview-box.logo-dark-preview .preview-img {
  max-height: 56px;
}

.preview-box.favicon-preview .preview-img {
  max-height: 32px;
  max-width: 32px;
}

.preview-box.cover-preview .preview-img,
.preview-box.og-preview .preview-img {
  max-height: 140px;
  width: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-bg-removal {
  background: none;
  border: 1px solid #7c3aed;
  color: #7c3aed;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
  transition:
    background 0.15s,
    color 0.15s;
  min-height: 32px;
}

.btn-bg-removal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (hover: hover) {
  .btn-bg-removal:not(:disabled):hover {
    background: #7c3aed;
    color: white;
  }
}

.btn-remove {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: 0.8rem;
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
  border: 2px dashed var(--color-gray-300);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  min-height: 64px;
  text-align: center;
}

.upload-zone:not(.uploading):focus,
.upload-zone:not(.uploading):active {
  border-color: var(--color-primary);
  background: var(--color-success-bg, #dcfce7);
}

@media (hover: hover) {
  .upload-zone:not(.uploading):hover {
    border-color: var(--color-primary);
    background: var(--color-success-bg, #dcfce7);
  }
}

.upload-zone.uploading {
  cursor: default;
  border-color: #93c5fd;
  background: #eff6ff;
}

.upload-cta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
}

.upload-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-disabled);
}

.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-info);
  width: 100%;
}

.upload-progress-bar {
  width: 100%;
  max-width: 200px;
  height: 6px;
  background: var(--color-info-bg, #dbeafe);
  border-radius: 99px;
  overflow: hidden;
}

.upload-progress-fill {
  display: block;
  height: 100%;
  background: var(--color-info);
  border-radius: 99px;
  transition: width 0.2s;
}

.file-input-hidden {
  display: none;
}

.uploader-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-error);
}
</style>
