<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="vehicle-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-image" />
        <div class="skeleton-body">
          <div class="skeleton-line wide" />
          <div class="skeleton-line medium" />
          <div class="skeleton-line short" />
        </div>
      </div>
    </div>

    <!-- Vehicle table (list view) -->
    <CatalogVehicleTable v-else-if="displayedVehicles.length && viewMode === 'list'" :vehicles="displayedVehicles" />

    <!-- Vehicle grid -->
    <div v-else-if="displayedVehicles.length" class="vehicle-grid">
      <CatalogVehicleCard
        v-for="vehicle in displayedVehicles"
        :key="vehicle.id"
        :vehicle="vehicle"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <p>{{ $t('catalog.noResults') }}</p>
      <button class="empty-clear" @click="$emit('clearFilters')">
        {{ $t('catalog.clearFilters') }}
      </button>
    </div>

    <!-- Load more -->
    <div v-if="hasMore && vehicles.length" class="load-more">
      <button
        class="load-more-btn"
        :disabled="loadingMore"
        @click="$emit('loadMore')"
      >
        {{ loadingMore ? $t('common.loading') : $t('catalog.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

const props = defineProps<{
  vehicles: readonly Vehicle[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  viewMode?: 'grid' | 'list'
}>()

defineEmits<{
  loadMore: []
  clearFilters: []
}>()

const { favoritesOnly, isFavorite } = useFavorites()
const { searchQuery } = useCatalogState()
const { locale } = useI18n()

const displayedVehicles = computed(() => {
  let result = props.vehicles as Vehicle[]

  // Filter by favorites
  if (favoritesOnly.value) {
    result = result.filter(v => isFavorite(v.id))
  }

  // Fuzzy search client-side
  const q = searchQuery.value?.trim()
  if (q) {
    result = result.filter((v) => {
      const description = locale.value === 'en' ? v.description_en : v.description_es
      const sub = v.types?.type_subcategories?.[0]?.subcategories
      const searchable = [
        sub?.name_es,
        sub?.name_en,
        v.types?.name_es,
        v.types?.name_en,
        v.brand,
        v.model,
        v.location,
        description,
      ].filter(Boolean).join(' ')
      return fuzzyMatch(searchable, q)
    })
  }

  return result
})
</script>

<style scoped>
.vehicle-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 1rem 0.5rem;
}

/* Skeleton */
.skeleton-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color-light);
}

.skeleton-image {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-body {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-line {
  height: 14px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide { width: 80%; }
.skeleton-line.medium { width: 50%; }
.skeleton-line.short { width: 30%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) var(--spacing-4);
  color: var(--text-auxiliary);
  text-align: center;
  gap: var(--spacing-4);
}

.empty-state p {
  font-size: var(--font-size-lg);
}

.empty-clear {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 44px;
  transition: all var(--transition-fast);
}

.empty-clear:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

/* Load more */
.load-more {
  display: flex;
  justify-content: center;
  padding: var(--spacing-6) var(--spacing-4);
}

.load-more-btn {
  padding: var(--spacing-3) var(--spacing-8);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  min-height: 48px;
  transition: background var(--transition-fast);
}

.load-more-btn:hover {
  background: var(--color-primary-light);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive grid */
@media (min-width: 480px) {
  .vehicle-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .vehicle-grid {
    grid-template-columns: repeat(3, 1fr);
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .vehicle-grid {
    padding: 1.5rem 3rem;
  }
}

@media (min-width: 1280px) {
  .vehicle-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
