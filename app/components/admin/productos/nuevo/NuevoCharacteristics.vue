<script setup lang="ts">
import type { CharacteristicEntry } from '~/composables/admin/useAdminProductForm'

interface Props {
  open: boolean
  characteristics: CharacteristicEntry[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  add: []
  remove: [id: string]
}>()
</script>

<template>
  <div class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Caracteristicas adicionales</span>
      <div class="toggle-actions">
        <button class="btn-add" @click.stop="emit('add')">+ Anadir</button>
        <span>{{ open ? '&minus;' : '+' }}</span>
      </div>
    </button>
    <AdminProductCharacteristics
      v-if="open"
      :characteristics="characteristics"
      @add="emit('add')"
      @remove="(id: string) => emit('remove', id)"
    />
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
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
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
</style>
