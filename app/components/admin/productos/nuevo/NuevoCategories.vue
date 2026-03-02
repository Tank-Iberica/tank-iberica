<script setup lang="ts">
interface Props {
  categories: string[]
  featured: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'toggle-category': [cat: string]
  'update:featured': [value: boolean]
}>()

function hasCat(cat: string, cats: string[]): boolean {
  return cats?.includes(cat) || false
}
</script>

<template>
  <div class="section">
    <div class="section-title">Categorias *</div>
    <div class="cat-row">
      <label class="cat-check" :class="{ active: hasCat('venta', categories) }">
        <input
          type="checkbox"
          :checked="hasCat('venta', categories)"
          @change="emit('toggle-category', 'venta')"
        />
        Venta
      </label>
      <label class="cat-check" :class="{ active: hasCat('alquiler', categories) }">
        <input
          type="checkbox"
          :checked="hasCat('alquiler', categories)"
          @change="emit('toggle-category', 'alquiler')"
        />
        Alquiler
      </label>
      <label class="cat-check" :class="{ active: hasCat('terceros', categories) }">
        <input
          type="checkbox"
          :checked="hasCat('terceros', categories)"
          @change="emit('toggle-category', 'terceros')"
        />
        Terceros
      </label>
      <label class="feat-check">
        <input type="checkbox" :checked="featured" @change="emit('update:featured', !featured)" />
        Destacado
      </label>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.cat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.cat-check {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.cat-check input {
  margin: 0;
}
.cat-check.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
.feat-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--color-warning);
  cursor: pointer;
  margin-left: auto;
}
.feat-check input {
  margin: 0;
}

@media (max-width: 768px) {
  .cat-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .feat-check {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
