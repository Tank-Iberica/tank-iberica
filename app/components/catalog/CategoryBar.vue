<template>
  <nav class="categories-section" :aria-label="$t('catalog.title')">
    <div class="categories-wrapper">
      <div ref="scrollContainer" class="categories">
        <button
          v-for="cat in displayCategories"
          :key="cat.key"
          :class="['category-btn', { active: cat.key === 'anunciate' ? false : activeCategories.has(cat.key) }]"
          @click="handleClick(cat.key)"
        >
          {{ cat.key === 'anunciate' ? $t('catalog.anunciate') : $t(`catalog.${cat.key}`) }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { VehicleCategory } from '~/composables/useCatalogState'

const emit = defineEmits<{
  change: [categories: VehicleCategory[]]
  openAdvertise: []
}>()

const { activeCategory, setCategory, setCategories } = useCatalogState()

const displayCategories = [
  { key: 'alquiler' },
  { key: 'venta' },
  { key: 'terceros' },
  { key: 'anunciate' },
] as const

// Multi-select state
const activeCategories = ref<Set<string>>(new Set(['alquiler']))

onMounted(() => {
  if (activeCategory.value) {
    activeCategories.value = new Set([activeCategory.value])
  } else {
    setCategory('alquiler')
  }
})

function handleClick(key: string) {
  if (key === 'anunciate') {
    emit('openAdvertise')
    return
  }

  const cat = key as VehicleCategory
  const next = new Set(activeCategories.value)

  if (next.has(cat)) {
    next.delete(cat)
    if (next.size === 0) next.add(cat) // At least one must be active
  } else {
    next.add(cat)
  }

  activeCategories.value = next
  const arr = [...next] as VehicleCategory[]
  setCategories(arr)
  emit('change', arr)
}
</script>

<style scoped>
.categories-section {
  background: var(--bg-primary);
  padding: 0.34rem 0;
  position: relative;
  overflow: hidden;
}

.categories-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.categories-wrapper::-webkit-scrollbar {
  display: none;
}

.categories {
  display: flex;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 0 1rem;
  min-width: 100%;
}

.category-btn {
  padding: 0.31rem 0.56rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  min-height: 44px;
}

.category-btn:hover {
  border-color: var(--color-primary-light);
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.category-btn.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: var(--color-white);
  border-color: var(--color-primary);
}

@media (max-width: 479px) {
  .category-btn {
    font-size: 9px;
    padding: 0.2rem 0.36rem;
    letter-spacing: 0.1px;
  }
}

@media (min-width: 480px) {
  .category-btn {
    font-size: 10px;
    padding: 0.3rem 0.5rem;
  }
}

@media (min-width: 768px) {
  .categories {
    justify-content: center;
    flex-wrap: wrap;
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .categories {
    padding: 0 3rem;
  }
}
</style>
