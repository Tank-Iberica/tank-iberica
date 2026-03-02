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
      >
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
        <img :src="img.previewUrl" :alt="`Imagen ${idx + 1}`" >
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
            <button type="button" class="del" title="Eliminar" @click="emit('remove', img.id)">
              ×
            </button>
          </div>
        </div>
        <span v-if="idx === 0" class="cover-badge">PORTADA</span>
      </div>
    </div>
    <p v-if="pendingImages.length" class="img-hint">
      Las imágenes se subirán al guardar el vehículo
    </p>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Upload zone */
.upload-zone-label {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed var(--border-color-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 10px;
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
  gap: 8px;
  margin-bottom: 10px;
}
.upload-progress .progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.2s;
}
.upload-progress span {
  font-size: 0.7rem;
  color: #6b7280;
}

/* Image grid */
.img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
}
.img-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 6px;
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
  gap: 4px;
}
.img-actions button {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--bg-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}
.img-actions button.del {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}
.cover-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}
.img-hint {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

@media (max-width: 768px) {
  .img-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
