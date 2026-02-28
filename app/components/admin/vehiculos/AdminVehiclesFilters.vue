<script setup lang="ts">
defineProps<{
  status: string | null
  category: string | null
  search: string
}>()

const emit = defineEmits<{
  (e: 'update:status' | 'update:category', value: string | null): void
  (e: 'update:search', value: string): void
  (e: 'search-debounced'): void
}>()

let searchTimeout: ReturnType<typeof setTimeout>

function onStatusChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  emit('update:status', value || null)
}

function onCategoryChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  emit('update:category', value || null)
}

function onSearchInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:search', value)
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => emit('search-debounced'), 300)
}
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group">
      <label class="filter-label">Estado</label>
      <select class="filter-select" :value="status ?? ''" @change="onStatusChange">
        <option value="">Todos</option>
        <option value="draft">Borrador</option>
        <option value="published">Publicado</option>
        <option value="rented">Alquilado</option>
        <option value="workshop">En taller</option>
        <option value="sold">Vendido</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">Categoría</label>
      <select class="filter-select" :value="category ?? ''" @change="onCategoryChange">
        <option value="">Todas</option>
        <option value="venta">Venta</option>
        <option value="alquiler">Alquiler</option>
        <option value="terceros">Terceros</option>
      </select>
    </div>

    <div class="filter-group search-group">
      <label class="filter-label">Buscar</label>
      <input
        type="text"
        class="filter-input"
        :value="search"
        placeholder="Marca o modelo..."
        @input="onSearchInput"
      >
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-4);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 150px;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-select,
.filter-input {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 40px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
