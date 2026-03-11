<script setup lang="ts">
/**
 * Skeleton card — composable card placeholder for loading states.
 *
 * Usage:
 *   <UiSkeletonCard />                — default 3-line card
 *   <UiSkeletonCard :lines="5" />     — 5-line card
 *   <UiSkeletonCard image />          — card with image placeholder
 *   <UiSkeletonCard :count="6" />     — 6 skeleton cards in a row
 */

withDefaults(
  defineProps<{
    /** Number of text lines */
    lines?: number
    /** Show image placeholder */
    image?: boolean
    /** Number of skeleton cards to render */
    count?: number
    /** Image aspect ratio */
    imageAspect?: number
  }>(),
  {
    lines: 3,
    image: false,
    count: 1,
    imageAspect: 4 / 3,
  },
)

const lineWidths = ['75%', '100%', '60%', '90%', '45%', '80%', '55%', '100%']
</script>

<template>
  <div class="skeleton-card-grid" :class="{ 'skeleton-card-grid--multi': count > 1 }">
    <div v-for="i in count" :key="i" class="skeleton-card" aria-hidden="true">
      <UiSkeleton v-if="image" variant="rect" :aspect="imageAspect" radius="var(--border-radius-md) var(--border-radius-md) 0 0" />
      <div class="skeleton-card__body">
        <UiSkeleton
          v-for="j in lines"
          :key="j"
          :width="lineWidths[(j - 1) % lineWidths.length]"
          :height="j === 1 ? '1.25rem' : '0.875rem'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card-grid--multi {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--spacing-4);
}

.skeleton-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.skeleton-card__body {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
