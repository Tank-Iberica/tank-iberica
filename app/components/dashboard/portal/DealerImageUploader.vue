<script setup lang="ts">
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'

const props = defineProps<{
  modelValue: string
  label: string
  folder: string
  recommendations: string[]
  previewClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { upload, uploading, progress, error: uploadError } = useCloudinaryUpload()
const localError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

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
  // Reset input so same file can be re-uploaded
  if (fileInput.value) fileInput.value.value = ''
}

function removeImage() {
  emit('update:modelValue', '')
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
      <button type="button" class="btn-remove" @click="removeImage">Eliminar imagen</button>
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

    <!-- Error -->
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
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-box.logo-preview {
  min-height: 80px;
}

.preview-box.favicon-preview {
  min-height: 56px;
}

.preview-box.cover-preview {
  min-height: 120px;
}

.preview-img {
  max-width: 100%;
  object-fit: contain;
}

.preview-box.logo-preview .preview-img {
  max-height: 56px;
}

.preview-box.favicon-preview .preview-img {
  max-height: 32px;
  max-width: 32px;
}

.preview-box.cover-preview .preview-img {
  max-height: 120px;
  width: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.btn-remove {
  align-self: flex-start;
  background: none;
  border: none;
  color: #ef4444;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

@media (hover: hover) {
  .btn-remove:hover {
    color: #b91c1c;
  }
}

.upload-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #cbd5e1;
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
  border-color: var(--color-primary, #23424a);
  background: #f0fdf4;
}

@media (hover: hover) {
  .upload-zone:not(.uploading):hover {
    border-color: var(--color-primary, #23424a);
    background: #f0fdf4;
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
  color: var(--color-primary, #23424a);
}

.upload-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8;
}

.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #3b82f6;
  width: 100%;
}

.upload-progress-bar {
  width: 100%;
  max-width: 200px;
  height: 6px;
  background: #dbeafe;
  border-radius: 99px;
  overflow: hidden;
}

.upload-progress-fill {
  display: block;
  height: 100%;
  background: #3b82f6;
  border-radius: 99px;
  transition: width 0.2s;
}

.file-input-hidden {
  display: none;
}

.uploader-error {
  margin: 0;
  font-size: 0.8rem;
  color: #ef4444;
}
</style>
