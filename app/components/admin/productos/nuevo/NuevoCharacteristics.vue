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
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
</style>
