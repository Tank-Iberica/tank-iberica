<script setup lang="ts">
import type { VehicleImage } from '~/composables/admin/useAdminVehicleDetail'

defineProps<{
  images: VehicleImage[]
}>()

const emit = defineEmits<{
  (e: 'upload', event: Event): void
  (e: 'remove' | 'drag-start' | 'drop', index: number): void
}>()
</script>

<template>
  <section class="form-section">
    <h2 class="section-title">Imágenes</h2>
    <div class="images-grid">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="image-item"
        draggable="true"
        @dragstart="emit('drag-start', index)"
        @dragover.prevent
        @drop="emit('drop', index)"
      >
        <img :src="image.thumbnail_url || image.url" :alt="`Imagen ${index + 1}`" >
        <button type="button" class="image-delete" @click="emit('remove', index)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <span class="image-position">{{ index + 1 }}</span>
      </div>
      <label v-if="images.length < 10" class="image-upload">
        <input type="file" accept="image/*" multiple @change="emit('upload', $event)" >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Añadir imagen</span>
      </label>
    </div>
    <p class="field-hint">Máximo 10 imágenes. Arrastra para reordenar.</p>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--border-color);
}

.field-hint {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin-top: var(--spacing-2);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-3);
}

.image-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: grab;
}

.image-item:active {
  cursor: grabbing;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-delete {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--border-radius-sm);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.image-item:hover .image-delete {
  opacity: 1;
}

.image-delete svg {
  width: 14px;
  height: 14px;
}

.image-position {
  position: absolute;
  bottom: var(--spacing-1);
  left: var(--spacing-1);
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--border-radius-sm);
  color: white;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/3;
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
  gap: var(--spacing-1);
  transition: all var(--transition-fast);
}

.image-upload:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.image-upload input {
  display: none;
}

.image-upload svg {
  width: 24px;
  height: 24px;
}
</style>
