<script setup lang="ts">
import type { HistoricoEntry } from '~/composables/admin/useAdminHistorico'

defineProps<{
  visible: boolean
  target: HistoricoEntry | null
  confirmText: string
  canDelete: boolean
  saving: boolean
  fmt: (val: number | null | undefined) => string
}>()

defineEmits<{
  (e: 'close' | 'confirm'): void
  (e: 'update:confirmText', value: string): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>🗑️ Eliminar registro</span>
          <button :aria-label="$t('common.close')" @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <p>¿Eliminar permanentemente este registro del histórico?</p>
          <p class="delete-info">
            <strong>{{ target?.brand }} {{ target?.model }}</strong>
            — {{ fmt(target?.sale_price) }}
          </p>
          <p class="warning">⚠️ Esta acción no se puede deshacer.</p>
          <div class="field">
            <label>Escribe <strong>Borrar</strong> para confirmar:</label>
            <input
              :value="confirmText"
              type="text"
              placeholder="Borrar"
              @input="$emit('update:confirmText', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn btn-danger" :disabled="!canDelete || saving" @click="$emit('confirm')">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}
.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 26.25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-disabled);
}
.modal-body {
  padding: var(--spacing-4);
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 10px 10px;
  position: sticky;
  bottom: 0;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-danger {
  background: var(--color-error);
  color: var(--color-white);
  border: none;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.delete-info {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
  margin-bottom: var(--spacing-3);
}
.warning {
  padding: 0.625rem;
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  margin-bottom: var(--spacing-3);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-3);
}
.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-500);
}
.field input {
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}
.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
