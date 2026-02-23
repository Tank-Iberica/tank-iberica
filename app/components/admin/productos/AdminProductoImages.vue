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
            <button class="del" title="Eliminar" @click="emit('delete', img.id)">×</button>
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
  background: #fff;
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
.upload-zone-label {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 12px;
}
.upload-zone-label:hover {
  border-color: #23424a;
  background: #f3f4f6;
}
.upload-zone-label input[type='file'] {
  display: none;
}
.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.upload-progress .progress-bar {
  flex: 1;
  height: 6px;
  background: #23424a;
  border-radius: 3px;
  transition: width 0.2s;
}
.upload-progress span {
  font-size: 0.7rem;
  color: #6b7280;
}
.img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.img-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
}
.img-item.cover {
  border-color: #23424a;
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
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}
.img-actions button.del {
  background: #fee2e2;
  color: #dc2626;
}
.cover-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: #23424a;
  color: #fff;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}
.empty-msg {
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 16px;
}

@media (max-width: 768px) {
  .img-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
