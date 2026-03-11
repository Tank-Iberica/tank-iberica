<script setup lang="ts">
/**
 * CRM delete confirmation modal with typed confirmation word.
 * Uses :value + @input pattern to avoid v-model on props.
 */
import type { Contact } from '~/composables/dashboard/useDashboardCrm'

const props = defineProps<{
  show: boolean
  contact: Contact | null
  confirmText: string
  saving: boolean
}>()

const emit = defineEmits<{
  confirm: []
  close: []
  'update:confirmText': [value: string]
}>()

const { t } = useI18n()

const deleteTypeWord = computed(() => t('dashboard.crm.deleteTypeWord'))

const isDeleteEnabled = computed(() => {
  return props.confirmText.toLowerCase() === deleteTypeWord.value.toLowerCase() && !props.saving
})

function onConfirmInput(event: Event): void {
  emit('update:confirmText', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header danger">
          <h3>{{ t('dashboard.crm.deleteTitle') }}</h3>
          <button class="modal-close" @click="emit('close')">&#215;</button>
        </div>
        <div class="modal-body">
          <p>
            {{ t('dashboard.crm.deleteConfirm', { name: contact?.contact_name }) }}
            <span v-if="contact?.company">
              {{ t('dashboard.crm.deleteConfirmCompany', { company: contact.company }) }}
            </span>
            ?
          </p>
          <div class="form-group">
            <label>
              {{ t('dashboard.crm.deleteTypePrompt', { word: deleteTypeWord }) }}
            </label>
            <input
              type="text"
              :value="confirmText"
              :placeholder="deleteTypeWord"
              autocomplete="off"
              @input="onConfirmInput"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('dashboard.crm.cancel') }}
          </button>
          <button class="btn-danger" :disabled="!isDeleteEnabled" @click="emit('confirm')">
            {{ t('dashboard.crm.delete') }}
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

.modal-sm {
  max-width: 26.25rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}

.modal-header.danger {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-border);
}

.modal-header.danger h3 {
  color: var(--color-error);
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

.modal-body p {
  margin: 0 0 1rem;
  color: var(--color-slate-700);
  line-height: 1.5;
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

.form-group input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Buttons */
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

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-danger:hover {
  background: var(--color-error);
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
