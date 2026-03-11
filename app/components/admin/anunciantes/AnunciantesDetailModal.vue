<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'
import { localizedName } from '~/composables/useLocalized'
import type { AdminAdvertisement } from '~/composables/admin/useAdminAnunciantes'

defineProps<{
  show: boolean
  advertisement: AdminAdvertisement | null
  notes: string
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'save'): void
  (e: 'update-notes', notes: string): void
}>()

const { locale } = useI18n()

function onNotesInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update-notes', target.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>{{ $t('admin.anunciantes.detailTitle') }}</h3>
          <button class="modal-close" :aria-label="$t('common.close')" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div v-if="advertisement" class="detail-grid">
            <!-- Contact Info -->
            <div class="detail-section">
              <h4>{{ $t('admin.anunciantes.sectionContact') }}</h4>
              <p><strong>{{ $t('admin.anunciantes.labelName') }}</strong> {{ advertisement.contact_name }}</p>
              <p v-if="advertisement.contact_phone">
                <strong>{{ $t('admin.anunciantes.labelPhone') }}</strong> {{ advertisement.contact_phone }}
              </p>
              <p v-if="advertisement.contact_email">
                <strong>{{ $t('admin.anunciantes.labelEmail') }}</strong> {{ advertisement.contact_email }}
              </p>
              <p v-if="advertisement.location">
                <strong>{{ $t('admin.anunciantes.labelLocation') }}</strong> {{ advertisement.location }}
              </p>
            </div>

            <!-- Vehicle Info -->
            <div class="detail-section">
              <h4>{{ $t('admin.anunciantes.sectionVehicle') }}</h4>
              <p v-if="advertisement.subcategory || advertisement.type">
                <strong>{{ $t('admin.anunciantes.labelClassification') }}</strong>
                {{ localizedName(advertisement.subcategory, locale) || ''
                }}{{ advertisement.subcategory && advertisement.type ? ' > ' : ''
                }}{{ localizedName(advertisement.type, locale) || '' }}
              </p>
              <p v-else-if="advertisement.vehicle_type">
                <strong>{{ $t('admin.anunciantes.labelType') }}</strong> {{ advertisement.vehicle_type }}
              </p>
              <p v-if="advertisement.brand"><strong>{{ $t('admin.anunciantes.labelBrand') }}</strong> {{ advertisement.brand }}</p>
              <p v-if="advertisement.model"><strong>{{ $t('admin.anunciantes.labelModel') }}</strong> {{ advertisement.model }}</p>
              <p v-if="advertisement.year"><strong>{{ $t('admin.anunciantes.labelYear') }}</strong> {{ advertisement.year }}</p>
              <p v-if="advertisement.kilometers">
                <strong>{{ $t('admin.anunciantes.labelKilometers') }}</strong>
                {{ advertisement.kilometers.toLocaleString('es-ES') }} km
              </p>
              <p v-if="advertisement.price">
                <strong>{{ $t('admin.anunciantes.labelPrice') }}</strong> {{ formatPrice(advertisement.price) }}
              </p>
              <p v-if="advertisement.contact_preference">
                <strong>{{ $t('admin.anunciantes.labelContactPreference') }}</strong>
                {{ advertisement.contact_preference }}
              </p>
            </div>

            <!-- Characteristics (attributes_json) -->
            <div
              v-if="
                advertisement.attributes_json && Object.keys(advertisement.attributes_json).length
              "
              class="detail-section full-width"
            >
              <h4>{{ $t('admin.anunciantes.sectionCharacteristics') }}</h4>
              <div class="characteristics-grid">
                <div
                  v-for="(value, key) in advertisement.attributes_json"
                  :key="key"
                  class="characteristic-item"
                >
                  <span class="char-label">{{ key }}</span>
                  <span class="char-value">{{ value }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="advertisement.description" class="detail-section full-width">
              <h4>{{ $t('common.description') }}</h4>
              <p class="description-text">{{ advertisement.description }}</p>
            </div>

            <!-- Photos -->
            <div v-if="advertisement.photos?.length" class="detail-section full-width">
              <h4>{{ $t('admin.anunciantes.sectionPhotos', { count: advertisement.photos.length }) }}</h4>
              <div class="photos-grid">
                <img
                  v-for="(photo, index) in advertisement.photos"
                  :key="index"
                  :src="photo"
                  :alt="
                    `${advertisement.brand || ''} ${advertisement.model || ''} - Foto ${index + 1}`.trim()
                  "
                >
              </div>
            </div>

            <!-- Admin Notes -->
            <div class="detail-section full-width">
              <h4>{{ $t('admin.anunciantes.adminNotes') }}</h4>
              <textarea
                :value="notes"
                rows="3"
                :placeholder="$t('admin.anunciantes.adminNotesPlaceholder')"
                @input="onNotesInput"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.close') }}</button>
          <button class="btn-primary" :disabled="saving" @click="emit('save')">
            {{ saving ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-5);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-medium {
  max-width: 37.5em;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-gray-500);
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  position: sticky;
  bottom: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-6);
}

.detail-section {
  background: var(--color-gray-50);
  padding: var(--spacing-4);
  border-radius: var(--border-radius);
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section h4 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: 0.9rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-section p {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 0.95rem;
}

.detail-section p:last-child {
  margin-bottom: 0;
}

.description-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

.characteristics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
}

.characteristic-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
}

.char-label {
  color: var(--color-gray-500);
  text-transform: capitalize;
}

.char-value {
  font-weight: 500;
  color: var(--color-gray-900);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2);
}

.photos-grid img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: var(--border-radius);
}

.detail-section textarea {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  resize: vertical;
  min-height: 5rem;
}

.detail-section textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
}

@media (max-width: 48em) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
