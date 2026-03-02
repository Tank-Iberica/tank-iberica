<script setup lang="ts">
import { MAX_PHOTOS } from '~/composables/modals/useAdvertiseModal'

defineProps<{
  photos: File[]
  photoPreviews: string[]
  techSheet: File | null
  techSheetPreview: string
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'photo-select' | 'tech-sheet-select', event: Event): void
  (e: 'remove-photo', index: number): void
  (e: 'remove-tech-sheet'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="section-fields--stacked">
    <!-- Vehicle photos -->
    <div class="upload-block">
      <label class="required">
        {{ t('advertise.photos') }}
        <span class="photos-count">({{ photos.length }}/{{ MAX_PHOTOS }})</span>
      </label>

      <label
        v-if="photos.length < MAX_PHOTOS"
        class="upload-area"
        :class="{ 'upload-error': errors.photos }"
      >
        <svg
          class="upload-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span class="upload-main-text">{{ t('advertise.dragOrClick') }}</span>
        <strong class="upload-required-text">{{ t('advertise.photosRequired') }}</strong>
        <input
          type="file"
          accept="image/*"
          multiple
          class="sr-only"
          @change="emit('photo-select', $event)"
        >
      </label>

      <div class="photo-recommendations">
        <strong>{{ t('advertise.photoRecommendations') }}</strong>
        <ul>
          <li>{{ t('advertise.photoRec1') }}</li>
          <li>{{ t('advertise.photoRec2') }}</li>
          <li>{{ t('advertise.photoRec3') }}</li>
          <li>{{ t('advertise.photoRec4') }}</li>
          <li>{{ t('advertise.photoRec5') }}</li>
        </ul>
      </div>

      <div v-if="photoPreviews.length" class="photo-grid">
        <div v-for="(preview, i) in photoPreviews" :key="i" class="photo-thumb">
          <img :src="preview" :alt="t('advertise.photos') + ' ' + (i + 1)" >
          <button type="button" class="photo-remove" @click="emit('remove-photo', i)">
            &times;
          </button>
        </div>
      </div>

      <p v-if="errors.photos" class="field-error">{{ t('advertise.minPhotosError') }}</p>
    </div>

    <!-- Technical sheet -->
    <div class="upload-block">
      <label class="required">{{ t('advertise.techSheet') }}</label>

      <label
        v-if="!techSheet"
        class="upload-area upload-area--compact"
        :class="{ 'upload-error': errors.techSheet }"
      >
        <svg
          class="upload-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span class="upload-main-text">{{ t('advertise.dragOrClickSingle') }}</span>
        <strong class="upload-required-text">{{ t('advertise.techSheetHint') }}</strong>
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          @change="emit('tech-sheet-select', $event)"
        >
      </label>

      <div v-if="techSheetPreview" class="tech-sheet-preview">
        <img :src="techSheetPreview" :alt="t('advertise.techSheet')" >
        <button type="button" class="photo-remove" @click="emit('remove-tech-sheet')">
          &times;
        </button>
      </div>

      <p class="privacy-note">{{ t('advertise.techSheetPrivacy') }}</p>
      <p v-if="errors.techSheet" class="field-error">{{ t('advertise.techSheetError') }}</p>
    </div>
  </div>
</template>

<style scoped>
.section-fields--stacked {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 12px);
}

.upload-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 8px);
}

.upload-block > label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.required::after {
  content: ' *';
  color: var(--color-error);
}

.photos-count {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4, 16px);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius, 8px);
  background: var(--bg-primary);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  text-align: center;
  gap: 2px;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: #f0f4f5;
}

.upload-area--compact {
  padding: var(--spacing-3, 12px);
}

.upload-error {
  border-color: var(--color-error);
}

.upload-icon {
  width: 28px;
  height: 28px;
  color: var(--color-primary);
  margin-bottom: 2px;
}

.upload-main-text {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.upload-required-text {
  font-size: 0.8rem;
  color: var(--color-primary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.photo-recommendations {
  background: var(--bg-primary);
  border-radius: 6px;
  padding: var(--spacing-2, 8px) var(--spacing-3, 12px);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.photo-recommendations strong {
  color: var(--color-text);
  display: block;
  margin-bottom: 2px;
  font-size: 0.8rem;
}

.photo-recommendations ul {
  margin: 0;
  padding-left: var(--spacing-4, 16px);
}

.photo-recommendations li {
  margin-bottom: 1px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2, 8px);
}

.photo-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  transition: background 0.2s;
}

.photo-remove:hover {
  background: rgba(239, 68, 68, 0.9);
}

.tech-sheet-preview {
  position: relative;
  max-width: 160px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.tech-sheet-preview img {
  width: 100%;
  display: block;
}

.privacy-note {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 0;
}

.field-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin: 2px 0 0;
}

@media (min-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
