<script setup lang="ts">
import { CONTACT_TYPES, type ContactType } from '~/composables/admin/useAdminAgenda'

defineProps<{
  search: string
  contactType: ContactType | null | undefined
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:contactType', value: ContactType | null): void
}>()

function onSearchInput(event: Event) {
  emit('update:search', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-row">
      <div class="search-box">
        <span class="search-icon">&#x1F50D;</span>
        <input
          type="text"
          :value="search"
          placeholder="Buscar empresa, nombre, email, producto..."
          @input="onSearchInput"
        >
        <button v-if="search" class="clear-btn" @click="emit('update:search', '')">&#xD7;</button>
      </div>

      <div class="filter-group">
        <label class="filter-label">Tipo:</label>
        <div class="segment-control">
          <button :class="{ active: !contactType }" @click="emit('update:contactType', null)">
            Todos
          </button>
          <button
            v-for="ct in CONTACT_TYPES"
            :key="ct.value"
            :class="{ active: contactType === ct.value }"
            @click="emit('update:contactType', ct.value)"
          >
            {{ ct.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.toolbar-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-sm);
  opacity: 0.5;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2.25rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.search-box .clear-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-tertiary);
  border: none;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-size-xs);
  line-height: 1;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  white-space: nowrap;
}

.segment-control {
  display: flex;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  flex-wrap: wrap;
}

.segment-control button {
  padding: 0.4375rem 0.75rem;
  border: none;
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.15s;
  min-height: 2.25rem;
}

.segment-control button:not(:last-child) {
  border-right: 1px solid var(--color-gray-200);
}

.segment-control button.active {
  background: var(--color-primary);
  color: white;
}

.segment-control button:hover:not(.active) {
  background: var(--bg-secondary);
}

@media (min-width: 48em) {
  .toolbar-row {
    flex-direction: row;
    align-items: center;
  }

  .search-box {
    max-width: 20rem;
  }
}
</style>
