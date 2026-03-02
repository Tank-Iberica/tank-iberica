<script setup lang="ts">
/**
 * HistoricoRestoreModal — Confirmation modal to restore a sold vehicle back to draft.
 * Requires typing "restaurar" / "restore" to confirm.
 */
import type { SoldVehicle } from '~/composables/dashboard/useDashboardHistorico'

defineProps<{
  show: boolean
  target: SoldVehicle | null
  confirmText: string
  canRestore: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
  (e: 'update:confirmText', value: string): void
}>()

const { t } = useI18n()

function onConfirmInput(event: Event): void {
  emit('update:confirmText', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>{{ t('dashboard.historico.restore.title') }}</span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ t('dashboard.historico.restore.message') }}</p>
          <div class="restore-info">
            <strong>{{ target?.brand }} {{ target?.model }}</strong>
            ({{ target?.year || '--' }})
          </div>
          <div class="warning-box">
            {{ t('dashboard.historico.restore.warning') }}
          </div>
          <div class="field">
            <label>{{ t('dashboard.historico.restore.confirmLabel') }}</label>
            <input
              type="text"
              :value="confirmText"
              :placeholder="t('dashboard.historico.restore.confirmPlaceholder')"
              @input="onConfirmInput"
            >
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.historico.restore.cancel') }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="!canRestore || saving"
            @click="emit('confirm')"
          >
            {{ t('dashboard.historico.restore.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal */
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
  border-radius: 12px;
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
  border-radius: 12px 12px 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-disabled);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-head button:hover {
  background: var(--bg-secondary);
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
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

/* Restore-specific */
.restore-info {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  text-align: center;
  margin-bottom: 12px;
}

.warning-box {
  padding: 10px;
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

/* Form fields */
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
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  font-size: 0.85rem;
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
