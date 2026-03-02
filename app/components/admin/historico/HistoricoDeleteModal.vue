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
          <button @click="$emit('close')">×</button>
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
          <button class="btn" @click="$emit('close')">Cancelar</button>
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
  padding: 16px;
}
.modal {
  background: var(--bg-primary);
  border-radius: 10px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
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
  padding: 16px;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 10px 10px;
  position: sticky;
  bottom: 0;
}
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-danger {
  background: var(--color-error);
  color: #fff;
  border: none;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.delete-info {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  text-align: center;
  margin-bottom: 12px;
}
.warning {
  padding: 10px;
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}
.field input {
  padding: 8px 10px;
  border: 1px solid var(--border-color-light);
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
