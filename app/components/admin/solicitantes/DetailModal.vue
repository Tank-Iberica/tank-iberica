<script setup lang="ts">
import {
  type AdminDemand,
  type DetailModalState,
  getTypeLabel,
  formatPriceRange,
  formatYearRange,
} from '~/composables/admin/useAdminSolicitantes'

defineProps<{
  modal: DetailModalState
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'save'): void
  (e: 'update:notes', value: string): void
}>()

const { locale } = useI18n()

function hasTypeField(demand: AdminDemand): demand is AdminDemand & { type: unknown } {
  return !!(demand as unknown as Record<string, unknown>).type
}

function onNotesInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:notes', target.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modal.show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>Detalles del Solicitante</h3>
          <button class="modal-close" :aria-label="$t('common.close')" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modal.demand" class="detail-grid">
            <!-- Contact Info -->
            <div class="detail-section">
              <h4>Contacto</h4>
              <p><strong>Nombre:</strong> {{ modal.demand.contact_name }}</p>
              <p v-if="modal.demand.contact_phone">
                <strong>Teléfono:</strong> {{ modal.demand.contact_phone }}
              </p>
              <p v-if="modal.demand.contact_email">
                <strong>Email:</strong> {{ modal.demand.contact_email }}
              </p>
              <p v-if="modal.demand.location">
                <strong>Ubicación:</strong> {{ modal.demand.location }}
              </p>
              <p v-if="modal.demand.contact_preference">
                <strong>Preferencia:</strong> {{ modal.demand.contact_preference }}
              </p>
            </div>

            <!-- Classification -->
            <div class="detail-section">
              <h4>Clasificación</h4>
              <p v-if="modal.demand.subcategory || hasTypeField(modal.demand)">
                <strong>Tipo:</strong> {{ getTypeLabel(modal.demand, locale) }}
              </p>
              <p v-else-if="modal.demand.vehicle_type">
                <strong>Tipo:</strong> {{ modal.demand.vehicle_type }}
              </p>
              <p v-if="modal.demand.brand_preference">
                <strong>Marca preferida:</strong> {{ modal.demand.brand_preference }}
              </p>
              <p>
                <strong>Rango año:</strong>
                {{ formatYearRange(modal.demand.year_min, modal.demand.year_max) }}
              </p>
              <p>
                <strong>Rango precio:</strong>
                {{ formatPriceRange(modal.demand.price_min, modal.demand.price_max) }}
              </p>
            </div>

            <!-- Characteristics (attributes_json) -->
            <div
              v-if="
                modal.demand.attributes_json && Object.keys(modal.demand.attributes_json).length
              "
              class="detail-section full-width"
            >
              <h4>Características</h4>
              <div class="characteristics-grid">
                <div
                  v-for="(value, key) in modal.demand.attributes_json"
                  :key="key"
                  class="characteristic-item"
                >
                  <span class="char-label">{{ key }}</span>
                  <span class="char-value">{{ value }}</span>
                </div>
              </div>
            </div>

            <!-- Specs (legacy) -->
            <div
              v-if="modal.demand.specs && Object.keys(modal.demand.specs).length"
              class="detail-section full-width"
            >
              <h4>Especificaciones adicionales</h4>
              <div class="characteristics-grid">
                <div
                  v-for="(value, key) in modal.demand.specs"
                  :key="key"
                  class="characteristic-item"
                >
                  <span class="char-label">{{ key }}</span>
                  <span class="char-value">{{ value }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="modal.demand.description" class="detail-section full-width">
              <h4>Descripción</h4>
              <p class="description-text">{{ modal.demand.description }}</p>
            </div>

            <!-- Admin Notes -->
            <div class="detail-section full-width">
              <h4>Notas del Admin</h4>
              <textarea
                :value="modal.notes"
                rows="3"
                placeholder="Añade notas internas sobre este solicitante..."
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

/* Detail grid */
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

/* Buttons */
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

  .characteristics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
