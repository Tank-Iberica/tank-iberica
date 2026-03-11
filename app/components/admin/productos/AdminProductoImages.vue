<script setup lang="ts">
interface Image {
  id: string
  url: string
  position: number
}

interface Props {
  images: Image[]
  uploading: boolean
  cloudinaryUploading: boolean
  cloudinaryProgress: number
}

interface Emits {
  (e: 'upload', event: Event): void
  (e: 'delete', id: string): void
  (e: 'set-portada', index: number): void
  (e: 'move', index: number, dir: 'up' | 'down'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="section">
    <div class="section-title">Imágenes ({{ images.length }}/10)</div>
    <label for="image-upload-input" class="upload-zone-label">
      {{ uploading ? 'Subiendo...' : '📷 Subir imágenes' }}
      <input
        id="image-upload-input"
        type="file"
        accept="image/*"
        multiple
        :disabled="uploading"
        @change="emit('upload', $event)"
      >
    </label>
    <div v-if="cloudinaryUploading" class="upload-progress">
      <div class="progress-bar" :style="{ width: cloudinaryProgress + '%' }" />
      <span>{{ cloudinaryProgress }}%</span>
    </div>
    <div v-if="images.length" class="img-grid">
      <div
        v-for="(img, idx) in images"
        :key="img.id"
        class="img-item"
        :class="{ cover: idx === 0 }"
      >
        <img :src="img.url" :alt="`Imagen ${idx + 1}`" >
        <div class="img-overlay">
          <div class="img-actions">
            <button v-if="idx !== 0" title="Portada" @click="emit('set-portada', idx)">⭐</button>
            <button v-if="idx > 0" title="Mover arriba" @click="emit('move', idx, 'up')">↑</button>
            <button
              v-if="idx < images.length - 1"
              title="Mover abajo"
              @click="emit('move', idx, 'down')"
            >
              ↓
            </button>
            <button class="del" :aria-label="$t('common.delete')" @click="emit('delete', img.id)">
              ×
            </button>
          </div>
        </div>
        <span v-if="idx === 0" class="cover-badge">PORTADA</span>
      </div>
    </div>
    <p v-else class="empty-msg">Sin imágenes. Sube hasta 10 imágenes.</p>
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
.upload-zone-label {
  display: block;
  width: 100%;
  padding: var(--spacing-4);
  text-align: center;
  background: var(--color-gray-50);
  border: 2px dashed var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-gray-500);
  margin-bottom: var(--spacing-3);
}
.upload-zone-label:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}
.upload-zone-label input[type='file'] {
  display: none;
}
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
.img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-2);
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
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: var(--spacing-4);
}

@media (max-width: 48em) {
  .img-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
