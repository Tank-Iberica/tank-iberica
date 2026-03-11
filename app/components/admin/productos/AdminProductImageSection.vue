<script setup lang="ts">
import type { PendingImage } from '~/composables/admin/useAdminProductForm'

defineProps<{
  pendingImages: PendingImage[]
  uploadingImages: boolean
  cloudinaryUploading: boolean
  cloudinaryProgress: number
}>()

const emit = defineEmits<{
  select: [event: Event]
  remove: [id: string]
  move: [index: number, direction: 'up' | 'down']
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Imágenes ({{ pendingImages.length }}/10)</div>
    <label for="image-upload-input" class="upload-zone-label">
      📷 Seleccionar imágenes
      <input
        id="image-upload-input"
        type="file"
        accept="image/*"
        multiple
        @change="emit('select', $event)"
      />
    </label>
    <div v-if="cloudinaryUploading" class="upload-progress">
      <div class="progress-bar" :style="{ width: cloudinaryProgress + '%' }" />
      <span>{{ cloudinaryProgress }}%</span>
    </div>
    <div v-if="pendingImages.length" class="img-grid">
      <div
        v-for="(img, idx) in pendingImages"
        :key="img.id"
        class="img-item"
        :class="{ cover: idx === 0 }"
      >
        <img :src="img.previewUrl" :alt="`Imagen ${idx + 1}`" />
        <div class="img-overlay">
          <div class="img-actions">
            <button
              v-if="idx > 0"
              type="button"
              title="Mover arriba"
              @click="emit('move', idx, 'up')"
            >
              ↑
            </button>
            <button
              v-if="idx < pendingImages.length - 1"
              type="button"
              title="Mover abajo"
              @click="emit('move', idx, 'down')"
            >
              ↓
            </button>
            <button type="button" class="del" :aria-label="$t('common.delete')" @click="emit('remove', img.id)">
              ×
            </button>
          </div>
        </div>
        <span v-if="idx === 0" class="cover-badge">PORTADA</span>
      </div>
    </div>
    <p v-if="pendingImages.length" class="img-hint">
      Las imágenes se subirán al guardar el {{ $t('vertical.itemName') }}
    </p>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-3) var(--spacing-4);
  box-shadow: var(--shadow-xs);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Upload zone */
.upload-zone-label {
  display: block;
  width: 100%;
  padding: var(--spacing-3);
  text-align: center;
  background: var(--color-gray-50);
  border: 2px dashed var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  margin-bottom: 0.625rem;
}
.upload-zone-label:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}
.upload-zone-label input[type='file'] {
  display: none;
}

/* Upload progress bar */
.upload-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: 0.625rem;
}
.upload-progress .progress-bar {
  flex: 1;
  height: 0.375rem;
  background: var(--color-primary);
  border-radius: var(--border-radius-sm);
  transition: width 0.2s;
}
.upload-progress span {
  font-size: 0.7rem;
  color: var(--color-gray-500);
}

/* Image grid */
.img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}
.img-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 2px solid transparent;
}
.img-item.cover {
  border-color: var(--color-primary);
}
.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s;
}
.img-item:hover .img-overlay {
  opacity: 1;
}
.img-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: var(--spacing-1);
}
.img-actions button {
  width: 1.625rem;
  height: 1.625rem;
  border: none;
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
}
.img-actions button.del {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}
.cover-badge {
  position: absolute;
  bottom: 0.25rem;
  left: 0.25rem;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 0.6rem;
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
}
.img-hint {
  margin-top: var(--spacing-2);
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-align: center;
}

@media (max-width: 48em) {
  .img-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
