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
  border-radius: var(--border-radius);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
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
  margin-bottom: var(--spacing-3);
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6);
  border: 2px dashed var(--color-gray-200);
  border-radius: var(--border-radius);
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
  width: 2rem;
  height: 2rem;
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
  max-width: 12.5rem;
  height: 0.375rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-sm);
  transition: width 0.2s;
}

.upload-error {
  margin-top: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
}

/* Image preview */
.image-preview-container {
  margin-top: var(--spacing-2);
  border-radius: var(--border-radius);
  overflow: hidden;
  max-height: 12.5rem;
  position: relative;
}

.image-preview-container img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  max-height: 12.5rem;
}

.remove-image-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.75rem;
  height: 1.75rem;
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
