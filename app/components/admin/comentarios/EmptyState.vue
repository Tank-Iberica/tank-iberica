<script setup lang="ts">
import type { CommentStatus } from '~/composables/admin/useAdminComentarios'

defineProps<{
  activeFilter: CommentStatus | null
  searchQuery: string
  statusLabels: Record<CommentStatus, string>
}>()
</script>

<template>
  <div class="empty-state-container">
    <div class="empty-icon">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-gray-400)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
    <h3 class="empty-title">Sin comentarios</h3>
    <p class="empty-description">
      {{
        activeFilter
          ? `No hay comentarios con estado "${statusLabels[activeFilter]}".`
          : searchQuery.trim()
            ? 'No se encontraron comentarios que coincidan con la busqueda.'
            : 'Aun no se han recibido comentarios.'
      }}
    </p>
  </div>
</template>

<style scoped>
.empty-state-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 3.75rem var(--spacing-6);
  text-align: center;
  box-shadow: var(--shadow-card);
}

.empty-icon {
  margin-bottom: var(--spacing-4);
}

.empty-title {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 1.1rem;
  color: var(--color-gray-700);
}

.empty-description {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-disabled);
}
</style>
