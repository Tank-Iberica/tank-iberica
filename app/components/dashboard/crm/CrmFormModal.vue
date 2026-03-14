<script setup lang="ts">
/**
 * CRM contact create/edit form modal.
 * Teleported to body for proper stacking context.
 * Uses :value + @input pattern to avoid v-model on props.
 */
import type { ContactFormData, ContactTypeConfig } from '~/composables/dashboard/useDashboardCrm'

const props = defineProps<{
  show: boolean
  isEditing: boolean
  form: ContactFormData
  contactTypes: ContactTypeConfig[]
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
  close: []
  'update:form': [value: ContactFormData]
}>()

const { t } = useI18n()

const isFormValid = computed(() => props.form.contact_name.trim().length > 0)

function updateField<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]): void {
  emit('update:form', { ...props.form, [key]: value })
}

function onInputField(key: keyof ContactFormData, event: Event): void {
  updateField(key, (event.target as HTMLInputElement).value as ContactFormData[typeof key])
}

function onSelectType(event: Event): void {
  updateField(
    'contact_type',
    (event.target as HTMLSelectElement).value as ContactFormData['contact_type'],
  )
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>
            {{ isEditing ? t('dashboard.crm.editContact') : t('dashboard.crm.createContact') }}
          </h3>
          <button class="modal-close" @click="emit('close')">&#215;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelType') }}</label>
            <select :value="form.contact_type" @change="onSelectType">
              <option v-for="ct in contactTypes" :key="ct.value" :value="ct.value">
                {{ t(ct.labelKey) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelCompany') }}</label>
            <input
              type="text"
              :value="form.company"
              :placeholder="t('dashboard.crm.placeholderCompany')"
              autocomplete="organization"
              @input="onInputField('company', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelContactName') }}</label>
            <input
              type="text"
              :value="form.contact_name"
              :placeholder="t('dashboard.crm.placeholderName')"
              autocomplete="name"
              @input="onInputField('contact_name', $event)"
            >
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>{{ t('dashboard.crm.labelPhone') }}</label>
              <input
                type="tel"
                :value="form.phone"
                :placeholder="t('dashboard.crm.placeholderPhone')"
                autocomplete="tel"
                @input="onInputField('phone', $event)"
              >
            </div>
            <div class="form-group half">
              <label>{{ t('dashboard.crm.labelEmail') }}</label>
              <input
                type="email"
                :value="form.email"
                :placeholder="t('dashboard.crm.placeholderEmail')"
                autocomplete="email"
                @input="onInputField('email', $event)"
              >
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelLocation') }}</label>
            <input
              type="text"
              :value="form.location"
              :placeholder="t('dashboard.crm.placeholderLocation')"
              @input="onInputField('location', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelVertical') }}</label>
            <input
              type="text"
              :value="form.vertical"
              :placeholder="t('dashboard.crm.placeholderVertical')"
              @input="onInputField('vertical', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelLastContact') }}</label>
            <input
              type="date"
              :value="form.last_contact_date"
              @input="onInputField('last_contact_date', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelNotes') }}</label>
            <textarea
              rows="3"
              :value="form.notes"
              :placeholder="t('dashboard.crm.placeholderNotes')"
              @input="onInputField('notes', $event)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('dashboard.crm.cancel') }}
          </button>
          <button class="btn-primary" :disabled="saving || !isFormValid" @click="emit('save')">
            {{
              saving
                ? t('dashboard.crm.saving')
                : isEditing
                  ? t('dashboard.crm.save')
                  : t('dashboard.crm.create')
            }}
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
  backdrop-filter: blur(0.125rem);
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
    transform: scale(0.95) translateY(-0.625rem);
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
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-secondary);
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

/* Form styles */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
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

/* Buttons */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
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
  min-height: 2.75rem;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}
</style>
