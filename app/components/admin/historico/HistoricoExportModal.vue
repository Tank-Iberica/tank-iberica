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
          <span>📥 {{ $t('admin.historico.exportTitle') }}</span>
          <button :aria-label="$t('common.close')" @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>{{ $t('common.format') }}</label>
            <div class="radio-group">
              <label>
                <input
                  type="radio"
                  value="excel"
                  :checked="exportFormat === 'excel'"
                  @change="$emit('update:exportFormat', 'excel')"
                >
                {{ $t('admin.balance.excelCsv') }}
              </label>
              <label>
                <input
                  type="radio"
                  value="pdf"
                  :checked="exportFormat === 'pdf'"
                  @change="$emit('update:exportFormat', 'pdf')"
                >
                {{ $t('admin.balance.pdfPrint') }}
              </label>
            </div>
          </div>

          <div class="field">
            <label>{{ $t('common.data') }}</label>
            <div class="radio-group">
              <label>
                <input
                  type="radio"
                  value="filtered"
                  :checked="exportDataScope === 'filtered'"
                  @change="$emit('update:exportDataScope', 'filtered')"
                >
                {{ $t('admin.historico.onlyFiltered') }}
              </label>
              <label>
                <input
                  type="radio"
                  value="all"
                  :checked="exportDataScope === 'all'"
                  @change="$emit('update:exportDataScope', 'all')"
                >
                {{ $t('common.all') }}
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="$emit('confirm')">{{ $t('common.export') }}</button>
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
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
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
.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: normal;
  color: var(--color-gray-700);
}
.radio-group input {
  margin: 0;
}
</style>
