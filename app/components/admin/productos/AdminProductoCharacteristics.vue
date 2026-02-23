<script setup lang="ts">
interface CharacteristicEntry {
  id: string
  key: string
  value_es: string
  value_en: string
}

interface Props {
  open: boolean
  characteristics: CharacteristicEntry[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'add'): void
  (e: 'remove', id: string): void
  (e: 'update', id: string, field: keyof CharacteristicEntry, value: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Características adicionales</span>
      <div class="toggle-actions">
        <button class="btn-add" @click.stop="emit('add')">+ Añadir</button>
        <span>{{ open ? '−' : '+' }}</span>
      </div>
    </button>
    <div v-if="open" class="section-content">
      <div v-if="characteristics.length === 0" class="empty-msg">
        Sin características adicionales. Pulsa "+ Añadir" para crear una.
      </div>
      <div v-for="c in characteristics" :key="c.id" class="char-row">
        <input
          :value="c.key"
          type="text"
          placeholder="Nombre (ej: Motor)"
          @input="emit('update', c.id, 'key', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="c.value_es"
          type="text"
          placeholder="Valor ES"
          @input="emit('update', c.id, 'value_es', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="c.value_en"
          type="text"
          placeholder="Valor EN"
          @input="emit('update', c.id, 'value_en', ($event.target as HTMLInputElement).value)"
        >
        <button class="btn-x" @click="emit('remove', c.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: #fff;
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
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
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
.btn-add {
  padding: 4px 10px;
  background: #23424a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
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
