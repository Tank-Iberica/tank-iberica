<script setup lang="ts">
defineProps<{
  imageUrl: string | null
  imagePreviewUrl: string | null
  uploadingImage: boolean
  uploadProgress: number
  uploadError: string | null
}>()

defineEmits<{
  fileChange: [event: Event]
  removeImage: []
  'update:imageUrl': [url: string | null]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Imagen destacada</div>

    <!-- Upload from file -->
    <div class="image-upload-area">
      <label class="upload-zone" :class="{ uploading: uploadingImage }">
        <input
          type="file"
          accept="image/*"
          class="file-input-hidden"
          :disabled="uploadingImage"
          @change="$emit('fileChange', $event)"
        >
        <template v-if="uploadingImage">
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }" />
          </div>
          <span class="upload-text">Subiendo... {{ uploadProgress }}%</span>
        </template>
        <template v-else>
          <svg
            class="upload-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span class="upload-text">Seleccionar imagen</span>
          <span class="upload-hint">JPG, PNG, WebP (max 10MB)</span>
        </template>
      </label>
    </div>

    <!-- Or URL -->
    <div class="field">
      <label>O pegar URL</label>
      <input
        :value="imageUrl"
        type="url"
        class="input"
        placeholder="https://res.cloudinary.com/..."
        @input="$emit('update:imageUrl', ($event.target as HTMLInputElement).value || null)"
      >
    </div>

    <!-- Upload error -->
    <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>

    <!-- Preview -->
    <div v-if="imageUrl || imagePreviewUrl" class="image-preview-container">
      <img
        :src="imageUrl || imagePreviewUrl || ''"
        alt="Preview"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      >
      <button class="remove-image-btn" title="Eliminar imagen" @click="$emit('removeImage')">
        &times;
      </button>
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

/* Image upload */
.image-upload-area {
  margin-bottom: 12px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed var(--color-gray-200);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.upload-zone:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}
.upload-zone.uploading {
  cursor: default;
  border-color: var(--text-disabled);
}

.file-input-hidden {
  display: none;
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: var(--text-disabled);
}

.upload-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.upload-hint {
  font-size: 0.7rem;
  color: var(--text-disabled);
}

.upload-progress-bar {
  width: 100%;
  max-width: 200px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.2s;
}

.upload-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-radius: 6px;
  font-size: 0.8rem;
}

/* Image preview */
.image-preview-container {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  max-height: 200px;
  position: relative;
}

.image-preview-container img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  max-height: 200px;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.remove-image-btn:hover {
  background: var(--color-error);
}
</style>
