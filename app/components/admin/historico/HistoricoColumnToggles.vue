<script setup lang="ts">
defineProps<{
  showDocs: boolean
  showTecnico: boolean
  showAlquiler: boolean
  total: number
}>()

defineEmits<{
  'update:showDocs': [value: boolean]
  'update:showTecnico': [value: boolean]
  'update:showAlquiler': [value: boolean]
}>()
</script>

<template>
  <div class="column-toggles">
    <label class="toggle-check">
      <input
        type="checkbox"
        :checked="showDocs"
        @change="$emit('update:showDocs', ($event.target as HTMLInputElement).checked)"
      >
      DOCS
    </label>
    <label class="toggle-check">
      <input
        type="checkbox"
        :checked="showTecnico"
        @change="$emit('update:showTecnico', ($event.target as HTMLInputElement).checked)"
      >
      TÉCNICO
    </label>
    <label class="toggle-check">
      <input
        type="checkbox"
        :checked="showAlquiler"
        @change="$emit('update:showAlquiler', ($event.target as HTMLInputElement).checked)"
      >
      ALQUILER
    </label>
    <span class="count">{{ total }} registros</span>
  </div>
</template>

<style scoped>
.column-toggles {
  display: flex;
  align-items: center;
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-4);
  font-size: 0.85rem;
}
.toggle-check {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  padding: var(--spacing-1) 0.625rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}
.toggle-check input {
  margin: 0;
}
.count {
  margin-left: auto;
  color: var(--color-gray-500);
}

@media (max-width: 48em) {
  .column-toggles {
    flex-wrap: wrap;
  }
}
</style>
