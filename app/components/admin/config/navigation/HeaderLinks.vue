<script setup lang="ts">
import type { LinkItem, LinkField } from '~/composables/admin/useAdminNavigation'

defineProps<{
  links: LinkItem[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'move', index: number, direction: -1 | 1): void
  (e: 'remove', index: number): void
  (e: 'update-field', index: number, field: LinkField, value: string | boolean): void
}>()
</script>

<template>
  <div class="config-card">
    <div class="card-header-row">
      <div>
        <h3 class="card-title">Enlaces del Header</h3>
        <p class="card-subtitle">Enlaces de navegacion principal del sitio</p>
      </div>
      <button class="btn-add" @click="emit('add')">+ Anadir</button>
    </div>

    <AdminConfigNavigationLinksList
      :links="links"
      placeholder-es="Inicio"
      placeholder-en="Home"
      placeholder-url="/ruta"
      empty-message="No hay enlaces configurados. Anade el primero."
      @move="(index, direction) => emit('move', index, direction)"
      @remove="(index) => emit('remove', index)"
      @update-field="(index, field, value) => emit('update-field', index, field, value)"
    />
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.btn-add {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--color-primary-dark);
}
</style>
