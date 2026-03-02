<script setup lang="ts">
import type { News } from '~/composables/useNews'

defineProps<{
  article: News
  open: boolean
  formatDate: (dateStr: string | null) => string
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <div class="section">
    <button class="section-toggle" @click="$emit('update:open', !open)">
      <span>Informacion del articulo</span>
      <span class="toggle-icon">{{ open ? '−' : '+' }}</span>
    </button>
    <div v-if="open" class="section-body">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Creado</span>
          <span class="info-value">{{ formatDate(article.created_at) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Actualizado</span>
          <span class="info-value">{{ formatDate(article.updated_at) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Publicado</span>
          <span class="info-value">{{ formatDate(article.published_at) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Visitas</span>
          <span class="info-value">{{ article.views || 0 }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ID</span>
          <span class="info-value info-mono">{{ article.id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

.toggle-icon {
  font-size: 1.2rem;
  color: var(--text-disabled);
}

.section-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-disabled);
  text-transform: uppercase;
}

.info-value {
  font-size: 0.85rem;
  color: #374151;
}

.info-mono {
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
}
</style>
