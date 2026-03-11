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
        />
        <input
          :value="c.value_es"
          type="text"
          placeholder="Valor ES"
          @input="emit('update', c.id, 'value_es', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="c.value_en"
          type="text"
          placeholder="Valor EN"
          @input="emit('update', c.id, 'value_en', ($event.target as HTMLInputElement).value)"
        />
        <button class="btn-x" :aria-label="$t('common.delete')" @click="emit('remove', c.id)">×</button>
      </div>
    </div>
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
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
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
.btn-add {
  padding: var(--spacing-1) 0.625rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
}
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
