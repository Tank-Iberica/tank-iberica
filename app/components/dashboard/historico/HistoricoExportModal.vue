<script setup lang="ts">
/**
 * HistoricoExportModal — Modal for selecting export scope and triggering CSV download.
 */

defineProps<{
  show: boolean
  exportScope: 'all' | 'filtered'
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
  (e: 'update:exportScope', value: 'all' | 'filtered'): void
}>()

const { t } = useI18n()

function onScopeChange(event: Event): void {
  emit('update:exportScope', (event.target as HTMLInputElement).value as 'all' | 'filtered')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>{{ t('dashboard.historico.exportModal.title') }}</span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>{{ t('dashboard.historico.exportModal.scope') }}</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  name="export-scope"
                  value="filtered"
                  :checked="exportScope === 'filtered'"
                  @change="onScopeChange"
                >
                {{ t('dashboard.historico.exportModal.filtered') }}
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="export-scope"
                  value="all"
                  :checked="exportScope === 'all'"
                  @change="onScopeChange"
                >
                {{ t('dashboard.historico.exportModal.all') }}
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.historico.exportModal.cancel') }}
          </button>
          <button class="btn btn-primary" @click="emit('confirm')">
            {{ t('dashboard.historico.exportModal.confirm') }}
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

/* Radio groups */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: normal;
  color: #374151;
  min-height: 44px;
}

.radio-label input {
  margin: 0;
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
</style>
