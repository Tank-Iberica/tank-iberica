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
  padding: 1rem;
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
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-disabled);
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.modal-head button:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1rem;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  position: sticky;
  bottom: 0;
}

/* Restore-specific */
.restore-info {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
  margin-bottom: 0.75rem;
}

.warning-box {
  padding: 0.625rem;
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

/* Form fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.field label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
}

.field input {
  min-height: 2.75rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
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
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
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
