<script setup lang="ts">
/* eslint-disable @typescript-eslint/unified-signatures */
import type { DocumentEntry } from '~/composables/admin/useAdminVehicles'
import type { FileNamingData } from '~/utils/fileNaming'

interface Props {
  open: boolean
  documents: DocumentEntry[]
  docTypeToUpload: string
  docTypeOptions: string[]
  driveConnected: boolean
  driveLoading: boolean
  driveError: string | null
  fileNamingData: FileNamingData
  driveSection: 'Vehiculos' | 'Intermediacion'
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'update:docTypeToUpload', value: string): void
  (e: 'upload', event: Event): void
  (e: 'remove', id: string): void
  (e: 'open-folder'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Documentos ({{ documents.length }})</span>
      <div class="toggle-actions">
        <button
          v-if="driveConnected"
          class="btn-add"
          title="Abrir carpeta en Drive"
          @click.stop="emit('open-folder')"
        >
          📁
        </button>
        <span>{{ open ? '−' : '+' }}</span>
      </div>
    </button>
    <div v-if="open" class="section-content">
      <div class="doc-upload-row">
        <select
          :value="docTypeToUpload"
          class="doc-type-select"
          @change="emit('update:docTypeToUpload', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="dt in docTypeOptions" :key="dt" :value="dt">{{ dt }}</option>
        </select>
        <label class="upload-zone-label compact">
          {{ driveLoading ? 'Subiendo...' : '📄 Subir documento' }}
          <input type="file" multiple :disabled="driveLoading" @change="emit('upload', $event)" >
        </label>
      </div>
      <div v-if="driveError" class="error-msg small">{{ driveError }}</div>
      <div v-if="documents.length === 0" class="empty-msg">Sin documentos.</div>
      <div v-for="d in documents" :key="d.id" class="doc-row">
        <a :href="d.url" target="_blank" rel="noopener" class="doc-link">📄 {{ d.name }}</a>
        <span class="doc-type-badge">{{ d.type }}</span>
        <button class="btn-x" :aria-label="$t('common.delete')" @click="emit('remove', d.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
}
.section-toggle:hover {
  background: var(--color-gray-50);
}
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.doc-upload-row {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: 0.625rem;
  align-items: stretch;
}
.doc-type-select {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  min-width: 8.75rem;
}
.upload-zone-label.compact {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  margin-bottom: 0;
  display: block;
  text-align: center;
  background: var(--color-gray-50);
  border: 2px dashed var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-gray-500);
}
.upload-zone-label.compact:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}
.upload-zone-label.compact input[type='file'] {
  display: none;
}
.error-msg.small {
  font-size: 0.75rem;
  padding: 0.375rem 0.625rem;
  margin-bottom: var(--spacing-2);
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-radius: var(--border-radius);
}
.doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
  padding: 0.375rem 0.625rem;
  background: var(--color-gray-50);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-1);
  font-size: 0.8rem;
}
.doc-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-link:hover {
  text-decoration: underline;
}
.doc-type-badge {
  padding: 0.125rem 0.375rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  font-size: 0.65rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  flex-shrink: 0;
}
.btn-add {
  padding: var(--spacing-1) 0.625rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-x {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
}
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: var(--spacing-4);
}
</style>
