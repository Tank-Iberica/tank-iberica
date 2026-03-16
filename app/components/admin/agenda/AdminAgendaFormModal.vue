<script setup lang="ts">
import { CONTACT_TYPES, type ContactFormData } from '~/composables/admin/useAdminAgenda'

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  formData: ContactFormData
  saving: boolean
}>()

const { t } = useI18n()
const submitLabel = computed(() => {
  if (props.saving) return t('common.saving')
  return props.isEditing ? t('common.save') : t('common.create')
})

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
    <div
      v-if="visible"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>{{ isEditing ? $t('admin.agenda.editContact') : $t('admin.agenda.newContact') }}</h3>
          <button class="modal-close" @click="emit('close')">&#xD7;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('admin.agenda.typeLabel') }}</label>
            <select :value="formData.contact_type" @change="onSelectChange">
              <option v-for="ct in CONTACT_TYPES" :key="ct.value" :value="ct.value">
                {{ ct.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.agenda.company') }}</label>
            <input
              type="text"
              autocomplete="organization"
              :value="formData.company"
              :placeholder="$t('admin.agenda.companyPlaceholder')"
              @input="onInput('company', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ $t('admin.agenda.contactName') }}</label>
            <input
              type="text"
              autocomplete="name"
              :value="formData.contact_name"
              :placeholder="$t('admin.agenda.contactNamePlaceholder')"
              @input="onInput('contact_name', $event)"
            >
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>{{ $t('common.phone') }}</label>
              <input
                type="tel"
                autocomplete="tel"
                :value="formData.phone"
                placeholder="+34 600 000 000"
                @input="onInput('phone', $event)"
              >
            </div>
            <div class="form-group half">
              <label>{{ $t('common.email') }}</label>
              <input
                type="email"
                autocomplete="email"
                :value="formData.email"
                placeholder="email@empresa.com"
                @input="onInput('email', $event)"
              >
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('common.location') }}</label>
            <input
              type="text"
              :value="formData.location"
              :placeholder="$t('admin.agenda.locationPlaceholder')"
              @input="onInput('location', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ $t('admin.agenda.products') }}</label>
            <input
              type="text"
              :value="formData.products"
              :placeholder="$t('admin.agenda.productsPlaceholder')"
              @input="onInput('products', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ $t('common.notes') }}</label>
            <textarea
              rows="3"
              :value="formData.notes"
              :placeholder="$t('admin.agenda.notesPlaceholder')"
              @input="onInput('notes', $event)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button
            class="btn-primary"
            :disabled="saving || !formData.contact_name.trim()"
            @click="emit('submit')"
          >
            {{ submitLabel }}
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
  padding: 1.25rem;
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 2.5rem);
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
  max-width: 33.75rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--text-disabled);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 2.25rem;
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (hover: hover) {
  .modal-close:hover {
    color: var(--text-secondary);
  }
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-gray-200);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-group textarea {
  resize: vertical;
  min-height: 5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-group.half {
  width: 100%;
}

@media (min-width: 30em) {
  .form-row {
    flex-direction: row;
    gap: 1rem;
  }

  .form-group.half {
    width: calc(50% - 0.5rem);
  }
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

@media (hover: hover) {
  .btn-primary:hover {
    background: var(--color-primary-dark);
  }
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .btn-secondary:hover {
    background: var(--bg-secondary);
    border-color: var(--color-gray-300);
  }
}
</style>
