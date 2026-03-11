<script setup lang="ts">
import type { CategoryKey, EmailCategory } from '~/composables/admin/useAdminEmails'

defineProps<{
  activeCategory: CategoryKey
  categories: EmailCategory[]
  categoryCount: (cat: CategoryKey) => number
}>()

const emit = defineEmits<{
  select: [category: CategoryKey]
}>()
</script>

<template>
  <div class="category-tabs">
    <button
      v-for="cat in categories"
      :key="cat.key"
      class="category-tab"
      :class="{ 'category-tab--active': activeCategory === cat.key }"
      @click="emit('select', cat.key)"
    >
      <span class="category-tab__label">{{ $t(cat.labelKey) }}</span>
      <span class="category-tab__count">{{ categoryCount(cat.key) }}</span>
    </button>
  </div>
</template>

<style scoped>
.category-tabs {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-5);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: 0.625rem var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-gray-700);
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 2.75rem;
}

.category-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.category-tab--active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.category-tab--active:hover {
  color: white;
}

.category-tab__count {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
}

.category-tab--active .category-tab__count {
  background: rgba(255, 255, 255, 0.2);
}
</style>
