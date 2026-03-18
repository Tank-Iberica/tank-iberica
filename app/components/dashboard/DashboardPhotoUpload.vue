<script setup lang="ts">
import { useCloudinaryUpload, type CloudinaryUploadResult } from '~/composables/admin/useCloudinaryUpload'

export interface UploadedPhoto {
  id: string
  url: string
  publicId: string
  width: number
  height: number
}

const props = withDefaults(
  defineProps<{
    modelValue: UploadedPhoto[]
    maxPhotos?: number
    folder?: string
    vehicleSlug?: string
  }>(),
  { maxPhotos: 20, folder: 'tracciona/vehicles', vehicleSlug: '' },
)

const emit = defineEmits<{
  'update:modelValue': [photos: UploadedPhoto[]]
}>()

const { t } = useI18n()
const { upload, uploading, progress, error: uploadError } = useCloudinaryUpload()

const dragOver = ref(false)
const localError = ref<string | null>(null)

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const canAddMore = computed(() => props.modelValue.length < props.maxPhotos)

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return t('dashboard.vehicles.photoUploadInvalidType')
  }
  if (file.size > MAX_SIZE) {
    return t('dashboard.vehicles.photoUploadTooLarge')
  }
  return null
}

async function handleFiles(files: FileList | File[]) {
  localError.value = null
  const fileArray = Array.from(files)

  for (const file of fileArray) {
    if (!canAddMore.value) {
      localError.value = t('dashboard.vehicles.photoUploadLimitReached')
      break
    }

    const validationError = validateFile(file)
    if (validationError) {
      localError.value = validationError
      continue
    }

    const idx = props.modelValue.length + 1
    const publicId = props.vehicleSlug
      ? `${props.vehicleSlug}-${idx}`
      : undefined

    const result: CloudinaryUploadResult | null = await upload(file, {
      folder: props.folder,
      publicId,
    })

    if (result) {
      const photo: UploadedPhoto = {
        id: crypto.randomUUID(),
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      }
      emit('update:modelValue', [...props.modelValue, photo])
    } else if (uploadError.value) {
      localError.value = uploadError.value
    }
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  if (e.dataTransfer?.files.length) {
    handleFiles(e.dataTransfer.files)
  }
}

function onFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    handleFiles(target.files)
    target.value = '' // reset so same file can be re-selected
  }
}

function removePhoto(id: string) {
  emit('update:modelValue', props.modelValue.filter((p) => p.id !== id))
}

function movePhoto(fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= props.modelValue.length) return
  const photos = [...props.modelValue]
  const [moved] = photos.splice(fromIndex, 1)
  photos.splice(toIndex, 0, moved!)
  emit('update:modelValue', photos)
}

// --- Drag-and-drop reorder ---
const dragSrcIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number) {
  dragSrcIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDropPhoto(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragSrcIndex.value !== null && dragSrcIndex.value !== index) {
    movePhoto(dragSrcIndex.value, index)
  }
  dragSrcIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragSrcIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="photo-upload">
    <!-- Drop zone -->
    <label
      class="drop-zone"
      :class="{ 'drop-zone--active': dragOver, 'drop-zone--disabled': !canAddMore }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        class="sr-only"
        :disabled="!canAddMore || uploading"
        @change="onFileInput"
      >
      <div class="drop-zone__content">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span class="drop-zone__label">{{ t('dashboard.vehicles.photoUploadDrop') }}</span>
        <span class="drop-zone__hint">{{ t('dashboard.vehicles.photoUploadFormats') }}</span>
        <span class="drop-zone__count">
          {{ t('dashboard.vehicles.photoUploadLimit', { count: modelValue.length, max: maxPhotos }) }}
        </span>
      </div>
    </label>

    <!-- Upload progress -->
    <div v-if="uploading" class="upload-progress">
      <div class="upload-progress__bar" :style="{ width: `${progress}%` }" />
      <span class="upload-progress__text">{{ progress }}%</span>
    </div>

    <!-- Error -->
    <div v-if="localError" class="upload-error" role="alert" aria-live="assertive">{{ localError }}</div>

    <!-- Previews -->
    <div v-if="modelValue.length" class="photo-grid">
      <div
        v-for="(photo, index) in modelValue"
        :key="photo.id"
        class="photo-card"
        :class="{
          'photo-card--cover': index === 0,
          'photo-card--drag-over': dragOverIndex === index && dragSrcIndex !== index,
        }"
        draggable="true"
        :aria-label="t('dashboard.vehicles.photoUploadDragHint', { n: index + 1 })"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @dragleave="onDragLeave"
        @drop="onDropPhoto($event, index)"
        @dragend="onDragEnd"
      >
        <img :src="photo.url" :alt="`Photo ${index + 1}`" loading="lazy">
        <span v-if="index === 0" class="photo-card__badge">
          {{ t('dashboard.vehicles.photoUploadCover') }}
        </span>
        <div class="photo-card__actions">
          <button
            v-if="index > 0"
            class="photo-card__btn"
            :aria-label="t('common.back')"
            @click="movePhoto(index, index - 1)"
          >
            &larr;
          </button>
          <button
            v-if="index < modelValue.length - 1"
            class="photo-card__btn"
            :aria-label="t('common.continue')"
            @click="movePhoto(index, index + 1)"
          >
            &rarr;
          </button>
          <button
            class="photo-card__btn photo-card__btn--delete"
            :aria-label="t('dashboard.vehicles.photoUploadRemove')"
            @click="removePhoto(photo.id)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-upload {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  border: 0.125rem dashed var(--color-gray-300);
  border-radius: var(--border-radius-md);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  text-align: center;
}

.drop-zone:hover,
.drop-zone--active {
  border-color: var(--color-primary);
  background: var(--color-gray-50);
}

.drop-zone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-auxiliary);
}

.drop-zone__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.drop-zone__hint {
  font-size: var(--font-size-xs);
}

.drop-zone__count {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.upload-progress {
  position: relative;
  height: 0.5rem;
  background: var(--color-gray-200);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.upload-progress__bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.upload-progress__text {
  position: absolute;
  right: 0.5rem;
  top: -1.25rem;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.upload-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  padding: 0.5rem 0.75rem;
  background: var(--color-error-bg);
  border-radius: var(--border-radius-sm);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.photo-card {
  position: relative;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--color-gray-100);
  aspect-ratio: 4/3;
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-card--cover {
  grid-column: span 2;
}

.photo-card[draggable='true'] {
  cursor: grab;
}

.photo-card[draggable='true']:active {
  cursor: grabbing;
}

.photo-card--drag-over {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.photo-card__badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: white;
  background: var(--color-primary);
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.photo-card__actions {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.photo-card__btn {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.photo-card__btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.photo-card__btn--delete {
  background: rgba(239, 68, 68, 0.8);
  font-size: var(--font-size-lg);
}

.photo-card__btn--delete:hover {
  background: rgba(239, 68, 68, 1);
}

@media (min-width: 30em) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .photo-card--cover {
    grid-column: span 2;
  }
}
</style>
