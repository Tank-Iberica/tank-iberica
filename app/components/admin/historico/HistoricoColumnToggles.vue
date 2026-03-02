<script setup lang="ts">
defineProps<{
  showDocs: boolean
  showTecnico: boolean
  showAlquiler: boolean
  total: number
}>()

defineEmits<{
  (e: 'update:showDocs' | 'update:showTecnico' | 'update:showAlquiler', value: boolean): void
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
  gap: 20px;
  margin-bottom: 16px;
  font-size: 0.85rem;
}
.toggle-check {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-weight: 500;
}
.toggle-check input {
  margin: 0;
}
.count {
  margin-left: auto;
  color: #6b7280;
}

@media (max-width: 768px) {
  .column-toggles {
    flex-wrap: wrap;
  }
}
</style>
