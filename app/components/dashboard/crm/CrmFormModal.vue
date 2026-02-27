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
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
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
              @input="onInputField('company', $event)"
            >
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.crm.labelContactName') }}</label>
            <input
              type="text"
              :value="form.contact_name"
              :placeholder="t('dashboard.crm.placeholderName')"
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
                @input="onInputField('phone', $event)"
              >
            </div>
            <div class="form-group half">
              <label>{{ t('dashboard.crm.labelEmail') }}</label>
              <input
                type="email"
                :value="form.email"
                :placeholder="t('dashboard.crm.placeholderEmail')"
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
  min-width: 44px;
  min-height: 44px;
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

/* Form styles */
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

/* Buttons */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  min-height: 44px;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
</style>
