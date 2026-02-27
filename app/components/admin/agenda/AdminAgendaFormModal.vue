<script setup lang="ts">
import { CONTACT_TYPES, type ContactFormData } from '~/composables/admin/useAdminAgenda'

defineProps<{
  visible: boolean
  isEditing: boolean
  formData: ContactFormData
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'submit'): void
  (e: 'update:field', field: keyof ContactFormData, value: string): void
}>()

function onInput(field: keyof ContactFormData, event: Event) {
  emit('update:field', field, (event.target as HTMLInputElement).value)
}

function onSelectChange(event: Event) {
  emit('update:field', 'contact_type', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar contacto' : 'Nuevo contacto' }}</h3>
          <button class="modal-close" @click="emit('close')">&#xD7;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tipo *</label>
            <select :value="formData.contact_type" @change="onSelectChange">
              <option v-for="ct in CONTACT_TYPES" :key="ct.value" :value="ct.value">
                {{ ct.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Empresa</label>
            <input
              type="text"
              :value="formData.company"
              placeholder="Nombre de la empresa"
              @input="onInput('company', $event)"
            >
          </div>
          <div class="form-group">
            <label>Nombre de contacto *</label>
            <input
              type="text"
              :value="formData.contact_name"
              placeholder="Nombre y apellidos"
              @input="onInput('contact_name', $event)"
            >
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Telefono</label>
              <input
                type="tel"
                :value="formData.phone"
                placeholder="+34 600 000 000"
                @input="onInput('phone', $event)"
              >
            </div>
            <div class="form-group half">
              <label>Email</label>
              <input
                type="email"
                :value="formData.email"
                placeholder="email@empresa.com"
                @input="onInput('email', $event)"
              >
            </div>
          </div>
          <div class="form-group">
            <label>Ubicacion</label>
            <input
              type="text"
              :value="formData.location"
              placeholder="Ciudad, pais"
              @input="onInput('location', $event)"
            >
          </div>
          <div class="form-group">
            <label>Producto/s que maneja</label>
            <input
              type="text"
              :value="formData.products"
              placeholder="Camiones, furgonetas, gruas..."
              @input="onInput('products', $event)"
            >
          </div>
          <div class="form-group">
            <label>Notas</label>
            <textarea
              rows="3"
              :value="formData.notes"
              placeholder="Notas internas..."
              @input="onInput('notes', $event)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button
            class="btn-primary"
            :disabled="saving || !formData.contact_name.trim()"
            @click="emit('submit')"
          >
            {{ saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear' }}
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
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-md {
  max-width: 540px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-group.half {
  width: 100%;
}

@media (min-width: 480px) {
  .form-row {
    flex-direction: row;
    gap: 16px;
  }

  .form-group.half {
    width: calc(50% - 8px);
  }
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1a3238;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
</style>
