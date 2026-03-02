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
        <button class="btn-x" @click="emit('remove', d.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
}
.section-toggle:hover {
  background: #f9fafb;
}
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.doc-upload-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: stretch;
}
.doc-type-select {
  padding: 6px 10px;
  border: 1px solid var(--border-color-light);
  border-radius: 5px;
  font-size: 0.8rem;
  min-width: 140px;
}
.upload-zone-label.compact {
  flex: 1;
  padding: 8px 12px;
  margin-bottom: 0;
  display: block;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed var(--border-color-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
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
  padding: 6px 10px;
  margin-bottom: 8px;
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-radius: 6px;
}
.doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 4px;
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
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  font-size: 0.65rem;
  color: #6b7280;
  text-transform: uppercase;
  flex-shrink: 0;
}
.btn-add {
  padding: 4px 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-x {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: 16px;
}
</style>
