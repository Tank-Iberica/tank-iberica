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
  background: #fff;
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
.upload-zone-label {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 10px;
}
.upload-zone-label:hover {
  border-color: #23424a;
  background: #f3f4f6;
}
.upload-zone-label input[type='file'] {
  display: none;
}
.doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 0.8rem;
}
.btn-x {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.empty-msg {
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 16px;
}
</style>
