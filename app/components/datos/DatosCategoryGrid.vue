<script setup lang="ts">
import { formatPrice } from '~/composables/useDatos'
import type { CategoryStat } from '~/composables/useDatos'

defineProps<{
  categories: CategoryStat[]
  selectedCategory: string | null
}>()

const emit = defineEmits<{
  (e: 'select', subcategory: string): void
}>()
</script>

<template>
  <section class="datos-section">
    <h2 class="datos-section__title">{{ $t('data.selectCategory') }}</h2>
    <div class="category-grid">
      <button
        v-for="cat in categories"
        :key="cat.subcategory"
        class="category-card"
        :class="{ 'category-card--active': selectedCategory === cat.subcategory }"
        @click="emit('select', cat.subcategory)"
      >
        <span class="category-card__name">{{ cat.label }}</span>
        <span class="category-card__price">{{ formatPrice(cat.avgPrice) }}</span>
        <span
          class="category-card__trend"
          :class="{
            'category-card__trend--rising': cat.trendDirection === 'rising',
            'category-card__trend--falling': cat.trendDirection === 'falling',
            'category-card__trend--stable': cat.trendDirection === 'stable',
          }"
        >
          <template v-if="cat.trendDirection === 'rising'">&uarr;</template>
          <template v-else-if="cat.trendDirection === 'falling'">&darr;</template>
          <template v-else>&rarr;</template>
          {{ Math.abs(cat.trendPct) }}%
        </span>
        <span class="category-card__volume">
          {{ cat.listingCount }} {{ $t('data.listings') }}
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.datos-section {
  margin-bottom: var(--spacing-10);
}

.datos-section__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-5);
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.category-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-5);
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.category-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}

.category-card--active {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.04);
  box-shadow: var(--shadow-md);
}

.category-card__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.category-card__price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.category-card__trend {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-full);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  align-self: flex-start;
}

.category-card__trend--rising {
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.category-card__trend--falling {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
}

.category-card__trend--stable {
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.category-card__volume {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

@media (min-width: 480px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-4);
  }

  .datos-section__title {
    font-size: var(--font-size-2xl);
  }
}

@media (min-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
