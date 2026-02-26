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
      <button class="btn-x" @click="emit('remove', c.id)">×</button>
    </div>
  </div>
</template>

<style scoped>
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}

/* Characteristics */
.char-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 32px;
  gap: 8px;
  margin-bottom: 8px;
}
.char-row input {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Buttons */
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

/* Empty message */
.empty-msg {
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 16px;
}

@media (max-width: 768px) {
  .char-row {
    grid-template-columns: 1fr;
  }
}
</style>
