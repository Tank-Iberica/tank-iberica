<template>
  <nav class="category-bar" :aria-label="$t('catalog.title')">
    <div class="category-scroll">
      <button
        class="category-btn"
        :class="{ active: !activeCategory }"
        @click="selectCategory(null)"
      >
        {{ $t('catalog.allCategories') }}
      </button>
      <button
        v-for="cat in categories"
        :key="cat"
        class="category-btn"
        :class="{ active: activeCategory === cat }"
        @click="selectCategory(cat)"
      >
        {{ $t(`catalog.${cat}`) }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { VehicleCategory } from '~/composables/useCatalogState'

const emit = defineEmits<{
  change: [category: VehicleCategory | null]
}>()

const { activeCategory, setCategory } = useCatalogState()

const categories: VehicleCategory[] = ['alquiler', 'venta', 'terceros']

function selectCategory(cat: VehicleCategory | null) {
  setCategory(cat)
  emit('change', cat)
}
</script>

<style scoped>
.category-bar {
  width: 100%;
  overflow: hidden;
}

.category-scroll {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  padding: var(--spacing-3) var(--spacing-4);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-btn {
  flex-shrink: 0;
  padding: var(--spacing-2) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: var(--bg-primary);
  white-space: nowrap;
  min-height: 44px;
  min-width: 44px;
  transition: all var(--transition-fast);
}

.category-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.category-btn:not(.active):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .category-scroll {
    justify-content: center;
    overflow-x: visible;
    flex-wrap: wrap;
  }
}
</style>
