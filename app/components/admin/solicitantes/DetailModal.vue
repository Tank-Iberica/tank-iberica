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

function hasTypeField(demand: AdminDemand): boolean {
  return !!(demand as unknown as Record<string, unknown>).type
}

function onNotesInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:notes', target.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modal.show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>Detalles del Solicitante</h3>
          <button class="modal-close" @click="emit('close')">×</button>
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

/* Detail grid */
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

/* Buttons */
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

  .characteristics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
