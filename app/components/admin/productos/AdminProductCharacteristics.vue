<script setup lang="ts">
import type { CharacteristicEntry } from '~/composables/admin/useAdminProductForm'

defineProps<{
  characteristics: CharacteristicEntry[]
}>()

const emit = defineEmits<{
  add: []
  remove: [id: string]
}>()
</script>

<template>
  <div class="section-content">
    <div v-if="characteristics.length === 0" class="empty-msg">
      Sin características adicionales. Pulsa "+ Añadir" para crear una.
    </div>
    <div v-for="c in characteristics" :key="c.id" class="char-row">
      <input v-model="c.key" type="text" placeholder="Nombre (ej: Motor)" >
      <input v-model="c.value_es" type="text" placeholder="Valor ES" >
      <input v-model="c.value_en" type="text" placeholder="Valor EN" >
      <button class="btn-x" :aria-label="$t('common.delete')" @click="emit('remove', c.id)">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}

/* Characteristics */
.char-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 32px;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}
.char-row input {
  padding: 0.375rem var(--spacing-2);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
}

/* Buttons */
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

/* Empty message */
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: var(--spacing-4);
}

@media (max-width: 48em) {
  .char-row {
    grid-template-columns: 1fr;
  }
}
</style>
