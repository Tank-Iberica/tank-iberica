<script setup lang="ts">
defineProps<{
  section: string
  status: string
  category: string
  publishedAt: string | null
  scheduledAt: string | null
}>()

const emit = defineEmits<{
  'update:section': [value: string]
  'update:status': [value: string]
  'update:category': [value: string]
  'update:publishedAt': [value: string | null]
  'update:scheduledAt': [value: string | null]
}>()

function onSectionChange(value: string) {
  emit('update:section', value)
}

function onStatusChange(value: string) {
  emit('update:status', value)
}
</script>

<template>
  <div class="section">
    <div class="section-title">Publicacion</div>
    <div class="field" style="margin-bottom: 12px">
      <label>Seccion</label>
      <div class="estado-row">
        <label class="estado-opt" :class="{ active: section === 'noticias' }">
          <input
            type="radio"
            :checked="section === 'noticias'"
            value="noticias"
            @change="onSectionChange('noticias')"
          >
          Noticias
        </label>
        <label class="estado-opt" :class="{ active: section === 'guia' }">
          <input
            type="radio"
            :checked="section === 'guia'"
            value="guia"
            @change="onSectionChange('guia')"
          >
          Guia
        </label>
      </div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>Estado</label>
        <div class="estado-row">
          <label class="estado-opt" :class="{ active: status === 'draft' }">
            <input
              type="radio"
              :checked="status === 'draft'"
              value="draft"
              @change="onStatusChange('draft')"
            >
            Borrador
          </label>
          <label class="estado-opt" :class="{ active: status === 'published' }">
            <input
              type="radio"
              :checked="status === 'published'"
              value="published"
              @change="onStatusChange('published')"
            >
            Publicado
          </label>
          <label class="estado-opt" :class="{ active: status === 'scheduled' }">
            <input
              type="radio"
              :checked="status === 'scheduled'"
              value="scheduled"
              @change="onStatusChange('scheduled')"
            >
            Programado
          </label>
          <label class="estado-opt" :class="{ active: status === 'archived' }">
            <input
              type="radio"
              :checked="status === 'archived'"
              value="archived"
              @change="onStatusChange('archived')"
            >
            Archivado
          </label>
        </div>
      </div>
      <div class="field">
        <label>Categoria</label>
        <select
          class="input"
          :value="category"
          @change="$emit('update:category', ($event.target as HTMLSelectElement).value)"
        >
          <option value="prensa">Prensa</option>
          <option value="eventos">Eventos</option>
          <option value="destacados">Destacados</option>
          <option value="general">General</option>
        </select>
      </div>
    </div>
    <div v-if="status === 'published'" class="field">
      <label>Fecha de publicacion</label>
      <input
        type="datetime-local"
        class="input"
        :value="publishedAt"
        @input="$emit('update:publishedAt', ($event.target as HTMLInputElement).value || null)"
      >
    </div>
    <div v-if="status === 'scheduled'" class="field">
      <label>Fecha de publicacion programada</label>
      <input
        type="datetime-local"
        class="input"
        :value="scheduledAt"
        @input="$emit('update:scheduledAt', ($event.target as HTMLInputElement).value || null)"
      >
      <span class="char-count">El articulo se publicara automaticamente en esta fecha</span>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}

.estado-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.estado-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.estado-opt input {
  display: none;
}

.estado-opt.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.char-count {
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: right;
}
</style>
