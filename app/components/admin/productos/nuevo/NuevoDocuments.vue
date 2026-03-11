<script setup lang="ts">
interface DocumentItem {
  id: string
  name: string
  url: string
}

interface Props {
  open: boolean
  documents: DocumentItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  upload: [event: Event]
  remove: [id: string]
}>()
</script>

<template>
  <div class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Documentos ({{ documents.length }})</span>
      <span>{{ open ? '&minus;' : '+' }}</span>
    </button>
    <div v-if="open" class="section-content">
      <label for="doc-upload-input" class="upload-zone-label">
        Subir documentos
        <input id="doc-upload-input" type="file" multiple @change="emit('upload', $event)" >
      </label>
      <div v-if="documents.length === 0" class="empty-msg">Sin documentos.</div>
      <div v-for="d in documents" :key="d.id" class="doc-row">
        <span>{{ d.name }}</span>
        <button class="btn-x" @click="emit('remove', d.id)">&times;</button>
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
.upload-zone-label {
  display: block;
  width: 100%;
  padding: var(--spacing-3);
  text-align: center;
  background: var(--color-gray-50);
  border: 2px dashed var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  margin-bottom: 0.625rem;
}
.upload-zone-label:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}
.upload-zone-label input[type='file'] {
  display: none;
}
.doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.625rem;
  background: var(--color-gray-50);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-1);
  font-size: 0.8rem;
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
