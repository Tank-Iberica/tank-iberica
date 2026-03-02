<script setup lang="ts">
import type { ExportFormat, ExportScope } from '~/composables/admin/useAdminHistoricoPage'

defineProps<{
  visible: boolean
  exportFormat: ExportFormat
  exportDataScope: ExportScope
}>()

defineEmits<{
  (e: 'close' | 'confirm'): void
  (e: 'update:exportFormat', value: ExportFormat): void
  (e: 'update:exportDataScope', value: ExportScope): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>📥 Exportar Histórico</span>
          <button @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Formato</label>
            <div class="radio-group">
              <label>
                <input
                  type="radio"
                  value="excel"
                  :checked="exportFormat === 'excel'"
                  @change="$emit('update:exportFormat', 'excel')"
                >
                Excel (CSV)
              </label>
              <label>
                <input
                  type="radio"
                  value="pdf"
                  :checked="exportFormat === 'pdf'"
                  @change="$emit('update:exportFormat', 'pdf')"
                >
                PDF (Imprimir)
              </label>
            </div>
          </div>

          <div class="field">
            <label>Datos</label>
            <div class="radio-group">
              <label>
                <input
                  type="radio"
                  value="filtered"
                  :checked="exportDataScope === 'filtered'"
                  @change="$emit('update:exportDataScope', 'filtered')"
                >
                Solo filtrados
              </label>
              <label>
                <input
                  type="radio"
                  value="all"
                  :checked="exportDataScope === 'all'"
                  @change="$emit('update:exportDataScope', 'all')"
                >
                Todos
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" @click="$emit('confirm')">Exportar</button>
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
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
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
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: normal;
  color: #374151;
}
.radio-group input {
  margin: 0;
}
</style>
