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
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>Detalles del Anunciante</h3>
          <button class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div v-if="advertisement" class="detail-grid">
            <!-- Contact Info -->
            <div class="detail-section">
              <h4>Contacto</h4>
              <p><strong>Nombre:</strong> {{ advertisement.contact_name }}</p>
              <p v-if="advertisement.contact_phone">
                <strong>Teléfono:</strong> {{ advertisement.contact_phone }}
              </p>
              <p v-if="advertisement.contact_email">
                <strong>Email:</strong> {{ advertisement.contact_email }}
              </p>
              <p v-if="advertisement.location">
                <strong>Ubicación:</strong> {{ advertisement.location }}
              </p>
            </div>

            <!-- Vehicle Info -->
            <div class="detail-section">
              <h4>Vehículo</h4>
              <p v-if="advertisement.subcategory || advertisement.type">
                <strong>Clasificación:</strong>
                {{ localizedName(advertisement.subcategory, locale) || ''
                }}{{ advertisement.subcategory && advertisement.type ? ' > ' : ''
                }}{{ localizedName(advertisement.type, locale) || '' }}
              </p>
              <p v-else-if="advertisement.vehicle_type">
                <strong>Tipo:</strong> {{ advertisement.vehicle_type }}
              </p>
              <p v-if="advertisement.brand"><strong>Marca:</strong> {{ advertisement.brand }}</p>
              <p v-if="advertisement.model"><strong>Modelo:</strong> {{ advertisement.model }}</p>
              <p v-if="advertisement.year"><strong>Año:</strong> {{ advertisement.year }}</p>
              <p v-if="advertisement.kilometers">
                <strong>Kilómetros:</strong>
                {{ advertisement.kilometers.toLocaleString('es-ES') }} km
              </p>
              <p v-if="advertisement.price">
                <strong>Precio:</strong> {{ formatPrice(advertisement.price) }}
              </p>
              <p v-if="advertisement.contact_preference">
                <strong>Preferencia contacto:</strong>
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
              <h4>Características</h4>
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
              <h4>Descripción</h4>
              <p class="description-text">{{ advertisement.description }}</p>
            </div>

            <!-- Photos -->
            <div v-if="advertisement.photos?.length" class="detail-section full-width">
              <h4>Fotos ({{ advertisement.photos.length }})</h4>
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
              <h4>Notas del Admin</h4>
              <textarea
                :value="notes"
                rows="3"
                placeholder="Añade notas internas sobre este anunciante..."
                @input="onNotesInput"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cerrar</button>
          <button class="btn-primary" :disabled="saving" @click="emit('save')">
            {{ saving ? 'Guardando...' : 'Guardar Notas' }}
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
  padding: 20px;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-medium {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
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
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  bottom: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.detail-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-section p {
  margin: 0 0 8px 0;
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
  gap: 8px;
}

.characteristic-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 6px;
  font-size: 0.9rem;
}

.char-label {
  color: #6b7280;
  text-transform: capitalize;
}

.char-value {
  font-weight: 500;
  color: #111827;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photos-grid img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 6px;
}

.detail-section textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
}

.detail-section textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
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
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
