<script setup lang="ts">
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'

const props = defineProps<{
  show: boolean
  vehicle: AdminVehicle | null
  confirmText: string
}>()

const emit = defineEmits<{
  'update:confirmText': [text: string]
  close: []
  confirm: []
}>()

const localConfirmText = computed({
  get: () => props.confirmText,
  set: (val) => emit('update:confirmText', val),
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header danger">
          <h3>{{ $t('admin.productos.deleteProduct') }}</h3>
          <button class="modal-close" :aria-label="$t('common.close')" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <p v-html="$t('admin.productos.deleteConfirmMsg', { name: `<strong>${vehicle?.brand} ${vehicle?.model}</strong>` })" />
          <p class="text-danger">
            {{ $t('admin.productos.deleteImagesWarning') }}
          </p>
          <div class="form-group">
            <label v-html="$t('admin.productos.typeDeleteConfirm', { word: '<strong>borrar</strong>' })" />
            <input v-model="localConfirmText" type="text" placeholder="borrar" autocomplete="off" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button
            class="btn-danger"
            :disabled="localConfirmText.toLowerCase() !== 'borrar'"
            @click="emit('confirm')"
          >
            {{ $t('common.delete') }}
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

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow: auto;
  animation: modalSlide 0.2s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-sm {
  width: 100%;
  max-width: 30em;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header.danger {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-header.danger h3 {
  color: var(--color-error);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-body p {
  margin: 0 0 var(--spacing-3);
  color: var(--text-secondary);
  line-height: 1.6;
}

.text-danger {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.form-group {
  margin-top: var(--spacing-5);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.form-group input {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  transition: border 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  color: var(--text-secondary);
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
